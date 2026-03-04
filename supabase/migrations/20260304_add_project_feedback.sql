-- Store requester feedback when a project is completed.
CREATE TABLE IF NOT EXISTS project_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (request_id, requester_id)
);

CREATE INDEX IF NOT EXISTS idx_project_feedback_request ON project_feedback(request_id);
CREATE INDEX IF NOT EXISTS idx_project_feedback_requester ON project_feedback(requester_id);

ALTER TABLE project_feedback ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_feedback'
      AND policyname = 'Requesters can manage feedback for their own requests'
  ) THEN
    CREATE POLICY "Requesters can manage feedback for their own requests"
      ON project_feedback
      FOR ALL
      USING (
        requester_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM requests
          WHERE requests.id = project_feedback.request_id
            AND requests.requester_id = auth.uid()
        )
      )
      WITH CHECK (
        requester_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM requests
          WHERE requests.id = project_feedback.request_id
            AND requests.requester_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION complete_project_with_feedback(
  p_project_id UUID,
  p_requester_id UUID,
  p_rating SMALLINT,
  p_feedback TEXT
)
RETURNS requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_request requests;
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  IF p_feedback IS NULL OR btrim(p_feedback) = '' THEN
    RAISE EXCEPTION 'Feedback is required';
  END IF;

  UPDATE requests
  SET status = 'completed', updated_at = NOW()
  WHERE id = p_project_id
    AND requester_id = p_requester_id
  RETURNING * INTO updated_request;

  IF updated_request.id IS NULL THEN
    RAISE EXCEPTION 'Project not found or not owned by requester';
  END IF;

  INSERT INTO project_feedback (request_id, requester_id, rating, feedback)
  VALUES (p_project_id, p_requester_id, p_rating, btrim(p_feedback))
  ON CONFLICT (request_id, requester_id)
  DO UPDATE SET
    rating = EXCLUDED.rating,
    feedback = EXCLUDED.feedback,
    updated_at = NOW();

  RETURN updated_request;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_project_with_feedback(UUID, UUID, SMALLINT, TEXT) TO authenticated;
