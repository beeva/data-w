-- Files attached to Data Pool dataset listings.

CREATE TABLE public.datapool_dataset_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES public.datapool_datasets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bucket_id TEXT NOT NULL DEFAULT 'dataset-files',
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_datapool_dataset_files_dataset_id ON public.datapool_dataset_files(dataset_id);
CREATE INDEX idx_datapool_dataset_files_owner_id ON public.datapool_dataset_files(owner_id);

ALTER TABLE public.datapool_dataset_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "datapool_dataset_files_select_all"
  ON public.datapool_dataset_files FOR SELECT
  USING (true);

CREATE POLICY "datapool_dataset_files_insert_owner_personal_company"
  ON public.datapool_dataset_files FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('personal'::public.user_role, 'company'::public.user_role)
    )
    AND EXISTS (
      SELECT 1
      FROM public.datapool_datasets d
      WHERE d.id = datapool_dataset_files.dataset_id
        AND d.owner_id = auth.uid()
    )
  );

CREATE POLICY "datapool_dataset_files_delete_owner_personal_company"
  ON public.datapool_dataset_files FOR DELETE
  USING (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('personal'::public.user_role, 'company'::public.user_role)
    )
  );

