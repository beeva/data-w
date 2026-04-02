-- Community messages (chat/article-style thread) for dataset detail pages.

CREATE TABLE IF NOT EXISTS public.datapool_dataset_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES public.datapool_datasets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.datapool_dataset_messages(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_datapool_dataset_messages_dataset_id
  ON public.datapool_dataset_messages(dataset_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_datapool_dataset_messages_author_id
  ON public.datapool_dataset_messages(author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_datapool_dataset_messages_parent_id
  ON public.datapool_dataset_messages(parent_id, created_at DESC);

ALTER TABLE public.datapool_dataset_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "datapool_dataset_messages_select_all"
  ON public.datapool_dataset_messages FOR SELECT
  USING (true);

CREATE POLICY "datapool_dataset_messages_insert_authenticated"
  ON public.datapool_dataset_messages FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND length(trim(body)) > 0
  );

CREATE POLICY "datapool_dataset_messages_update_own"
  ON public.datapool_dataset_messages FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "datapool_dataset_messages_delete_own"
  ON public.datapool_dataset_messages FOR DELETE
  USING (author_id = auth.uid());

