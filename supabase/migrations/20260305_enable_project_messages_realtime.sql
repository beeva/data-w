-- Ensure project_messages participates in Supabase Realtime publication.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'project_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_messages;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
  WHEN insufficient_privilege THEN
    NULL;
END $$;
