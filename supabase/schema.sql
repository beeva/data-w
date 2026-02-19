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
  
  -- Wallet balance (all users)
  balance DECIMAL(10, 2) DEFAULT 0,
  
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

