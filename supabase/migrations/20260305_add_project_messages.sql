-- Requester <-> collector text chat after proposal acceptance.
CREATE TABLE IF NOT EXISTS project_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  collector_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL CHECK (char_length(trim(message)) > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_messages_request_collector_created
  ON project_messages(request_id, collector_id, created_at DESC);

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
    -- For environments without realtime publication metadata support.
    NULL;
  WHEN insufficient_privilege THEN
    -- In managed environments where publication is controlled externally.
    NULL;
END $$;

ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_messages'
      AND policyname = 'Requester and assigned collector can view messages'
  ) THEN
    CREATE POLICY "Requester and assigned collector can view messages"
      ON project_messages
      FOR SELECT
      USING (
        (
          requester_id = auth.uid()
          AND EXISTS (
            SELECT 1 FROM requests r
            WHERE r.id = project_messages.request_id
              AND r.requester_id = auth.uid()
          )
        )
        OR
        (
          collector_id = auth.uid()
          AND EXISTS (
            SELECT 1 FROM collector_assignments ca
            WHERE ca.request_id = project_messages.request_id
              AND ca.collector_id = auth.uid()
              AND ca.status IN ('active', 'completed')
          )
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_messages'
      AND policyname = 'Requester and assigned collector can send messages'
  ) THEN
    CREATE POLICY "Requester and assigned collector can send messages"
      ON project_messages
      FOR INSERT
      WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM requests r
          WHERE r.id = project_messages.request_id
            AND r.requester_id = project_messages.requester_id
        )
        AND EXISTS (
          SELECT 1 FROM collector_assignments ca
          WHERE ca.request_id = project_messages.request_id
            AND ca.collector_id = project_messages.collector_id
            AND ca.status IN ('active', 'completed')
        )
        AND (
          requester_id = auth.uid()
          OR collector_id = auth.uid()
        )
      );
  END IF;
END $$;
