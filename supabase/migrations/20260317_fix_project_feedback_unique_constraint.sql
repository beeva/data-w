-- Fix project_feedback uniqueness so requester can leave feedback per collector.
-- Old schema enforced UNIQUE(request_id, requester_id), which blocks >1 collector feedback.

ALTER TABLE public.project_feedback
ADD COLUMN IF NOT EXISTS collector_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

DO $$
DECLARE
  c RECORD;
BEGIN
  -- Drop any legacy unique constraint on (request_id, requester_id)
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.project_feedback'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) LIKE 'UNIQUE (request_id, requester_id)%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.project_feedback DROP CONSTRAINT IF EXISTS %I',
      c.conname
    );
  END LOOP;
END $$;

-- Keep collector_id populated for existing rows.
UPDATE public.project_feedback pf
SET collector_id = (
  SELECT ca.collector_id
  FROM public.collector_assignments ca
  WHERE ca.request_id = pf.request_id
  ORDER BY ca.assigned_at ASC
  LIMIT 1
)
WHERE pf.collector_id IS NULL;

-- Ensure per-collector uniqueness.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.project_feedback'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) LIKE 'UNIQUE (request_id, requester_id, collector_id)%'
  ) THEN
    ALTER TABLE public.project_feedback
      ADD CONSTRAINT project_feedback_request_requester_collector_key
      UNIQUE (request_id, requester_id, collector_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_project_feedback_collector
  ON public.project_feedback(collector_id);
