-- Expand Audit Triggers to capture Jobs, Estimates, and Geofence clock-in/out events

-- ==========================================
-- 1. Audit Jobs/Work Orders mutations
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_audit_jobs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  SELECT company_id INTO v_company_id
  FROM public.projects
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);

  INSERT INTO public.audit_log (company_id, table_name, record_id, action, old_data, new_data, changed_by)
  VALUES (
    v_company_id,
    'jobs',
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_jobs ON public.jobs;
CREATE TRIGGER trg_audit_jobs
  AFTER INSERT OR UPDATE OR DELETE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_jobs();


-- ==========================================
-- 2. Audit Estimates/Proposals mutations
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_audit_estimates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (company_id, table_name, record_id, action, old_data, new_data, changed_by)
  VALUES (
    COALESCE(NEW.company_id, OLD.company_id),
    'estimates',
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_estimates ON public.estimates;
CREATE TRIGGER trg_audit_estimates
  AFTER INSERT OR UPDATE OR DELETE ON public.estimates
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_estimates();


-- ==========================================
-- 3. Audit Geofence Events (Clock-in/out attendance)
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_audit_geofence_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  SELECT company_id INTO v_company_id
  FROM public.staff_profiles
  WHERE id = NEW.staff_id;

  INSERT INTO public.audit_log (company_id, table_name, record_id, action, old_data, new_data, changed_by)
  VALUES (
    v_company_id,
    'geofence_events',
    NEW.id,
    'INSERT',
    NULL,
    to_jsonb(NEW),
    NEW.staff_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_geofence_events ON public.geofence_events;
CREATE TRIGGER trg_audit_geofence_events
  AFTER INSERT ON public.geofence_events
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_geofence_events();

-- ==========================================
-- 4. Update audit_log RLS select policy
-- ==========================================
DROP POLICY IF EXISTS "Admin read audit log" ON public.audit_log;
CREATE POLICY "Admin read audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    ) OR company_id IN (
      SELECT company_id FROM public.staff_profiles 
      WHERE auth_user_id = auth.uid() 
      AND global_role IN ('Admin', 'Finance', 'Dispatcher')
    )
  );
