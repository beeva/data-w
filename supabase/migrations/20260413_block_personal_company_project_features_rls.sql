-- Restrict personal/company accounts from project marketplace features at the database layer:
-- viewing open projects/proposals (when authenticated), creating/editing projects, submitting proposals, etc.
-- Anonymous users keep read access to open requests/proposals for public discovery.
-- SECURITY DEFINER RPCs (e.g. datapool) are unchanged so Data Pool purchases still work.

-- ---------------------------------------------------------------------------
-- Helper: authenticated personal/company must not use project browsing policies;
-- anon (auth.uid() IS NULL) may still read open rows where policies allow it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auth_is_personal_or_company()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('personal', 'company')
  );
$$;

CREATE OR REPLACE FUNCTION public.may_browse_open_projects()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid() IS NULL OR NOT public.auth_is_personal_or_company();
$$;

-- ---------------------------------------------------------------------------
-- requests
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view open requests" ON public.requests;

CREATE POLICY "Anyone can view open requests"
  ON public.requests FOR SELECT
  USING (
    (
      status = 'open'
      AND public.may_browse_open_projects()
    )
    OR requester_id = auth.uid()
  );

DROP POLICY IF EXISTS "Requesters can create requests" ON public.requests;

CREATE POLICY "Requesters can create requests"
  ON public.requests FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'requester'
    )
  );

DROP POLICY IF EXISTS "Requesters can update their own requests" ON public.requests;

CREATE POLICY "Requesters can update their own requests"
  ON public.requests FOR UPDATE
  USING (
    requester_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'requester'
    )
  )
  WITH CHECK (
    requester_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'requester'
    )
  );

-- ---------------------------------------------------------------------------
-- proposals
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view proposals for open requests" ON public.proposals;

CREATE POLICY "Anyone can view proposals for open requests"
  ON public.proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = proposals.request_id
        AND r.status = 'open'
    )
    AND public.may_browse_open_projects()
  );

DROP POLICY IF EXISTS "Collectors can create proposals" ON public.proposals;

CREATE POLICY "Collectors can create proposals"
  ON public.proposals FOR INSERT
  WITH CHECK (
    collector_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'collector'
    )
  );

DROP POLICY IF EXISTS "Collectors can update their own pending proposals" ON public.proposals;

CREATE POLICY "Collectors can update their own pending proposals"
  ON public.proposals FOR UPDATE
  USING (
    collector_id = auth.uid()
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'collector'
    )
  );

DROP POLICY IF EXISTS "Requesters can update proposals for their requests" ON public.proposals;

CREATE POLICY "Requesters can update proposals for their requests"
  ON public.proposals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = proposals.request_id
        AND r.requester_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'requester'
    )
  );

-- ---------------------------------------------------------------------------
-- submissions (collectors only; enforce role)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Collectors can create submissions for assigned projects" ON public.submissions;

CREATE POLICY "Collectors can create submissions for assigned projects"
  ON public.submissions FOR INSERT
  WITH CHECK (
    collector_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'collector'
    )
    AND EXISTS (
      SELECT 1 FROM public.collector_assignments ca
      WHERE ca.request_id = submissions.request_id
        AND ca.collector_id = auth.uid()
        AND ca.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- project_messages (chat on accepted work)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Requester and assigned collector can view messages" ON public.project_messages;

CREATE POLICY "Requester and assigned collector can view messages"
  ON public.project_messages FOR SELECT
  USING (
    NOT public.auth_is_personal_or_company()
    AND (
      (
        requester_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.requests r
          WHERE r.id = project_messages.request_id
            AND r.requester_id = auth.uid()
        )
      )
      OR
      (
        collector_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.collector_assignments ca
          WHERE ca.request_id = project_messages.request_id
            AND ca.collector_id = auth.uid()
            AND ca.status IN ('active', 'completed')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Requester and assigned collector can send messages" ON public.project_messages;

CREATE POLICY "Requester and assigned collector can send messages"
  ON public.project_messages FOR INSERT
  WITH CHECK (
    NOT public.auth_is_personal_or_company()
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = project_messages.request_id
        AND r.requester_id = project_messages.requester_id
    )
    AND EXISTS (
      SELECT 1 FROM public.collector_assignments ca
      WHERE ca.request_id = project_messages.request_id
        AND ca.collector_id = project_messages.collector_id
        AND ca.status IN ('active', 'completed')
    )
    AND (
      requester_id = auth.uid()
      OR collector_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- collector_assignments (requester-managed; enforce requester role)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Requesters can view assignments for their requests" ON public.collector_assignments;

CREATE POLICY "Requesters can view assignments for their requests"
  ON public.collector_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = collector_assignments.request_id
        AND r.requester_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'requester'
    )
  );

DROP POLICY IF EXISTS "Requesters can create assignments for their requests" ON public.collector_assignments;

CREATE POLICY "Requesters can create assignments for their requests"
  ON public.collector_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = collector_assignments.request_id
        AND r.requester_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'requester'
    )
  );

DROP POLICY IF EXISTS "Requesters can update assignments for their requests" ON public.collector_assignments;

CREATE POLICY "Requesters can update assignments for their requests"
  ON public.collector_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = collector_assignments.request_id
        AND r.requester_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'requester'
    )
  );

DROP POLICY IF EXISTS "Collectors can view their own assignments" ON public.collector_assignments;

CREATE POLICY "Collectors can view their own assignments"
  ON public.collector_assignments FOR SELECT
  USING (
    collector_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'collector'
    )
  );
