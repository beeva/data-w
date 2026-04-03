-- Collectors may sell datasets on the Data Pool but cannot purchase other listings.

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

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_buyer AND p.role = 'collector'::public.user_role
  ) THEN
    RAISE EXCEPTION 'Collectors cannot purchase datasets';
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
