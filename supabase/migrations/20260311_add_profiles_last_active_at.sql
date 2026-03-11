-- Presence tracking for chat status (online/idle/offline).
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

UPDATE profiles
SET last_active_at = COALESCE(last_active_at, updated_at, created_at)
WHERE last_active_at IS NULL;

