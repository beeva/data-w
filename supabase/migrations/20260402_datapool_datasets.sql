-- User-listed datasets on the Data Pool marketplace (personal & company accounts only).

CREATE TABLE public.datapool_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  data_types TEXT[] NOT NULL DEFAULT '{}',
  formats TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_datapool_datasets_owner_id ON public.datapool_datasets(owner_id);
CREATE INDEX idx_datapool_datasets_created_at ON public.datapool_datasets(created_at DESC);

ALTER TABLE public.datapool_datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "datapool_datasets_select_all"
  ON public.datapool_datasets FOR SELECT
  USING (true);

CREATE POLICY "datapool_datasets_insert_personal_company"
  ON public.datapool_datasets FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('personal'::public.user_role, 'company'::public.user_role)
    )
  );

CREATE POLICY "datapool_datasets_update_own_personal_company"
  ON public.datapool_datasets FOR UPDATE
  USING (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('personal'::public.user_role, 'company'::public.user_role)
    )
  );

CREATE POLICY "datapool_datasets_delete_own_personal_company"
  ON public.datapool_datasets FOR DELETE
  USING (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('personal'::public.user_role, 'company'::public.user_role)
    )
  );

CREATE OR REPLACE FUNCTION public.touch_datapool_datasets_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_datapool_datasets_updated_at
  BEFORE UPDATE ON public.datapool_datasets
  FOR EACH ROW EXECUTE FUNCTION public.touch_datapool_datasets_updated_at();

-- Marketplace RPC: user-listed datasets only (not completed projects).
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
