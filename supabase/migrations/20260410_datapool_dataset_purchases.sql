-- Marketplace purchases for Data Pool datasets (wallet balance).
-- Gates file metadata and storage reads to owners and buyers.

CREATE TABLE public.datapool_dataset_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dataset_id UUID NOT NULL REFERENCES public.datapool_datasets(id) ON DELETE CASCADE,
  price_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (buyer_id, dataset_id)
);

CREATE INDEX idx_datapool_dataset_purchases_buyer
  ON public.datapool_dataset_purchases(buyer_id, created_at DESC);
CREATE INDEX idx_datapool_dataset_purchases_dataset
  ON public.datapool_dataset_purchases(dataset_id);

ALTER TABLE public.datapool_dataset_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "datapool_dataset_purchases_select_own"
  ON public.datapool_dataset_purchases FOR SELECT
  USING (buyer_id = auth.uid());

CREATE OR REPLACE FUNCTION public.purchase_datapool_dataset(p_dataset_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer UUID := auth.uid();
  v_owner UUID;
  v_price NUMERIC(10, 2);
  v_balance NUMERIC(10, 2);
  v_purchase_id UUID;
BEGIN
  IF v_buyer IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT d.owner_id, d.price
  INTO v_owner, v_price
  FROM public.datapool_datasets d
  WHERE d.id = p_dataset_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dataset not found';
  END IF;

  IF v_owner = v_buyer THEN
    RAISE EXCEPTION 'You cannot purchase your own dataset';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.datapool_dataset_purchases p
    WHERE p.dataset_id = p_dataset_id AND p.buyer_id = v_buyer
  ) THEN
    RAISE EXCEPTION 'Already purchased';
  END IF;

  v_price := COALESCE(v_price, 0);
  IF v_price < 0 THEN
    RAISE EXCEPTION 'Invalid price';
  END IF;

  IF v_price > 0 THEN
    SELECT balance INTO v_balance FROM public.profiles WHERE id = v_buyer FOR UPDATE;
    IF v_balance IS NULL THEN
      RAISE EXCEPTION 'User not found';
    END IF;
    IF v_balance < v_price THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;

    UPDATE public.profiles
    SET balance = balance - v_price, updated_at = NOW()
    WHERE id = v_buyer;

    UPDATE public.profiles
    SET balance = balance + v_price,
        total_earnings = total_earnings + v_price,
        updated_at = NOW()
    WHERE id = v_owner;
  END IF;

  INSERT INTO public.datapool_dataset_purchases (buyer_id, dataset_id, price_paid)
  VALUES (v_buyer, p_dataset_id, v_price)
  RETURNING id INTO v_purchase_id;

  INSERT INTO public.transactions (
    submission_id,
    requester_id,
    collector_id,
    amount,
    platform_fee,
    status,
    completed_at
  ) VALUES (
    NULL,
    v_buyer,
    v_owner,
    v_price,
    0,
    'completed',
    NOW()
  );

  RETURN v_purchase_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_datapool_dataset(UUID) TO authenticated;

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
  owner_id UUID,
  is_purchased BOOLEAN
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
    d.owner_id,
    EXISTS (
      SELECT 1
      FROM public.datapool_dataset_purchases pur
      WHERE pur.dataset_id = d.id
        AND pur.buyer_id = auth.uid()
    ) AS is_purchased
  FROM datapool_datasets d
  LEFT JOIN profiles p ON p.id = d.owner_id
  ORDER BY d.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_datapool_items() TO anon, authenticated;

DROP POLICY IF EXISTS "datapool_dataset_files_select_all" ON public.datapool_dataset_files;

CREATE POLICY "datapool_dataset_files_select_owner_or_buyer"
  ON public.datapool_dataset_files FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.datapool_dataset_purchases pur
      WHERE pur.dataset_id = datapool_dataset_files.dataset_id
        AND pur.buyer_id = auth.uid()
    )
  );

UPDATE storage.buckets SET public = false WHERE id = 'dataset-files';

DROP POLICY IF EXISTS "Dataset files are publicly accessible" ON storage.objects;

CREATE POLICY "Dataset files read owner or purchaser"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'dataset-files'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.datapool_dataset_files df
        INNER JOIN public.datapool_dataset_purchases pur
          ON pur.dataset_id = df.dataset_id
         AND pur.buyer_id = auth.uid()
        WHERE df.bucket_id = 'dataset-files'
          AND df.storage_path = name
      )
    )
  );
