-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Set up storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create storage bucket for submission files
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true);

CREATE POLICY "Submission files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'submissions');

CREATE POLICY "Collectors can upload submission files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'submissions' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Collectors can delete their submission files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'submissions' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
-- Chat attachments (path: {request_id}/{collector_id}/...)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Chat attachments are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');

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