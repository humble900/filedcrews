
-- Add photo_url column to staff_profiles
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS photo_url text;

-- Create storage bucket for staff photos
INSERT INTO storage.buckets (id, name, public) VALUES ('staff-photos', 'staff-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to staff-photos bucket
CREATE POLICY "Authenticated users can upload staff photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'staff-photos');

-- Allow authenticated users to update/replace staff photos
CREATE POLICY "Authenticated users can update staff photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'staff-photos');

-- Allow authenticated users to delete staff photos
CREATE POLICY "Authenticated users can delete staff photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'staff-photos');

-- Allow public read access to staff photos
CREATE POLICY "Public read access for staff photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'staff-photos');
