-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- User Roles Enum
CREATE TYPE user_role AS ENUM ('requester', 'collector', 'agent', 'admin');

-- User Verification Tier Enum
CREATE TYPE verification_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'collector',
  verification_tier verification_tier DEFAULT 'bronze',
  avatar_url TEXT,
  bio TEXT,
  location JSONB, -- {lat, lng, address, city, country}
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Wallet balance (all users)
  balance DECIMAL(10, 2) DEFAULT 0,

  -- Subscription tier (synced from user_subscriptions)
  subscription_tier TEXT DEFAULT 'free',

  -- Requester specific fields
  company_name TEXT,
  company_website TEXT,
  
  -- Collector specific fields
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  total_submissions INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0, -- 0.00 to 5.00
  completed_tasks INTEGER DEFAULT 0,
  
  -- Agent/Validator specific fields
  validation_score DECIMAL(5, 2) DEFAULT 0, -- Average validation accuracy
  total_validations INTEGER DEFAULT 0,
  
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

-- Create indexes for profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_verification_tier ON profiles(verification_tier);
-- Index for location JSONB (using B-tree for JSONB queries)
CREATE INDEX idx_profiles_location ON profiles USING GIN(location);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow requesters to view collector profiles when they have requests
-- We check requests first to avoid circular dependency with proposals
-- Use a security definer function to avoid circular RLS checks
-- This function bypasses RLS to check proposals without triggering recursion
CREATE OR REPLACE FUNCTION can_view_collector_profile(collector_profile_id UUID, requester_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Use SECURITY DEFINER to bypass RLS and avoid infinite recursion
  RETURN EXISTS (
    SELECT 1 FROM requests r
    WHERE r.requester_id = requester_user_id
    AND EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.request_id = r.id
      AND p.collector_id = collector_profile_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE POLICY "Requesters can view collector profiles for their requests"
  ON profiles FOR SELECT
  USING (
    can_view_collector_profile(profiles.id, auth.uid())
  );

-- Allow viewing requester profiles for open requests (so collectors can see requester info)
CREATE POLICY "Users can view requester profiles for open requests"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.requester_id = profiles.id
      AND requests.status = 'open'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create requests table
CREATE TABLE requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  requirements JSONB NOT NULL, -- {data_types: [], formats: [], specifications: {}}
  location JSONB, -- {lat, lng, radius_km, address}
  budget DECIMAL(10, 2) NOT NULL,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'open', -- open, in_progress, completed, cancelled
  max_collectors INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for requests
CREATE INDEX idx_requests_requester ON requests(requester_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_category ON requests(category);
-- Index for location JSONB (using GIN for JSONB queries)
CREATE INDEX idx_requests_location ON requests USING GIN(location);
CREATE INDEX idx_requests_created ON requests(created_at DESC);

-- Enable RLS for requests
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for requests
CREATE POLICY "Anyone can view open requests"
  ON requests FOR SELECT
  USING (status = 'open' OR requester_id = auth.uid());

CREATE POLICY "Requesters can create requests"
  ON requests FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'requester')
  );

CREATE POLICY "Requesters can update their own requests"
  ON requests FOR UPDATE
  USING (requester_id = auth.uid());

-- Create proposals table (collectors submit proposals to projects)
CREATE TABLE proposals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  collector_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, withdrawn
  location JSONB NOT NULL, -- {address, lat, lng, city, country}
  capabilities JSONB NOT NULL, -- {data_types, equipment, experience_years, languages, availability, notes}
  proposed_budget DECIMAL(10, 2),
  message TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, collector_id) -- One proposal per collector per project
);

-- Create indexes for proposals
CREATE INDEX idx_proposals_request ON proposals(request_id);
CREATE INDEX idx_proposals_collector ON proposals(collector_id);
CREATE INDEX idx_proposals_status ON proposals(status);

-- Enable RLS for proposals
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for proposals
CREATE POLICY "Collectors can view their own proposals"
  ON proposals FOR SELECT
  USING (collector_id = auth.uid());

