
-- Create platform_admins table
CREATE TABLE public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- RLS policies for platform_admins
CREATE POLICY "Users can check if they are platform admin" ON public.platform_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Platform admins can manage other platform admins" ON public.platform_admins
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));


-- Add superadmin SELECT access policies on other tables
CREATE POLICY "Superadmin select all companies" ON public.companies
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

CREATE POLICY "Superadmin select all staff_profiles" ON public.staff_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

CREATE POLICY "Superadmin select all geofences" ON public.geofences
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

CREATE POLICY "Superadmin select all staff_locations" ON public.staff_locations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

CREATE POLICY "Superadmin select all staff_location_history" ON public.staff_location_history
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

CREATE POLICY "Superadmin select all geofence_events" ON public.geofence_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

CREATE POLICY "Superadmin select all staff_shifts" ON public.staff_shifts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));


-- Add override columns to geofence_events for Phase 3 manual overrides
ALTER TABLE public.geofence_events 
  ADD COLUMN IF NOT EXISTS face_check_override_status text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS face_check_override_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
