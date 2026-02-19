-- Add balance column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS balance DECIMAL(10, 2) DEFAULT 0;

-- Add agent validation columns to submissions
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS agent_validated BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS agent_validated_at TIMESTAMPTZ;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES profiles(id);

-- Allow authenticated users to insert transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert transactions'
  ) THEN
    CREATE POLICY "Authenticated users can insert transactions"
      ON transactions FOR INSERT
      WITH CHECK (requester_id = auth.uid());
  END IF;
END $$;

-- Atomically transfer funds from requester to collector
CREATE OR REPLACE FUNCTION transfer_funds(
  p_requester_id UUID,
  p_collector_id UUID,
  p_submission_id UUID,
  p_amount DECIMAL,
  p_platform_fee DECIMAL DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_requester_balance DECIMAL;
  v_tx_id UUID;
BEGIN
  -- Lock the requester row to prevent race conditions
  SELECT balance INTO v_requester_balance
  FROM profiles WHERE id = p_requester_id FOR UPDATE;

  IF v_requester_balance < p_amount + p_platform_fee THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct from requester
  UPDATE profiles
  SET balance = balance - (p_amount + p_platform_fee),
      updated_at = NOW()
  WHERE id = p_requester_id;

  -- Credit collector
  UPDATE profiles
  SET balance = balance + p_amount,
      total_earnings = total_earnings + p_amount,
      updated_at = NOW()
  WHERE id = p_collector_id;

  -- Create transaction record
  INSERT INTO transactions (submission_id, requester_id, collector_id, amount, platform_fee, status, completed_at)
  VALUES (p_submission_id, p_requester_id, p_collector_id, p_amount, p_platform_fee, 'completed', NOW())
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the current user's password server-side (no session side effects)
CREATE OR REPLACE FUNCTION verify_user_password(password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
      AND encrypted_password = crypt(password, encrypted_password)
  );
END;
$$;

-- Agent: fetch dashboard data (stats + all submissions, bypasses RLS for joins)
CREATE OR REPLACE FUNCTION get_agent_dashboard(p_agent_id uuid, p_status_filter text DEFAULT 'all')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_agent_id AND role = 'agent') THEN
    RAISE EXCEPTION 'Access denied: agent only';
  END IF;

  SELECT json_build_object(
    'pendingCount',    (SELECT count(*) FROM submissions WHERE status = 'pending'),
    'validatedToday',  (SELECT count(*) FROM submissions WHERE status IN ('validated','rejected') AND validator_id = p_agent_id AND validated_at::date = CURRENT_DATE),
    'totalValidations',(SELECT count(*) FROM submissions WHERE validator_id = p_agent_id AND status IN ('validated','rejected')),
    'accuracyScore',   (SELECT COALESCE(p.validation_score, 0) FROM profiles p WHERE p.id = p_agent_id),
    'submissions', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT s.id, s.status, s.submitted_at, s.validation_score, s.validated_at,
               s.metadata, s.agent_validated, s.agent_validated_at,
               r.id AS project_id,
               r.title AS project_title,
               r.category AS project_category,
               r.budget AS project_budget,
               cp.id AS collector_id,
               cp.full_name AS collector_name,
               cp.email AS collector_email,
               cp.avatar_url AS collector_avatar,
               vp.full_name AS validator_name,
               ap.full_name AS agent_name,
               (SELECT count(*) FROM data_items di WHERE di.submission_id = s.id) AS files_count
        FROM submissions s
        JOIN requests r  ON r.id = s.request_id
        JOIN profiles cp ON cp.id = s.collector_id
        LEFT JOIN profiles vp ON vp.id = s.validator_id
        LEFT JOIN profiles ap ON ap.id = s.agent_id
        WHERE (p_status_filter = 'all' OR s.status = p_status_filter)
        ORDER BY
          CASE s.status WHEN 'pending' THEN 0 ELSE 1 END,
          s.submitted_at DESC
        LIMIT 100
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Agent: mark submission as agent-validated (pass) or auto-reject (fail)
CREATE OR REPLACE FUNCTION agent_validate_submission(
  p_agent_id uuid,
  p_submission_id uuid,
  p_passed boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_agent_id AND role = 'agent') THEN
    RAISE EXCEPTION 'Access denied: agent only';
  END IF;

  IF p_passed THEN
    UPDATE submissions
    SET agent_validated = TRUE,
        agent_validated_at = NOW(),
        agent_id = p_agent_id
    WHERE id = p_submission_id;
  ELSE
    UPDATE submissions
    SET agent_validated = TRUE,
        agent_validated_at = NOW(),
        agent_id = p_agent_id,
        status = 'rejected',
        validation_score = 0,
        validator_id = p_agent_id,
        validated_at = NOW()
    WHERE id = p_submission_id;
  END IF;
END;
$$;

-- Agent: get data items for a submission (bypasses RLS)
CREATE OR REPLACE FUNCTION agent_get_submission_items(p_agent_id uuid, p_submission_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_agent_id AND role = 'agent') THEN
    RAISE EXCEPTION 'Access denied: agent only';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT di.id, di.file_url, di.file_type, di.file_name, di.file_size,
             di.mime_type, di.thumbnail_url, di.metadata, di.created_at
      FROM data_items di
      WHERE di.submission_id = p_submission_id
      ORDER BY di.created_at ASC
    ) t
  );
