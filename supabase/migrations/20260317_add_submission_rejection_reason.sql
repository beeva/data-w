-- Store requester rejection reason for submissions.
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
