-- Ensure collector/agent dashboards see the same requester history feedback.
-- Workers should be able to read feedback records tied to requester history cards.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_feedback'
      AND policyname = 'Workers can view requester history feedback'
  ) THEN
    CREATE POLICY "Workers can view requester history feedback"
      ON project_feedback
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('collector', 'agent')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_feedback_replies'
      AND policyname = 'Workers can view requester history feedback replies'
  ) THEN
    CREATE POLICY "Workers can view requester history feedback replies"
      ON project_feedback_replies
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('collector', 'agent')
        )
      );
  END IF;
END $$;
