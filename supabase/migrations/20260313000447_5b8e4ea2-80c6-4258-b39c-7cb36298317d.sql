ALTER TABLE public.geofences
  ADD COLUMN check_in_time TIME DEFAULT NULL,
  ADD COLUMN check_out_time TIME DEFAULT NULL;