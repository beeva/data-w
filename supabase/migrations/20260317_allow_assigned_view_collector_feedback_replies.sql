-- Allow assigned workers (collector/agent assignees) to view collector feedback replies
-- for requests they are assigned to. This keeps requester-history reviews visible
-- on worker-side dashboards.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_feedback_replies'
      AND policyname = 'Assigned workers can view collector feedback replies'
  ) THEN
    CREATE POLICY "Assigned workers can view collector feedback replies"
      ON project_feedback_replies
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM collector_assignments
          WHERE collector_assignments.request_id = project_feedback_replies.request_id
            AND collector_assignments.collector_id = auth.uid()
        )
      );
  END IF;
END $$;
