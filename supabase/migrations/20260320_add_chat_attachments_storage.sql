-- Storage for chat file attachments (path: {request_id}/{collector_id}/...)
-- Matches project_messages access: requester + assigned collector (active/completed).

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Chat attachments are publicly accessible'
  ) THEN
    CREATE POLICY "Chat attachments are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'chat-attachments');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Requester and collector can upload chat attachments'
  ) THEN
    CREATE POLICY "Requester and collector can upload chat attachments"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'chat-attachments'
      AND EXISTS (
        SELECT 1
        FROM collector_assignments ca
        INNER JOIN requests r ON r.id = ca.request_id
        WHERE ca.request_id::text = split_part(name, '/', 1)
          AND ca.collector_id::text = split_part(name, '/', 2)
          AND ca.status IN ('active', 'completed')
          AND (r.requester_id = auth.uid() OR ca.collector_id = auth.uid())
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Requester and collector can delete own chat attachments'
  ) THEN
    CREATE POLICY "Requester and collector can delete own chat attachments"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'chat-attachments'
      AND EXISTS (
        SELECT 1
        FROM collector_assignments ca
        INNER JOIN requests r ON r.id = ca.request_id
        WHERE ca.request_id::text = split_part(name, '/', 1)
          AND ca.collector_id::text = split_part(name, '/', 2)
          AND ca.status IN ('active', 'completed')
          AND (r.requester_id = auth.uid() OR ca.collector_id = auth.uid())
      )
    );
  END IF;
END $$;