CREATE POLICY "Requesters can view proposals for their requests"
  ON proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requests 
      WHERE requests.id = proposals.request_id 
      AND requests.requester_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view proposals for open requests"
  ON proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requests 
      WHERE requests.id = proposals.request_id 
      AND requests.status = 'open'
    )
  );

CREATE POLICY "Collectors can create proposals"
  ON proposals FOR INSERT
  WITH CHECK (
    collector_id = auth.uid()
  );

CREATE POLICY "Collectors can update their own pending proposals"
  ON proposals FOR UPDATE
  USING (collector_id = auth.uid() AND status = 'pending');

CREATE POLICY "Requesters can update proposals for their requests"
  ON proposals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM requests 
      WHERE requests.id = proposals.request_id 
      AND requests.requester_id = auth.uid()
    )
  );

-- Create collector_assignments table (selected collectors with unique submission links)
CREATE TABLE collector_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  collector_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  submission_token TEXT UNIQUE NOT NULL, -- Unique token for submission link
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, collector_id) -- One assignment per collector per project
);

-- Create indexes for collector_assignments
CREATE INDEX idx_collector_assignments_request ON collector_assignments(request_id);
CREATE INDEX idx_collector_assignments_collector ON collector_assignments(collector_id);
CREATE INDEX idx_collector_assignments_token ON collector_assignments(submission_token);
CREATE INDEX idx_collector_assignments_status ON collector_assignments(status);

-- Enable RLS for collector_assignments
ALTER TABLE collector_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collector_assignments
CREATE POLICY "Collectors can view their own assignments"
  ON collector_assignments FOR SELECT
  USING (collector_id = auth.uid());

CREATE POLICY "Requesters can view assignments for their requests"
  ON collector_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requests 
      WHERE requests.id = collector_assignments.request_id 
      AND requests.requester_id = auth.uid()
    )
  );

CREATE POLICY "Requesters can create assignments for their requests"
  ON collector_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM requests 
      WHERE requests.id = collector_assignments.request_id 
      AND requests.requester_id = auth.uid()
    )
  );

CREATE POLICY "Requesters can update assignments for their requests"
  ON collector_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM requests 
      WHERE requests.id = collector_assignments.request_id 
      AND requests.requester_id = auth.uid()
    )
  );

-- Function to generate unique submission token
CREATE OR REPLACE FUNCTION generate_submission_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on proposals
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on collector_assignments
CREATE TRIGGER update_collector_assignments_updated_at BEFORE UPDATE ON collector_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create submissions table
CREATE TABLE submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  collector_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, validated, rejected, disputed
  validation_score INTEGER, -- 0-100
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  validated_at TIMESTAMPTZ,
  validator_id UUID REFERENCES profiles(id),
  agent_validated BOOLEAN DEFAULT FALSE,
  agent_validated_at TIMESTAMPTZ,
  agent_id UUID REFERENCES profiles(id),
  metadata JSONB, -- {device_info, gps_data, timestamp, etc.}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for submissions
CREATE INDEX idx_submissions_request ON submissions(request_id);
CREATE INDEX idx_submissions_collector ON submissions(collector_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_validator ON submissions(validator_id);

-- Enable RLS for submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for submissions
CREATE POLICY "Collectors can view their own submissions"
  ON submissions FOR SELECT
  USING (collector_id = auth.uid());

CREATE POLICY "Requesters can view submissions for their requests"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requests 
      WHERE requests.id = submissions.request_id 
      AND requests.requester_id = auth.uid()
    )
  );

CREATE POLICY "Agents can view all submissions for validation"
  ON submissions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
  );

CREATE POLICY "Collectors can create submissions for assigned projects"
  ON submissions FOR INSERT
  WITH CHECK (
    collector_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM collector_assignments
      WHERE collector_assignments.request_id = submissions.request_id
      AND collector_assignments.collector_id = auth.uid()
      AND collector_assignments.status = 'active'
    )
  );

-- Create data_items table (individual files)
CREATE TABLE data_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- image, video, audio, document, etc.
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  thumbnail_url TEXT,
  price DECIMAL(10, 2),
  metadata JSONB, -- EXIF data, duration, dimensions, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for data_items
