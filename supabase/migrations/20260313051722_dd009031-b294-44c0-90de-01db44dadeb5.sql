
-- 1. Add expo_push_token to staff_profiles
ALTER TABLE public.staff_profiles
  ADD COLUMN IF NOT EXISTS expo_push_token text;

-- 2. Add ask_for_face_id to geofences
ALTER TABLE public.geofences
  ADD COLUMN IF NOT EXISTS ask_for_face_id boolean NOT NULL DEFAULT false;

-- 3. Add face_check columns to geofence_events
ALTER TABLE public.geofence_events
  ADD COLUMN IF NOT EXISTS face_check_status text DEFAULT 'not_requested',
  ADD COLUMN IF NOT EXISTS face_check_at timestamptz,
  ADD COLUMN IF NOT EXISTS face_check_confidence text;
