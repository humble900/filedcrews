-- =====================================================================
-- PHASE 2 — MONEY: Database Schema
-- Migration: 20260714000003_phase2_money.sql
-- Date: 2026-07-14
-- Tables: estimates, estimate_options, estimate_items, payments
-- Upgrades: pricebook
-- =====================================================================

-- ==========================================
-- 1. UPGRADE PRICEBOOK TABLE
-- ==========================================
ALTER TABLE public.pricebook
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'service' CHECK (kind IN ('service', 'material', 'equipment')),
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS cost numeric(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS member_price numeric(12, 2),
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;


-- ==========================================
-- 2. ESTIMATES TABLE
-- ==========================================
CREATE TABLE public.estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Sent', 'Viewed', 'Approved', 'Declined', 'Expired', 'Converted')),
  total_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  valid_until date,
  notes text,
  signature_url text,
  signed_at timestamptz,
  approval_token uuid DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_estimates_company_status ON public.estimates (company_id, status);
CREATE INDEX idx_estimates_customer ON public.estimates (customer_id);

ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage estimates" ON public.estimates
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff read estimates" ON public.estimates
  FOR SELECT TO authenticated
  USING (company_id = public.get_staff_company_id(auth.uid()));

CREATE POLICY "Staff write estimates" ON public.estimates
  FOR ALL TO authenticated
  USING (company_id = public.get_staff_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_staff_company_id(auth.uid()));

-- Enable public select/update for customer approval page (via token)
CREATE POLICY "Public read estimates via token" ON public.estimates
  FOR SELECT TO anon, authenticated
  USING (true); -- Filtered in application code by token

CREATE POLICY "Public approve estimates via token" ON public.estimates
  FOR UPDATE TO anon, authenticated
  USING (true);


-- ==========================================
-- 3. ESTIMATE OPTIONS TABLE (Good, Better, Best)
-- ==========================================
CREATE TABLE public.estimate_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Standard',
  sort_order integer NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0.00,
  is_recommended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_estimate_options_estimate ON public.estimate_options (estimate_id);

ALTER TABLE public.estimate_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage estimate options" ON public.estimate_options
  FOR ALL TO authenticated
  USING (estimate_id IN (
    SELECT id FROM public.estimates WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (estimate_id IN (
    SELECT id FROM public.estimates WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Staff read estimate options" ON public.estimate_options
  FOR SELECT TO authenticated
  USING (estimate_id IN (
    SELECT id FROM public.estimates WHERE company_id = public.get_staff_company_id(auth.uid())
  ));

CREATE POLICY "Staff write estimate options" ON public.estimate_options
  FOR ALL TO authenticated
  USING (estimate_id IN (
    SELECT id FROM public.estimates WHERE company_id = public.get_staff_company_id(auth.uid())
  ))
  WITH CHECK (estimate_id IN (
    SELECT id FROM public.estimates WHERE company_id = public.get_staff_company_id(auth.uid())
  ));

CREATE POLICY "Public read estimate options" ON public.estimate_options
  FOR SELECT TO anon, authenticated
  USING (true);


-- ==========================================
-- 4. ESTIMATE ITEMS TABLE (Line Items)
-- ==========================================
CREATE TABLE public.estimate_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id uuid NOT NULL REFERENCES public.estimate_options(id) ON DELETE CASCADE,
  pricebook_id uuid REFERENCES public.pricebook(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12, 2) NOT NULL DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_estimate_items_option ON public.estimate_items (option_id);

ALTER TABLE public.estimate_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage estimate items" ON public.estimate_items
  FOR ALL TO authenticated
  USING (option_id IN (
    SELECT id FROM public.estimate_options WHERE estimate_id IN (
      SELECT id FROM public.estimates WHERE company_id IN (
        SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
      )
    )
  ))
  WITH CHECK (option_id IN (
    SELECT id FROM public.estimate_options WHERE estimate_id IN (
      SELECT id FROM public.estimates WHERE company_id IN (
        SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Staff read estimate items" ON public.estimate_items
  FOR SELECT TO authenticated
  USING (option_id IN (
    SELECT id FROM public.estimate_options WHERE estimate_id IN (
      SELECT id FROM public.estimates WHERE company_id = public.get_staff_company_id(auth.uid())
    )
  ));

CREATE POLICY "Staff write estimate items" ON public.estimate_items
  FOR ALL TO authenticated
  USING (option_id IN (
    SELECT id FROM public.estimate_options WHERE estimate_id IN (
      SELECT id FROM public.estimates WHERE company_id = public.get_staff_company_id(auth.uid())
    )
  ))
  WITH CHECK (option_id IN (
    SELECT id FROM public.estimate_options WHERE estimate_id IN (
      SELECT id FROM public.estimates WHERE company_id = public.get_staff_company_id(auth.uid())
    )
  ));

CREATE POLICY "Public read estimate items" ON public.estimate_items
  FOR SELECT TO anon, authenticated
  USING (true);


-- ==========================================
-- 5. PAYMENTS TABLE
-- ==========================================
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount numeric(12, 2) NOT NULL,
  payment_method text NOT NULL DEFAULT 'card' CHECK (payment_method IN ('card', 'bank', 'cash', 'check')),
  stripe_payment_id text,
  stripe_checkout_url text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_invoice ON public.payments (invoice_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (invoice_id IN (
    SELECT id FROM public.invoices WHERE job_id IN (
      SELECT id FROM public.jobs WHERE project_id IN (
        SELECT id FROM public.projects WHERE company_id IN (
          SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
        )
      )
    )
  ))
  WITH CHECK (invoice_id IN (
    SELECT id FROM public.invoices WHERE job_id IN (
      SELECT id FROM public.jobs WHERE project_id IN (
        SELECT id FROM public.projects WHERE company_id IN (
          SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
        )
      )
    )
  ));

CREATE POLICY "Staff read payments" ON public.payments
  FOR SELECT TO authenticated
  USING (invoice_id IN (
    SELECT id FROM public.invoices WHERE job_id IN (
      SELECT id FROM public.jobs WHERE project_id IN (
        SELECT id FROM public.projects WHERE company_id = public.get_staff_company_id(auth.uid())
      )
    )
  ));

CREATE POLICY "Staff write payments" ON public.payments
  FOR ALL TO authenticated
  USING (invoice_id IN (
    SELECT id FROM public.invoices WHERE job_id IN (
      SELECT id FROM public.jobs WHERE project_id IN (
        SELECT id FROM public.projects WHERE company_id = public.get_staff_company_id(auth.uid())
      )
    )
  ))
  WITH CHECK (invoice_id IN (
    SELECT id FROM public.invoices WHERE job_id IN (
      SELECT id FROM public.jobs WHERE project_id IN (
        SELECT id FROM public.projects WHERE company_id = public.get_staff_company_id(auth.uid())
      )
    )
  ));

CREATE POLICY "Public select payment status via invoice" ON public.payments
  FOR SELECT TO anon, authenticated
  USING (true);


-- ==========================================
-- 6. AUTO-CREATE INVOICES ON JOB COMPLETION
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_auto_create_invoice_on_job_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_price numeric(12, 2) := 0.00;
  v_invoice_id uuid;
BEGIN
  IF NEW.status = 'Completed' AND (OLD.status IS DISTINCT FROM 'Completed') THEN
    -- Try to find default job price from job type
    SELECT COALESCE(jt.default_price, 0.00) INTO v_job_price
    FROM public.jobs j
    LEFT JOIN public.job_types jt ON j.job_type_id = jt.id
    WHERE j.id = NEW.id;

    -- Create invoice in 'Draft' status
    INSERT INTO public.invoices (job_id, amount, status, payment_status)
    VALUES (NEW.id, v_job_price, 'Draft', 'Unpaid')
    RETURNING id INTO v_invoice_id;

    -- Also insert custom warning Action Item to alert the office
    INSERT INTO public.action_items (company_id, type, entity_type, entity_id, title, description, severity, action_url)
    SELECT
      p.company_id,
      'draft_invoice',
      'invoice',
      v_invoice_id,
      'Review Draft Invoice',
      'Job "' || NEW.title || '" was marked completed. Review and send draft invoice.',
      'Medium',
      '/invoices'
    FROM public.projects p
    WHERE p.id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_invoice ON public.jobs;
CREATE TRIGGER trg_auto_create_invoice
  AFTER UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.fn_auto_create_invoice_on_job_complete();


-- ==========================================
-- 7. RECONCILE PAYMENT STATUS ON INVOICES
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_reconcile_invoice_payments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_paid numeric(12, 2) := 0.00;
  v_invoice_amount numeric(12, 2) := 0.00;
BEGIN
  -- Sum all completed payments for this invoice
  SELECT COALESCE(SUM(amount), 0.00) INTO v_total_paid
  FROM public.payments
  WHERE invoice_id = NEW.invoice_id AND status = 'completed';

  -- Get invoice total amount
  SELECT amount INTO v_invoice_amount
  FROM public.invoices
  WHERE id = NEW.invoice_id;

  -- Update invoice statuses
  IF v_total_paid >= v_invoice_amount THEN
    UPDATE public.invoices
    SET payment_status = 'Paid', status = 'Paid'
    WHERE id = NEW.invoice_id;
  ELSIF v_total_paid > 0 THEN
    UPDATE public.invoices
    SET payment_status = 'Partially Paid'
    WHERE id = NEW.invoice_id;
  ELSE
    UPDATE public.invoices
    SET payment_status = 'Unpaid'
    WHERE id = NEW.invoice_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reconcile_payments ON public.payments;
CREATE TRIGGER trg_reconcile_payments
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.fn_reconcile_invoice_payments();


-- ==========================================
-- 8. Enable Realtime on estimates + payments
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.estimates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
