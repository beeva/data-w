-- Denormalized author label so readers see names without profiles RLS blocking other users' rows.

ALTER TABLE public.datapool_dataset_messages
  ADD COLUMN IF NOT EXISTS author_display_name text;

UPDATE public.datapool_dataset_messages m
SET author_display_name = COALESCE(
  NULLIF(trim(p.full_name), ''),
  NULLIF(trim(split_part(p.email, '@', 1)), ''),
  'Member'
)
FROM public.profiles p
WHERE p.id = m.author_id
  AND (m.author_display_name IS NULL OR m.author_display_name = '');

UPDATE public.datapool_dataset_messages
SET author_display_name = 'Member'
WHERE author_display_name IS NULL;

ALTER TABLE public.datapool_dataset_messages
  ALTER COLUMN author_display_name SET DEFAULT 'Member';

ALTER TABLE public.datapool_dataset_messages
  ALTER COLUMN author_display_name SET NOT NULL;
