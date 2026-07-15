-- 1. Create Locations Table
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Add Columns to jobs and assets
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Locations
CREATE POLICY "Company manage locations" ON public.locations
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    UNION
    SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (company_id IN (
    SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    UNION
    SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
  ));

-- 6. RLS Policies for API Keys
CREATE POLICY "Company manage api_keys" ON public.api_keys
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    UNION
    SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (company_id IN (
    SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    UNION
    SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
  ));
