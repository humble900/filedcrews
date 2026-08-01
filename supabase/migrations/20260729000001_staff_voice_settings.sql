-- Add voice_settings to staff_profiles
ALTER TABLE public.staff_profiles
ADD COLUMN IF NOT EXISTS voice_settings JSONB DEFAULT '{}'::jsonb;