END;
$$;

-- Admin: fetch aggregated dashboard stats (bypasses RLS)
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  SELECT json_build_object(
    'totalUsers',       (SELECT count(*) FROM profiles),
    'activeUsers',      (SELECT count(*) FROM profiles WHERE updated_at > now() - interval '30 days'),
    'totalProjects',    (SELECT count(*) FROM requests),
    'activeProjects',   (SELECT count(*) FROM requests WHERE status = 'open'),
    'totalRevenue',     COALESCE((SELECT sum(amount) FROM transactions WHERE status = 'completed'), 0),
    'pendingSubmissions', (SELECT count(*) FROM submissions WHERE status = 'pending'),
    'usersByRole',      (SELECT json_object_agg(role, cnt) FROM (SELECT role, count(*) AS cnt FROM profiles GROUP BY role) r)
  ) INTO result;

  RETURN result;
END;
$$;

-- Admin: fetch recent activity across all tables (bypasses RLS)
CREATE OR REPLACE FUNCTION get_admin_recent_activity(activity_limit integer DEFAULT 20)
RETURNS TABLE(activity_type text, message text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  RETURN QUERY
  SELECT * FROM (
    SELECT 'user'::text,
           ('New user registered: ' || COALESCE(p.full_name, p.email))::text,
           p.created_at
    FROM profiles p

    UNION ALL

    SELECT 'project'::text,
           ('Project created: ' || r.title)::text,
           r.created_at
    FROM requests r

    UNION ALL

    SELECT 'submission'::text,
           ('New submission on "' || COALESCE(r2.title, 'Unknown') || '"')::text,
           s.submitted_at
    FROM submissions s
    LEFT JOIN requests r2 ON r2.id = s.request_id

    UNION ALL

    SELECT 'payment'::text,
           ('Payment of $' || t.amount::text || ' completed')::text,
           COALESCE(t.completed_at, t.created_at)
    FROM transactions t
    WHERE t.status = 'completed'
  ) combined
  ORDER BY created_at DESC
  LIMIT activity_limit;
END;
$$;

-- Admin: list all users with search/filter (bypasses RLS)
CREATE OR REPLACE FUNCTION admin_get_users(
  search_term text DEFAULT '',
  role_filter text DEFAULT 'all',
  result_limit integer DEFAULT 100,
  result_offset integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  SELECT json_build_object(
    'users', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT p.id, p.email, p.full_name, p.avatar_url, p.role,
               p.verification_tier, p.created_at, p.updated_at, p.balance,
               p.total_earnings, p.total_submissions, p.rating
        FROM profiles p
        WHERE (search_term = '' OR p.email ILIKE '%' || search_term || '%' OR p.full_name ILIKE '%' || search_term || '%')
          AND (role_filter = 'all' OR p.role::text = role_filter)
        ORDER BY p.created_at DESC
        LIMIT result_limit OFFSET result_offset
      ) t
    ),
    'total', (
      SELECT count(*)
      FROM profiles p
      WHERE (search_term = '' OR p.email ILIKE '%' || search_term || '%' OR p.full_name ILIKE '%' || search_term || '%')
        AND (role_filter = 'all' OR p.role::text = role_filter)
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Admin: update a user's role (bypasses RLS)
CREATE OR REPLACE FUNCTION admin_update_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  IF new_role NOT IN ('requester', 'collector', 'agent', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  UPDATE profiles SET role = new_role::user_role, updated_at = NOW()
  WHERE id = target_user_id;
END;
$$;

-- ============================================================
-- Support Tickets
-- ============================================================

DO $$ BEGIN CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS ticket_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket ON ticket_replies(ticket_id);

ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view replies on own tickets" ON ticket_replies FOR SELECT
    USING (
      EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can reply to own tickets" ON ticket_replies FOR INSERT
    WITH CHECK (
      auth.uid() = user_id
      AND (
        EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION admin_get_tickets(
  status_filter text DEFAULT 'all',
  search_term text DEFAULT '',
  result_limit integer DEFAULT 50,
  result_offset integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  SELECT json_build_object(
    'tickets', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT tk.id, tk.subject, tk.message, tk.status, tk.priority,
               tk.created_at, tk.updated_at, tk.resolved_at,
               tk.user_id,
               p.full_name AS user_name,
               p.email AS user_email,
               p.avatar_url AS user_avatar,
               p.role AS user_role,
               (SELECT count(*) FROM ticket_replies tr WHERE tr.ticket_id = tk.id) AS reply_count
        FROM support_tickets tk
        JOIN profiles p ON p.id = tk.user_id
        WHERE (status_filter = 'all' OR tk.status::text = status_filter)
          AND (search_term = '' OR tk.subject ILIKE '%' || search_term || '%' OR p.full_name ILIKE '%' || search_term || '%' OR p.email ILIKE '%' || search_term || '%')
        ORDER BY
          CASE tk.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'resolved' THEN 2 WHEN 'closed' THEN 3 END,
          CASE tk.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 WHEN 'low' THEN 3 END,
          tk.created_at DESC
        LIMIT result_limit OFFSET result_offset
      ) t
    ),
    'total', (
      SELECT count(*)
      FROM support_tickets tk
      JOIN profiles p ON p.id = tk.user_id
      WHERE (status_filter = 'all' OR tk.status::text = status_filter)
        AND (search_term = '' OR tk.subject ILIKE '%' || search_term || '%' OR p.full_name ILIKE '%' || search_term || '%' OR p.email ILIKE '%' || search_term || '%')
    )
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION admin_get_ticket_replies(p_ticket_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT tr.id, tr.message, tr.created_at, tr.user_id,
             p.full_name, p.email, p.avatar_url, p.role
      FROM ticket_replies tr
      JOIN profiles p ON p.id = tr.user_id
      WHERE tr.ticket_id = p_ticket_id
      ORDER BY tr.created_at ASC
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION admin_reply_ticket(
  p_ticket_id uuid,
  p_message text,
  p_status text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  INSERT INTO ticket_replies (ticket_id, user_id, message)
  VALUES (p_ticket_id, auth.uid(), p_message);

  IF p_status IS NOT NULL THEN
    UPDATE support_tickets
    SET status = p_status::ticket_status,
        updated_at = NOW(),
        resolved_at = CASE WHEN p_status IN ('resolved', 'closed') THEN NOW() ELSE resolved_at END
    WHERE id = p_ticket_id;
  ELSE
    UPDATE support_tickets SET updated_at = NOW() WHERE id = p_ticket_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION admin_update_ticket_status(p_ticket_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  UPDATE support_tickets
  SET status = p_status::ticket_status,
      updated_at = NOW(),
      resolved_at = CASE WHEN p_status IN ('resolved', 'closed') THEN NOW() ELSE resolved_at END
  WHERE id = p_ticket_id;
END;
$$;
