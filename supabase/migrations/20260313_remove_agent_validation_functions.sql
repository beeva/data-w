-- Remove deprecated agent-side submission validation RPCs.
-- Submission verification is now fully automatic on collector submit.
DROP FUNCTION IF EXISTS get_agent_dashboard(uuid, text);
DROP FUNCTION IF EXISTS agent_validate_submission(uuid, uuid, boolean);
DROP FUNCTION IF EXISTS agent_get_submission_items(uuid, uuid);
