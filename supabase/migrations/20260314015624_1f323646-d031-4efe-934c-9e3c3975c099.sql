
-- Add face_check_photo_url column to geofence_events
ALTER TABLE public.geofence_events ADD COLUMN face_check_photo_url text;

-- Create face-verifications storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('face-verifications', 'face-verifications', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read from the bucket (photos are public URLs)
CREATE POLICY "Public read access for face verifications"
ON storage.objects FOR SELECT
USING (bucket_id = 'face-verifications');

-- Allow service role inserts (edge functions use service role key)
CREATE POLICY "Service role insert for face verifications"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'face-verifications');
