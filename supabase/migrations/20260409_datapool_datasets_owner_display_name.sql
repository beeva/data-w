-- Denormalized dataset owner label so readers can see owner names without profiles RLS.

ALTER TABLE public.datapool_datasets
  ADD COLUMN IF NOT EXISTS owner_display_name text;

UPDATE public.datapool_datasets d
SET owner_display_name = COALESCE(
  NULLIF(trim(p.full_name), ''),
  NULLIF(trim(split_part(p.email, '@', 1)), ''),
  'Member'
)
FROM public.profiles p
WHERE p.id = d.owner_id
  AND (d.owner_display_name IS NULL OR d.owner_display_name = '');

UPDATE public.datapool_datasets
SET owner_display_name = 'Member'
WHERE owner_display_name IS NULL;

ALTER TABLE public.datapool_datasets
  ALTER COLUMN owner_display_name SET DEFAULT 'Member';

ALTER TABLE public.datapool_datasets
  ALTER COLUMN owner_display_name SET NOT NULL;
