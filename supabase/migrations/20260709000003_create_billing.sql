-- Create public.pricebook table
CREATE TABLE public.pricebook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  unit_cost numeric(12, 2) NOT NULL DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint on company_id + item_name
CREATE UNIQUE INDEX idx_pricebook_company_item ON public.pricebook (company_id, item_name);

-- Create public.invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'Draft',
  payment_status text NOT NULL DEFAULT 'Unpaid',
  client_signature_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pricebook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES FOR PRICEBOOK
-- ==========================================
CREATE POLICY "Admin manage pricebook" ON public.pricebook
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff read pricebook" ON public.pricebook
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()));

-- ==========================================
-- RLS POLICIES FOR INVOICES
-- ==========================================
CREATE POLICY "Admin manage invoices" ON public.invoices
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

CREATE POLICY "Staff manage invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (job_id IN (
    SELECT id FROM public.jobs WHERE project_id IN (
      SELECT id FROM public.projects WHERE company_id IN (
        SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
      )
    )
  ))
  WITH CHECK (job_id IN (
    SELECT id FROM public.jobs WHERE project_id IN (
      SELECT id FROM public.projects WHERE company_id IN (
        SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
      )
    )
  ));
