
-- Create companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  prefix text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger for prefix length instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_company_prefix()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF char_length(NEW.prefix) <> 3 THEN
    RAISE EXCEPTION 'prefix must be exactly 3 characters';
  END IF;
  NEW.prefix := upper(NEW.prefix);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_company_prefix
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.validate_company_prefix();

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own company" ON public.companies
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own company" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update own company" ON public.companies
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid());

-- Add company_id to staff_profiles
ALTER TABLE public.staff_profiles ADD COLUMN company_id uuid REFERENCES public.companies(id);

-- Add company_id to geofences
ALTER TABLE public.geofences ADD COLUMN company_id uuid REFERENCES public.companies(id);

-- Enable RLS on staff_profiles
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read own company staff" ON public.staff_profiles
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin can update own company staff" ON public.staff_profiles
  FOR UPDATE TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

-- Enable RLS on staff_locations
ALTER TABLE public.staff_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read own company staff locations" ON public.staff_locations
  FOR SELECT TO authenticated
  USING (staff_id IN (SELECT id FROM public.staff_profiles WHERE company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid())));

-- Enable RLS on staff_location_history
ALTER TABLE public.staff_location_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read own company staff history" ON public.staff_location_history
  FOR SELECT TO authenticated
  USING (staff_id IN (SELECT id FROM public.staff_profiles WHERE company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid())));

-- Drop existing permissive/restrictive geofence policies
DROP POLICY IF EXISTS "Allow public delete geofences" ON public.geofences;
DROP POLICY IF EXISTS "Allow public insert geofences" ON public.geofences;
DROP POLICY IF EXISTS "Allow public read geofences" ON public.geofences;
DROP POLICY IF EXISTS "Allow public update geofences" ON public.geofences;

CREATE POLICY "Admin can read own geofences" ON public.geofences
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin can insert own geofences" ON public.geofences
  FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin can update own geofences" ON public.geofences
  FOR UPDATE TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin can delete own geofences" ON public.geofences
  FOR DELETE TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

-- Drop existing geofence_events policies
DROP POLICY IF EXISTS "Allow public insert geofence_events" ON public.geofence_events;
DROP POLICY IF EXISTS "Allow public read geofence_events" ON public.geofence_events;

CREATE POLICY "Admin can read own geofence events" ON public.geofence_events
  FOR SELECT TO authenticated
  USING (staff_id IN (SELECT id FROM public.staff_profiles WHERE company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid())));

-- Allow service role inserts (edge functions) - no restrictive policy needed
CREATE POLICY "Service can insert geofence events" ON public.geofence_events
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Enable realtime on companies
ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
