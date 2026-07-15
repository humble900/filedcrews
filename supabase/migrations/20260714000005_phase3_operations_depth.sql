-- =====================================================================
-- PHASE 3 — OPERATIONS DEPTH: Database Schema
-- Migration: 20260714000005_phase3_operations_depth.sql
-- Date: 2026-07-14
-- =====================================================================

-- ==========================================
-- 0. HELPER: get_staff_profile_id (auth_user_id → staff_profile.id)
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_staff_profile_id(p_auth_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.staff_profiles WHERE auth_user_id = p_auth_user_id LIMIT 1;
$$;

-- ==========================================
-- 1. COMPANIES TABLE MODULE TOGGLES & SETTINGS
-- ==========================================
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS enabled_modules jsonb NOT NULL DEFAULT '{"memberships": true, "safety": true, "change_orders": true, "forms": true, "timesheets": true}'::jsonb;


-- ==========================================
-- 2. BUSINESS UNITS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.business_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage business units" ON public.business_units;
CREATE POLICY "Admin manage business units" ON public.business_units
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff read business units" ON public.business_units;
CREATE POLICY "Staff read business units" ON public.business_units
  FOR SELECT TO authenticated
  USING (company_id = public.get_staff_company_id(auth.uid()));


-- ==========================================
-- 3. UPGRADE JOBS TABLE FOR BUSINESS UNITS
-- ==========================================
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS business_unit_id uuid REFERENCES public.business_units(id) ON DELETE SET NULL;


-- ==========================================
-- 4. UPGRADE ASSETS TABLE
-- ==========================================
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS make text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS warranty_expiry date,
  ADD COLUMN IF NOT EXISTS equipment_type text;


-- ==========================================
-- 5. RELATIONAL JOB EQUIPMENT HISTORY
-- ==========================================
CREATE TABLE IF NOT EXISTS public.job_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_equipment_job ON public.job_equipment (job_id);
CREATE INDEX IF NOT EXISTS idx_job_equipment_asset ON public.job_equipment (asset_id);

ALTER TABLE public.job_equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage job equipment" ON public.job_equipment;
CREATE POLICY "Admin manage job equipment" ON public.job_equipment
  FOR ALL TO authenticated
  USING (job_id IN (
    SELECT id FROM public.jobs WHERE project_id IN (
      SELECT id FROM public.projects WHERE company_id IN (
        SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
      )
    )
  ))
  WITH CHECK (job_id IN (
    SELECT id FROM public.jobs WHERE project_id IN (
      SELECT id FROM public.projects WHERE company_id IN (
        SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
      )
    )
  ));

DROP POLICY IF EXISTS "Staff read/write job equipment" ON public.job_equipment;
CREATE POLICY "Staff read/write job equipment" ON public.job_equipment
  FOR ALL TO authenticated
  USING (job_id IN (
    SELECT id FROM public.jobs WHERE project_id IN (
      SELECT id FROM public.projects WHERE company_id = public.get_staff_company_id(auth.uid())
    )
  ))
  WITH CHECK (job_id IN (
    SELECT id FROM public.jobs WHERE project_id IN (
      SELECT id FROM public.projects WHERE company_id = public.get_staff_company_id(auth.uid())
    )
  ));


-- ==========================================
-- 6. MEMBERSHIPS & SERVICE AGREEMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(12, 2) NOT NULL DEFAULT 0.00,
  billing_frequency text NOT NULL DEFAULT 'monthly' CHECK (billing_frequency IN ('monthly', 'quarterly', 'annually', 'one_time')),
  visits_per_year integer NOT NULL DEFAULT 2,
  discount_percent numeric(5, 2) NOT NULL DEFAULT 10.00,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_membership_plans_company ON public.membership_plans (company_id);

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage membership plans" ON public.membership_plans;
CREATE POLICY "Admin manage membership plans" ON public.membership_plans
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff read membership plans" ON public.membership_plans;
CREATE POLICY "Staff read membership plans" ON public.membership_plans
  FOR SELECT TO authenticated
  USING (company_id = public.get_staff_company_id(auth.uid()));


CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  renewal_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memberships_customer ON public.memberships (customer_id);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage memberships" ON public.memberships;
CREATE POLICY "Admin manage memberships" ON public.memberships
  FOR ALL TO authenticated
  USING (customer_id IN (
    SELECT id FROM public.customers WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (customer_id IN (
    SELECT id FROM public.customers WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ));

DROP POLICY IF EXISTS "Staff read/write memberships" ON public.memberships;
CREATE POLICY "Staff read/write memberships" ON public.memberships
  FOR ALL TO authenticated
  USING (customer_id IN (
    SELECT id FROM public.customers WHERE company_id = public.get_staff_company_id(auth.uid())
  ))
  WITH CHECK (customer_id IN (
    SELECT id FROM public.customers WHERE company_id = public.get_staff_company_id(auth.uid())
  ));


CREATE TABLE IF NOT EXISTS public.membership_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'unscheduled' CHECK (status IN ('unscheduled', 'scheduled', 'completed', 'skipped')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_membership_visits_membership ON public.membership_visits (membership_id);

ALTER TABLE public.membership_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage membership visits" ON public.membership_visits;
CREATE POLICY "Admin manage membership visits" ON public.membership_visits
  FOR ALL TO authenticated
  USING (membership_id IN (
    SELECT id FROM public.memberships WHERE customer_id IN (
      SELECT id FROM public.customers WHERE company_id IN (
        SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
      )
    )
  ))
  WITH CHECK (membership_id IN (
    SELECT id FROM public.memberships WHERE customer_id IN (
      SELECT id FROM public.customers WHERE company_id IN (
        SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
      )
    )
  ));

DROP POLICY IF EXISTS "Staff read/write membership visits" ON public.membership_visits;
CREATE POLICY "Staff read/write membership visits" ON public.membership_visits
  FOR ALL TO authenticated
  USING (membership_id IN (
    SELECT id FROM public.memberships WHERE customer_id IN (
      SELECT id FROM public.customers WHERE company_id = public.get_staff_company_id(auth.uid())
    )
  ))
  WITH CHECK (membership_id IN (
    SELECT id FROM public.memberships WHERE customer_id IN (
      SELECT id FROM public.customers WHERE company_id = public.get_staff_company_id(auth.uid())
    )
  ));


-- ==========================================
-- 7. TIMESHEETS & PAYROLL TRACKING
-- ==========================================
CREATE TABLE IF NOT EXISTS public.timesheet_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  entry_type text NOT NULL DEFAULT 'onsite' CHECK (entry_type IN ('drive', 'onsite', 'idle', 'shop', 'break')),
  source text NOT NULL DEFAULT 'auto' CHECK (source IN ('auto', 'manual')),
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_minutes numeric(8, 2),
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'corrected')),
  approved_by uuid REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timesheet_entries_staff ON public.timesheet_entries (staff_id);

ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage timesheets" ON public.timesheet_entries;
CREATE POLICY "Admin manage timesheets" ON public.timesheet_entries
  FOR ALL TO authenticated
  USING (staff_id IN (
    SELECT id FROM public.staff_profiles WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (staff_id IN (
    SELECT id FROM public.staff_profiles WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ));

DROP POLICY IF EXISTS "Staff read/write own timesheets" ON public.timesheet_entries;
CREATE POLICY "Staff read/write own timesheets" ON public.timesheet_entries
  FOR ALL TO authenticated
  USING (staff_id = public.get_staff_profile_id(auth.uid()))
  WITH CHECK (staff_id = public.get_staff_profile_id(auth.uid()));


-- ==========================================
-- 8. COMPLIANCE FORMS SYSTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS public.form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  schema jsonb NOT NULL DEFAULT '[]'::jsonb, -- dynamic fields representation
  job_type_id uuid REFERENCES public.job_types(id) ON DELETE SET NULL,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_templates_company ON public.form_templates (company_id);

ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage form templates" ON public.form_templates;
CREATE POLICY "Admin manage form templates" ON public.form_templates
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff read form templates" ON public.form_templates;
CREATE POLICY "Staff read form templates" ON public.form_templates
  FOR SELECT TO authenticated
  USING (company_id = public.get_staff_company_id(auth.uid()));


CREATE TABLE IF NOT EXISTS public.form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_responses_job ON public.form_responses (job_id);

ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage form responses" ON public.form_responses;
CREATE POLICY "Admin manage form responses" ON public.form_responses
  FOR ALL TO authenticated
  USING (submitted_by IN (
    SELECT id FROM public.staff_profiles WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (submitted_by IN (
    SELECT id FROM public.staff_profiles WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ));

DROP POLICY IF EXISTS "Staff read/write form responses" ON public.form_responses;
CREATE POLICY "Staff read/write form responses" ON public.form_responses
  FOR ALL TO authenticated
  USING (submitted_by = public.get_staff_profile_id(auth.uid()))
  WITH CHECK (submitted_by = public.get_staff_profile_id(auth.uid()));


-- ==========================================
-- 9. Enable Realtime Publications
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_units;
ALTER PUBLICATION supabase_realtime ADD TABLE public.membership_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.memberships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timesheet_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.form_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.form_responses;
