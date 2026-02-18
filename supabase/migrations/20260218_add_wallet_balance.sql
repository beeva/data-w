-- Add balance column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS balance DECIMAL(10, 2) DEFAULT 0;

-- Allow authenticated users to insert transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert transactions'
  ) THEN
    CREATE POLICY "Authenticated users can insert transactions"
      ON transactions FOR INSERT
      WITH CHECK (requester_id = auth.uid());
  END IF;
END $$;

-- Atomically transfer funds from requester to collector
CREATE OR REPLACE FUNCTION transfer_funds(
  p_requester_id UUID,
  p_collector_id UUID,
  p_submission_id UUID,
  p_amount DECIMAL,
  p_platform_fee DECIMAL DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_requester_balance DECIMAL;
  v_tx_id UUID;
BEGIN
  -- Lock the requester row to prevent race conditions
  SELECT balance INTO v_requester_balance
  FROM profiles WHERE id = p_requester_id FOR UPDATE;

  IF v_requester_balance < p_amount + p_platform_fee THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct from requester
  UPDATE profiles
  SET balance = balance - (p_amount + p_platform_fee),
      updated_at = NOW()
  WHERE id = p_requester_id;

  -- Credit collector
  UPDATE profiles
  SET balance = balance + p_amount,
      total_earnings = total_earnings + p_amount,
      updated_at = NOW()
  WHERE id = p_collector_id;

  -- Create transaction record
  INSERT INTO transactions (submission_id, requester_id, collector_id, amount, platform_fee, status, completed_at)
  VALUES (p_submission_id, p_requester_id, p_collector_id, p_amount, p_platform_fee, 'completed', NOW())
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
