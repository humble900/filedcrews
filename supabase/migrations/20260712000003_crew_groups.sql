-- =============================================
-- Crew Grouping System
-- =============================================

-- 1. Crews table — named groups of staff
CREATE TABLE public.crews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_crew_name_per_company UNIQUE(company_id, name)
);

ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;

-- Admin (company owner) full CRUD
CREATE POLICY "Admin manage crews" ON public.crews
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (company_id IN (
    SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
  ));

-- Staff can read crews in their company
CREATE POLICY "Staff read crews" ON public.crews
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
  ));

-- 2. Crew members junction table
CREATE TABLE public.crew_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id uuid NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_crew_staff UNIQUE(crew_id, staff_id)
);

ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;

-- Admin full CRUD on crew members
CREATE POLICY "Admin manage crew members" ON public.crew_members
  FOR ALL TO authenticated
  USING (crew_id IN (
    SELECT id FROM public.crews WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (crew_id IN (
    SELECT id FROM public.crews WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ));

-- Staff can read crew membership
CREATE POLICY "Staff read crew members" ON public.crew_members
  FOR SELECT TO authenticated
  USING (crew_id IN (
    SELECT id FROM public.crews WHERE company_id IN (
      SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
    )
  ));

-- 3. Add crew_id to project_assignments for tracking which crew an assignment came from
ALTER TABLE public.project_assignments
  ADD COLUMN IF NOT EXISTS crew_id uuid REFERENCES public.crews(id) ON DELETE SET NULL;
