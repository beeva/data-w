-- Add balance column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS balance DECIMAL(10, 2) DEFAULT 0;

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

-- Agent: fetch dashboard data (stats + pending submissions, bypasses RLS for joins)
CREATE OR REPLACE FUNCTION get_agent_dashboard(p_agent_id uuid)
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
    'pendingSubmissions', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT s.id, s.status, s.submitted_at, s.validation_score,
               r.title  AS project_title,
               r.category AS project_category,
               cp.full_name AS collector_name,
               cp.email AS collector_email,
               cp.avatar_url AS collector_avatar,
               (SELECT count(*) FROM data_items di WHERE di.submission_id = s.id) AS files_count
        FROM submissions s
        JOIN requests r  ON r.id = s.request_id
        JOIN profiles cp ON cp.id = s.collector_id
        WHERE s.status = 'pending'
        ORDER BY s.submitted_at DESC
        LIMIT 20
      ) t
    )
  ) INTO result;

  RETURN result;
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
