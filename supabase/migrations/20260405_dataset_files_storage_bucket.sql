-- Storage bucket for dataset listing files (path: {user_id}/datapool_datasets/{dataset_id}/...).

INSERT INTO storage.buckets (id, name, public)
VALUES ('dataset-files', 'dataset-files', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Dataset files are publicly accessible'
  ) THEN
    CREATE POLICY "Dataset files are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'dataset-files');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload own dataset files'
  ) THEN
    CREATE POLICY "Users can upload own dataset files"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'dataset-files'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete own dataset files'
  ) THEN
    CREATE POLICY "Users can delete own dataset files"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'dataset-files'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

