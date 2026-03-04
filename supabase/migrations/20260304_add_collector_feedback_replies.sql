-- Collector feedback to requester after requester completes project.
CREATE TABLE IF NOT EXISTS project_feedback_replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  collector_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (request_id, collector_id)
);

CREATE INDEX IF NOT EXISTS idx_project_feedback_replies_request
  ON project_feedback_replies(request_id);
CREATE INDEX IF NOT EXISTS idx_project_feedback_replies_collector
  ON project_feedback_replies(collector_id);

ALTER TABLE project_feedback_replies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_feedback_replies'
      AND policyname = 'Collectors can manage own project feedback replies'
  ) THEN
    CREATE POLICY "Collectors can manage own project feedback replies"
      ON project_feedback_replies
      FOR ALL
      USING (collector_id = auth.uid())
      WITH CHECK (collector_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_feedback_replies'
      AND policyname = 'Requesters can view replies for own requests'
  ) THEN
    CREATE POLICY "Requesters can view replies for own requests"
      ON project_feedback_replies
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM requests
          WHERE requests.id = project_feedback_replies.request_id
            AND requests.requester_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Let assigned collectors read requester feedback so they can provide reciprocal feedback.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_feedback'
      AND policyname = 'Assigned collectors can view requester feedback'
  ) THEN
    CREATE POLICY "Assigned collectors can view requester feedback"
      ON project_feedback
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM collector_assignments
          WHERE collector_assignments.request_id = project_feedback.request_id
            AND collector_assignments.collector_id = auth.uid()
        )
      );
  END IF;
END $$;
