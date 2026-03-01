
-- Geofences table
CREATE TABLE public.geofences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters DOUBLE PRECISION NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Geofence events table - logs each detection of inside/outside
CREATE TABLE public.geofence_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  geofence_id UUID NOT NULL REFERENCES public.geofences(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('inside', 'outside')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_geofence_events_geofence_id ON public.geofence_events(geofence_id);
CREATE INDEX idx_geofence_events_staff_id ON public.geofence_events(staff_id);
CREATE INDEX idx_geofence_events_geofence_staff ON public.geofence_events(geofence_id, staff_id, created_at DESC);

-- Enable realtime for geofence_events so the UI updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.geofence_events;
