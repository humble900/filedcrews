-- =====================================================================
-- PHASE 0 — CRITICAL SECURITY & ARCHITECTURE FIXES
-- Migration: 20260714000001_phase0_security_and_architecture.sql
-- Date: 2026-07-14
-- =====================================================================

-- ==========================================
-- 0.1  FIX: Staff Invoices RLS (was FOR ALL, now FOR SELECT only)
-- ==========================================
DROP POLICY IF EXISTS "Staff manage invoices" ON public.invoices;

CREATE POLICY "Staff read invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (job_id IN (
    SELECT j.id FROM public.jobs j
    JOIN public.projects p ON j.project_id = p.id
    WHERE p.company_id = public.get_staff_company_id(auth.uid())
  ));


-- ==========================================
-- 0.2  FIX: Staff Change Orders RLS (was FOR ALL, now SELECT + INSERT)
-- ==========================================
DROP POLICY IF EXISTS "Staff read/insert change orders" ON public.change_orders;

-- Staff can READ change orders in their company
CREATE POLICY "Staff read change orders" ON public.change_orders
  FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT id FROM public.projects
    WHERE company_id = public.get_staff_company_id(auth.uid())
  ));

-- Staff can INSERT change orders in their company (field requests)
CREATE POLICY "Staff insert change orders" ON public.change_orders
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (
    SELECT id FROM public.projects
    WHERE company_id = public.get_staff_company_id(auth.uid())
  ));


-- ==========================================
-- 0.3  FIX: Geofence events — already fixed in harden_rls migration
--       (anon INSERT was dropped, staff policy scoped to own events)
--       No action needed — verified in 20260610000000_harden_rls.sql
-- ==========================================


-- ==========================================
-- 0.4  ADD: Audit Log Table
-- ==========================================
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_company ON public.audit_log (company_id, created_at DESC);
CREATE INDEX idx_audit_log_record ON public.audit_log (table_name, record_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only company owners/admins can read audit logs
CREATE POLICY "Admin read audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
  ));

-- Service role (triggers) can insert
CREATE POLICY "System insert audit log" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);


-- ==========================================
-- 0.5  ADD: Status CHECK Constraints
-- ==========================================

-- Jobs: constrain to valid pipeline statuses
ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS chk_job_status;
ALTER TABLE public.jobs
  ADD CONSTRAINT chk_job_status
  CHECK (status IN (
    'Lead', 'Booked', 'Scheduled', 'Dispatched',
    'In Progress', 'Completed', 'Invoiced', 'Paid', 'Cancelled'
  ));

-- Invoices: constrain status
ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS chk_invoice_status;
ALTER TABLE public.invoices
  ADD CONSTRAINT chk_invoice_status
  CHECK (status IN ('Draft', 'Sent', 'Approved', 'Paid', 'Void'));

-- Invoices: constrain payment_status
ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS chk_payment_status;
ALTER TABLE public.invoices
  ADD CONSTRAINT chk_payment_status
  CHECK (payment_status IN ('Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Refunded'));

-- Tasks: constrain status
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS chk_task_status;
ALTER TABLE public.tasks
  ADD CONSTRAINT chk_task_status
  CHECK (status IN (
    'Pending', 'In Progress', 'Completed', 'Rework', 'Blocked', 'Cancelled'
  ));

-- Tasks: constrain priority
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS chk_task_priority;
ALTER TABLE public.tasks
  ADD CONSTRAINT chk_task_priority
  CHECK (priority IN ('Low', 'Medium', 'High', 'Critical'));

-- Change Orders: constrain status
ALTER TABLE public.change_orders
  DROP CONSTRAINT IF EXISTS chk_change_order_status;
ALTER TABLE public.change_orders
  ADD CONSTRAINT chk_change_order_status
  CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Void'));


-- ==========================================
-- 0.6  ADD: Job Events / Status History Table
-- ==========================================
CREATE TABLE public.job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_events_job ON public.job_events (job_id, created_at DESC);
CREATE INDEX idx_job_events_staff ON public.job_events (changed_by, created_at DESC);

ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;

-- Admin can manage all events in their company
CREATE POLICY "Admin manage job events" ON public.job_events
  FOR ALL TO authenticated
  USING (job_id IN (
    SELECT j.id FROM public.jobs j
    JOIN public.projects p ON j.project_id = p.id
    WHERE p.company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (job_id IN (
    SELECT j.id FROM public.jobs j
    JOIN public.projects p ON j.project_id = p.id
    WHERE p.company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ));

-- Staff can read events and insert for their company
CREATE POLICY "Staff read job events" ON public.job_events
  FOR SELECT TO authenticated
  USING (job_id IN (
    SELECT j.id FROM public.jobs j
    JOIN public.projects p ON j.project_id = p.id
    WHERE p.company_id = public.get_staff_company_id(auth.uid())
  ));

CREATE POLICY "Staff insert job events" ON public.job_events
  FOR INSERT TO authenticated
  WITH CHECK (job_id IN (
    SELECT j.id FROM public.jobs j
    JOIN public.projects p ON j.project_id = p.id
    WHERE p.company_id = public.get_staff_company_id(auth.uid())
  ));


-- ==========================================
-- AUDIT TRIGGER: Log invoice mutations
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_audit_invoices()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  -- Resolve company_id from job → project chain
  SELECT p.company_id INTO v_company_id
  FROM public.jobs j
  JOIN public.projects p ON j.project_id = p.id
  WHERE j.id = COALESCE(NEW.job_id, OLD.job_id);

  INSERT INTO public.audit_log (company_id, table_name, record_id, action, old_data, new_data, changed_by)
  VALUES (
    v_company_id,
    'invoices',
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_invoices();


-- ==========================================
-- AUDIT TRIGGER: Log change order mutations
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_audit_change_orders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  SELECT p.company_id INTO v_company_id
  FROM public.projects p
  WHERE p.id = COALESCE(NEW.project_id, OLD.project_id);

  INSERT INTO public.audit_log (company_id, table_name, record_id, action, old_data, new_data, changed_by)
  VALUES (
    v_company_id,
    'change_orders',
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_change_orders
  AFTER INSERT OR UPDATE OR DELETE ON public.change_orders
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_change_orders();


-- ==========================================
-- AUDIT TRIGGER: Log staff role changes
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log when role-related columns actually change
  IF OLD.global_role IS DISTINCT FROM NEW.global_role
     OR OLD.can_manage_roles IS DISTINCT FROM NEW.can_manage_roles THEN

    INSERT INTO public.audit_log (company_id, table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (
      NEW.company_id,
      'staff_profiles',
      NEW.id,
      'UPDATE',
      jsonb_build_object('global_role', OLD.global_role, 'can_manage_roles', OLD.can_manage_roles),
      jsonb_build_object('global_role', NEW.global_role, 'can_manage_roles', NEW.can_manage_roles),
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_role_changes ON public.staff_profiles;
CREATE TRIGGER trg_audit_role_changes
  AFTER UPDATE ON public.staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_role_changes();


-- ==========================================
-- AUTO-LOG: Job status changes to job_events
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_log_job_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.job_events (job_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_job_status_change
  AFTER UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_job_status_change();

-- Enable realtime on job_events for dispatch board live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_events;
