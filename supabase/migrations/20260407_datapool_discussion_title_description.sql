-- Structured discussions: title + description on root messages (replies leave these null).

ALTER TABLE public.datapool_dataset_messages
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text;
