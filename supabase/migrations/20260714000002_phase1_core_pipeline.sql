-- =====================================================================
-- PHASE 1 — CORE PIPELINE: Database Foundation
-- Migration: 20260714000002_phase1_core_pipeline.sql
-- Date: 2026-07-14
-- Tables: leads, job_types, action_items
-- =====================================================================

-- ==========================================
-- 1. JOB TYPES — template definitions per trade
-- ==========================================
CREATE TABLE public.job_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  default_duration_minutes integer NOT NULL DEFAULT 60,
  required_skills text[] DEFAULT '{}',
  default_price numeric(12, 2),
  description text,
  color text NOT NULL DEFAULT 'slate',
  icon text NOT NULL DEFAULT 'wrench',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_job_type_per_company UNIQUE(company_id, name)
);

ALTER TABLE public.job_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage job types" ON public.job_types
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff read job types" ON public.job_types
  FOR SELECT TO authenticated
  USING (company_id = public.get_staff_company_id(auth.uid()));

-- Link jobs to job_types
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS job_type_id uuid REFERENCES public.job_types(id) ON DELETE SET NULL;

-- Add arrival window columns to jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS arrival_window_start timestamptz,
  ADD COLUMN IF NOT EXISTS arrival_window_end timestamptz;


-- ==========================================
-- 2. LEADS — lightweight pre-job pipeline entry
-- ==========================================
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  phone text,
  email text,
  address text,
  source text NOT NULL DEFAULT 'Direct',
  status text NOT NULL DEFAULT 'New'
    CHECK (status IN ('New', 'Contacted', 'Qualified', 'Won', 'Lost')),
  follow_up_date date,
  notes text,
  converted_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  estimated_value numeric(12, 2),
  job_type_id uuid REFERENCES public.job_types(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_company_status ON public.leads (company_id, status);
CREATE INDEX idx_leads_follow_up ON public.leads (company_id, follow_up_date) WHERE status NOT IN ('Won', 'Lost');

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage leads" ON public.leads
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff read leads" ON public.leads
  FOR SELECT TO authenticated
  USING (company_id = public.get_staff_company_id(auth.uid()));

CREATE POLICY "Staff insert leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_staff_company_id(auth.uid()));

-- Auto-update updated_at on leads
CREATE OR REPLACE FUNCTION public.fn_leads_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.fn_leads_updated_at();


-- ==========================================
-- 3. ACTION ITEMS — rules-based office to-do feed
-- ==========================================
CREATE TABLE public.action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'unassigned_job', 'overdue_invoice', 'unsold_estimate',
    'membership_visit_due', 'low_stock', 'lead_follow_up',
    'draft_invoice', 'expiring_warranty', 'custom'
  )),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'Medium'
    CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
  action_url text,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_action_items_company_unresolved
  ON public.action_items (company_id, created_at DESC)
  WHERE resolved = false;

CREATE INDEX idx_action_items_entity
  ON public.action_items (entity_type, entity_id);

ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage action items" ON public.action_items
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff read action items" ON public.action_items
  FOR SELECT TO authenticated
  USING (company_id = public.get_staff_company_id(auth.uid()));

CREATE POLICY "Staff resolve action items" ON public.action_items
  FOR UPDATE TO authenticated
  USING (company_id = public.get_staff_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_staff_company_id(auth.uid()));


-- ==========================================
-- 4. SEED DEFAULT JOB TYPES for existing companies
-- ==========================================
INSERT INTO public.job_types (company_id, name, default_duration_minutes, default_price, description, color, icon, sort_order)
SELECT c.id, jt.name, jt.duration, jt.price, jt.description, jt.color, jt.icon, jt.sort_order
FROM public.companies c
CROSS JOIN (VALUES
  ('Service Call',     60,  149.00, 'Standard diagnostic and repair visit',     'blue',    'wrench',       1),
  ('Installation',    240,  499.00, 'New equipment or system installation',     'violet',  'package',      2),
  ('Maintenance',      90,  199.00, 'Preventive maintenance and tune-up',      'emerald',  'shield',      3),
  ('Inspection',       60,   99.00, 'Safety or compliance inspection',          'amber',   'clipboard',    4),
  ('Emergency',        45,  249.00, 'Urgent after-hours service call',          'red',     'alert-circle', 5)
) AS jt(name, duration, price, description, color, icon, sort_order)
ON CONFLICT (company_id, name) DO NOTHING;


-- ==========================================
-- 5. AUTO-SEED JOB TYPES for new companies
-- ==========================================
CREATE OR REPLACE FUNCTION public.seed_default_job_types()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.job_types (company_id, name, default_duration_minutes, default_price, description, color, icon, sort_order) VALUES
    (NEW.id, 'Service Call',  60,  149.00, 'Standard diagnostic and repair visit',     'blue',    'wrench',       1),
    (NEW.id, 'Installation', 240, 499.00, 'New equipment or system installation',     'violet',  'package',      2),
    (NEW.id, 'Maintenance',   90, 199.00, 'Preventive maintenance and tune-up',      'emerald',  'shield',      3),
    (NEW.id, 'Inspection',    60,  99.00, 'Safety or compliance inspection',          'amber',   'clipboard',    4),
    (NEW.id, 'Emergency',     45, 249.00, 'Urgent after-hours service call',          'red',     'alert-circle', 5);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_default_job_types ON public.companies;
CREATE TRIGGER trg_seed_default_job_types
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_job_types();


-- ==========================================
-- 6. Enable realtime on leads + action_items
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.action_items;
