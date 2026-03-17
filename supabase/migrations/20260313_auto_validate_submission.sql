-- Auto-verify submission on collector submit (no agent intervention).
CREATE OR REPLACE FUNCTION auto_validate_submission(
  p_submission_id uuid,
  p_passed boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only the submission owner can trigger automatic verification.
  IF NOT EXISTS (
    SELECT 1
    FROM submissions s
    WHERE s.id = p_submission_id
      AND s.collector_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: collector owner only';
  END IF;

  IF p_passed THEN
    UPDATE submissions
    SET agent_validated = TRUE,
        agent_validated_at = NOW(),
        agent_id = NULL
    WHERE id = p_submission_id;
  ELSE
    UPDATE submissions
    SET agent_validated = TRUE,
        agent_validated_at = NOW(),
        agent_id = NULL,
        status = 'rejected',
        validation_score = 0,
        validator_id = NULL,
        validated_at = NOW()
    WHERE id = p_submission_id;
  END IF;
END;
$$;
