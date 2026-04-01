-- Expose project requirements (data types & formats) on DataPool RPC for filtering.

DROP FUNCTION IF EXISTS public.get_datapool_items();

CREATE OR REPLACE FUNCTION get_datapool_items()
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  price DECIMAL(10, 2),
  owner TEXT,
  description TEXT,
  data_types TEXT[],
  formats TEXT[]
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
    r.description,
    COALESCE(
      ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(r.requirements -> 'data_types', '[]'::jsonb))
      ),
      ARRAY[]::TEXT[]
    ) AS data_types,
    COALESCE(
      ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(r.requirements -> 'formats', '[]'::jsonb))
      ),
      ARRAY[]::TEXT[]
    ) AS formats
  FROM requests r
  JOIN submissions s
    ON s.request_id = r.id
   AND s.status = 'validated'
  JOIN data_items di
    ON di.submission_id = s.id
  LEFT JOIN profiles p
    ON p.id = r.requester_id
  WHERE r.status = 'completed'
  GROUP BY r.id, r.title, r.category, r.description, r.requirements, p.full_name, p.email
  ORDER BY MAX(di.created_at) DESC;
$$;

GRANT EXECUTE ON FUNCTION get_datapool_items() TO anon, authenticated;
