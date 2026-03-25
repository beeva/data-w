-- Remove per-file visibility; keep optional per-file pricing.
-- Also updates the DataPool RPC to stop referencing data_items.visibility.

ALTER TABLE data_items
  DROP COLUMN IF EXISTS visibility;

-- Public marketplace feed of completed project data.
-- Uses SECURITY DEFINER to expose limited non-sensitive fields to anon/authenticated users.
DROP FUNCTION IF EXISTS public.get_datapool_items();
CREATE OR REPLACE FUNCTION get_datapool_items()
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  price DECIMAL(10, 2),
  owner TEXT,
  description TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.title,
    r.category,
    MAX(di.price) AS price,
    COALESCE(NULLIF(p.full_name, ''), p.email, 'Unknown requester') AS owner,
    r.description
  FROM requests r
  JOIN submissions s
    ON s.request_id = r.id
   AND s.status = 'validated'
  JOIN data_items di
    ON di.submission_id = s.id
  LEFT JOIN profiles p
    ON p.id = r.requester_id
  WHERE r.status = 'completed'
  GROUP BY r.id, r.title, r.category, r.description, p.full_name, p.email
  ORDER BY MAX(di.created_at) DESC;
$$;

GRANT EXECUTE ON FUNCTION get_datapool_items() TO anon, authenticated;
