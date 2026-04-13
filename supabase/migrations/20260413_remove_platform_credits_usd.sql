-- Remove in-database USD/platform credits; payouts and purchases are tracked for audit only.
-- Economic settlement is expected on-chain (DATAW).

CREATE OR REPLACE FUNCTION transfer_funds(
  p_requester_id UUID,
  p_collector_id UUID,
  p_submission_id UUID,
  p_amount DECIMAL,
  p_platform_fee DECIMAL DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_tx_id UUID;
BEGIN
  UPDATE profiles
  SET total_earnings = total_earnings + p_amount,
      updated_at = NOW()
  WHERE id = p_collector_id;

  INSERT INTO transactions (submission_id, requester_id, collector_id, amount, platform_fee, status, completed_at)
  VALUES (p_submission_id, p_requester_id, p_collector_id, p_amount, p_platform_fee, 'completed', NOW())
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION deduct_project_budget(
  p_requester_id UUID,
  p_amount DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_requester_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION credit_collector(
  p_requester_id UUID,
  p_collector_id UUID,
  p_submission_id UUID,
  p_amount DECIMAL
)
RETURNS UUID AS $$
DECLARE
  v_tx_id UUID;
BEGIN
  UPDATE profiles
  SET total_earnings = total_earnings + p_amount,
      updated_at = NOW()
  WHERE id = p_collector_id;

  INSERT INTO transactions (submission_id, requester_id, collector_id, amount, platform_fee, status, completed_at)
  VALUES (p_submission_id, p_requester_id, p_collector_id, p_amount, 0, 'completed', NOW())
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_users(
  search_term text DEFAULT '',
  role_filter text DEFAULT 'all',
  result_limit integer DEFAULT 100,
  result_offset integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  SELECT json_build_object(
    'users', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT p.id, p.email, p.full_name, p.avatar_url, p.role,
               p.verification_tier, p.created_at, p.updated_at,
               p.total_earnings, p.total_submissions, p.rating
        FROM profiles p
        WHERE (search_term = '' OR p.email ILIKE '%' || search_term || '%' OR p.full_name ILIKE '%' || search_term || '%')
          AND (role_filter = 'all' OR p.role::text = role_filter)
        ORDER BY p.created_at DESC
        LIMIT result_limit OFFSET result_offset
      ) t
    ),
    'total', (
      SELECT count(*)
      FROM profiles p
      WHERE (search_term = '' OR p.email ILIKE '%' || search_term || '%' OR p.full_name ILIKE '%' || search_term || '%')
        AND (role_filter = 'all' OR p.role::text = role_filter)
    )
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION credit_user_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_payment_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deposit_status TEXT;
BEGIN
  SELECT status INTO v_deposit_status
  FROM crypto_deposits
  WHERE payment_id = p_payment_id AND user_id = p_user_id
  FOR UPDATE;

  IF v_deposit_status IS NULL THEN
    RAISE EXCEPTION 'Deposit not found';
  END IF;

  IF v_deposit_status = 'confirmed' THEN
    RETURN TRUE;
  END IF;

  UPDATE crypto_deposits
  SET status = 'confirmed',
      confirmed_at = NOW(),
      updated_at = NOW()
  WHERE payment_id = p_payment_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION subscribe_to_plan(
  p_user_id UUID,
  p_plan_id TEXT,
  p_tier TEXT,
  p_billing_cycle TEXT,
  p_price DECIMAL
)
RETURNS UUID AS $$
DECLARE
  v_sub_id UUID;
  v_period_end TIMESTAMPTZ;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF p_billing_cycle = 'yearly' THEN
    v_period_end := NOW() + INTERVAL '1 year';
  ELSE
    v_period_end := NOW() + INTERVAL '1 month';
  END IF;

  UPDATE user_subscriptions
  SET status = 'cancelled', updated_at = NOW()
  WHERE user_id = p_user_id AND status = 'active';

  UPDATE profiles
  SET subscription_tier = p_tier, updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO user_subscriptions (
    user_id, plan_id, tier, billing_cycle, price, status,
    current_period_start, current_period_end
  )
  VALUES (
    p_user_id, p_plan_id, p_tier, p_billing_cycle, p_price, 'active',
    NOW(), v_period_end
  )
  RETURNING id INTO v_sub_id;

  RETURN v_sub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    UPDATE public.profiles
    SET total_earnings = total_earnings + v_price,
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

ALTER TABLE public.profiles DROP COLUMN IF EXISTS platform_credits_usd;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS balance;