CREATE INDEX idx_data_items_submission ON data_items(submission_id);
CREATE INDEX idx_data_items_type ON data_items(file_type);

-- Enable RLS for data_items
ALTER TABLE data_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data_items (inherits from submissions)
CREATE POLICY "Users can view data items for accessible submissions"
  ON data_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM submissions 
      WHERE submissions.id = data_items.submission_id
      AND (
        submissions.collector_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM requests 
          WHERE requests.id = submissions.request_id 
          AND requests.requester_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
      )
    )
  );

CREATE POLICY "Collectors can create data items for their submissions"
  ON data_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = data_items.submission_id
      AND submissions.collector_id = auth.uid()
    )
  );

CREATE POLICY "Collectors can update data items for their submissions"
  ON data_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = data_items.submission_id
      AND submissions.collector_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = data_items.submission_id
      AND submissions.collector_id = auth.uid()
    )
  );

-- Create transactions table
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  requester_id UUID REFERENCES profiles(id) NOT NULL,
  collector_id UUID REFERENCES profiles(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  validator_fee DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending', -- pending, completed, refunded, failed
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for transactions
CREATE INDEX idx_transactions_requester ON transactions(requester_id);
CREATE INDEX idx_transactions_collector ON transactions(collector_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Enable RLS for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (requester_id = auth.uid() OR collector_id = auth.uid());

-- Create validations table
CREATE TABLE validations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE NOT NULL,
  validator_id UUID REFERENCES profiles(id) NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  technical_checks JSONB, -- {metadata_valid, location_valid, timestamp_valid, etc.}
  ai_fraud_detection JSONB, -- {is_ai_generated, confidence, flags}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for validations
CREATE INDEX idx_validations_submission ON validations(submission_id);
CREATE INDEX idx_validations_validator ON validations(validator_id);

-- Enable RLS for validations
ALTER TABLE validations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for validations
CREATE POLICY "Agents can view all validations"
  ON validations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
  );

CREATE POLICY "Users can view validations for their submissions"
  ON validations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM submissions 
      WHERE submissions.id = validations.submission_id
      AND (
        submissions.collector_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM requests 
          WHERE requests.id = submissions.request_id 
          AND requests.requester_id = auth.uid()
        )
      )
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Allow any authenticated user to create notifications for any user.
-- This lets one user's actions generate notifications for another user,
-- while still keeping read access scoped by user_id.
CREATE POLICY "Users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Allow authenticated users to insert transactions (needed for wallet transfers)
CREATE POLICY "Authenticated users can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (requester_id = auth.uid());

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

-- Deduct project budget from requester balance at project creation
CREATE OR REPLACE FUNCTION deduct_project_budget(
  p_requester_id UUID,
  p_amount DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  SELECT balance INTO v_balance
  FROM profiles WHERE id = p_requester_id FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE profiles
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE id = p_requester_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Credit collector on submission approval (requester already paid at project creation)
CREATE OR REPLACE FUNCTION credit_collector(
  p_requester_id UUID,
  p_collector_id UUID,
  p_submission_id UUID,
  p_amount DECIMAL
)
RETURNS UUID AS $$
DECLARE
  v_tx_id UUID;
BEGIN
  UPDATE profiles
  SET balance = balance + p_amount,
      total_earnings = total_earnings + p_amount,
      updated_at = NOW()
  WHERE id = p_collector_id;

  INSERT INTO transactions (submission_id, requester_id, collector_id, amount, platform_fee, status, completed_at)
  VALUES (p_submission_id, p_requester_id, p_collector_id, p_amount, 0, 'completed', NOW())
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

CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE support_tickets (
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

CREATE INDEX idx_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE ticket_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_replies_ticket ON ticket_replies(ticket_id);

ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view replies on own tickets"
  ON ticket_replies FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Users can reply to own tickets"
  ON ticket_replies FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    )
  );

-- Admin: list all tickets with user info (bypasses RLS)
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

-- Admin: get replies for a ticket (bypasses RLS)
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

-- Admin: reply to a ticket and optionally change status (bypasses RLS)
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

-- Admin: update ticket status only
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

-- ═══════════════════════════════════════════════════════════
-- Crypto Deposits
-- ═══════════════════════════════════════════════════════════

