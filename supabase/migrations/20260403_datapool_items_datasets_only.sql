-- Data Pool feed: only `datapool_datasets` rows (exclude completed projects).

DROP FUNCTION IF EXISTS public.get_datapool_items();

CREATE OR REPLACE FUNCTION public.get_datapool_items()
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  price DECIMAL(10, 2),
  owner TEXT,
  description TEXT,
  data_types TEXT[],
  formats TEXT[],
  item_kind TEXT,
  owner_id UUID
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.id,
    d.title,
    d.category,
    d.price,
    COALESCE(NULLIF(p.full_name, ''), p.email, 'Unknown') AS owner,
    COALESCE(d.description, ''),
    d.data_types,
    d.formats,
    'dataset'::TEXT AS item_kind,
    d.owner_id
  FROM datapool_datasets d
  LEFT JOIN profiles p
    ON p.id = d.owner_id
  ORDER BY d.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_datapool_items() TO anon, authenticated;
