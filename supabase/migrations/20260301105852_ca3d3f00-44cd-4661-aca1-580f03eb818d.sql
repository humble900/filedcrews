
-- Enable RLS on new tables
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_events ENABLE ROW LEVEL SECURITY;

-- Allow public read for admin dashboard (writes go through edge functions)
CREATE POLICY "Allow public read geofences" ON public.geofences FOR SELECT USING (true);
CREATE POLICY "Allow public insert geofences" ON public.geofences FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update geofences" ON public.geofences FOR UPDATE USING (true);
CREATE POLICY "Allow public delete geofences" ON public.geofences FOR DELETE USING (true);

CREATE POLICY "Allow public read geofence_events" ON public.geofence_events FOR SELECT USING (true);
CREATE POLICY "Allow public insert geofence_events" ON public.geofence_events FOR INSERT WITH CHECK (true);