CREATE TABLE crypto_deposits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  payment_id TEXT UNIQUE NOT NULL,
  order_id TEXT UNIQUE NOT NULL,
  amount_usd DECIMAL(10, 2) NOT NULL,
  pay_amount DECIMAL(20, 8),
  actually_paid DECIMAL(20, 8) DEFAULT 0,
  pay_currency TEXT NOT NULL,
  pay_address TEXT,
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX idx_crypto_deposits_user ON crypto_deposits(user_id);
CREATE INDEX idx_crypto_deposits_payment_id ON crypto_deposits(payment_id);
CREATE INDEX idx_crypto_deposits_status ON crypto_deposits(status);

ALTER TABLE crypto_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deposits"
  ON crypto_deposits FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service can insert deposits"
  ON crypto_deposits FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Credit user balance when a crypto deposit is confirmed (called from webhook)
CREATE OR REPLACE FUNCTION credit_user_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_payment_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deposit_status TEXT;
BEGIN
  SELECT status INTO v_deposit_status
  FROM crypto_deposits
  WHERE payment_id = p_payment_id AND user_id = p_user_id
  FOR UPDATE;

  IF v_deposit_status IS NULL THEN
    RAISE EXCEPTION 'Deposit not found';
  END IF;

  IF v_deposit_status = 'confirmed' THEN
    RETURN TRUE;
  END IF;

  UPDATE profiles
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  UPDATE crypto_deposits
  SET status = 'confirmed',
      confirmed_at = NOW(),
      updated_at = NOW()
  WHERE payment_id = p_payment_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════
-- Subscriptions
-- ═══════════════════════════════════════════════════════════

CREATE TABLE user_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Subscribe to a plan (charges wallet balance)
CREATE OR REPLACE FUNCTION subscribe_to_plan(
  p_user_id UUID,
  p_plan_id TEXT,
  p_tier TEXT,
  p_billing_cycle TEXT,
  p_price DECIMAL
)
RETURNS UUID AS $$
DECLARE
  v_balance DECIMAL;
  v_sub_id UUID;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Lock user row
  SELECT balance INTO v_balance
  FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Free plan doesn't require balance
  IF p_price > 0 AND v_balance < p_price THEN
    RAISE EXCEPTION 'Insufficient balance. Please deposit funds first.';
  END IF;

  -- Calculate period end
  IF p_billing_cycle = 'yearly' THEN
    v_period_end := NOW() + INTERVAL '1 year';
  ELSE
    v_period_end := NOW() + INTERVAL '1 month';
  END IF;

  -- Cancel any existing active subscription
  UPDATE user_subscriptions
  SET status = 'cancelled', updated_at = NOW()
  WHERE user_id = p_user_id AND status = 'active';

  -- Deduct balance if paid plan
  IF p_price > 0 THEN
    UPDATE profiles
    SET balance = balance - p_price, updated_at = NOW()
    WHERE id = p_user_id;
  END IF;

  -- Update profile tier
  UPDATE profiles
  SET subscription_tier = p_tier, updated_at = NOW()
  WHERE id = p_user_id;

  -- Create subscription record
  INSERT INTO user_subscriptions (
    user_id, plan_id, tier, billing_cycle, price, status,
    current_period_start, current_period_end
  )
  VALUES (
    p_user_id, p_plan_id, p_tier, p_billing_cycle, p_price, 'active',
    NOW(), v_period_end
  )
  RETURNING id INTO v_sub_id;

  RETURN v_sub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cancel subscription (sets cancel_at_period_end or immediately)
CREATE OR REPLACE FUNCTION cancel_subscription(
  p_user_id UUID,
  p_immediate BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_immediate THEN
    UPDATE user_subscriptions
    SET status = 'cancelled', updated_at = NOW()
    WHERE user_id = p_user_id AND status = 'active';

    UPDATE profiles
    SET subscription_tier = 'free', updated_at = NOW()
    WHERE id = p_user_id;
  ELSE
    UPDATE user_subscriptions
    SET cancel_at_period_end = TRUE, updated_at = NOW()
    WHERE user_id = p_user_id AND status = 'active';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

