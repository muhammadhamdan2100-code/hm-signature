-- Add columns required by the backend profile protection trigger.
-- Safe for existing databases because IF NOT EXISTS is used.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_primary_admin BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;
