-- 1. Create Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  source text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- 2. Create Service Requests Table
CREATE TABLE IF NOT EXISTS public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  description text NOT NULL,
  urgency text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'new',
  converted_lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_urgency CHECK (urgency IN ('low','normal','urgent','emergency')),
  CONSTRAINT chk_status CHECK (status IN ('new','reviewed','converted','declined'))
);

-- 3. Add Columns to leads and jobs
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Campaigns
CREATE POLICY "Company manage campaigns" ON public.campaigns
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

-- 6. RLS Policies for Service Requests
CREATE POLICY "Company manage service_requests" ON public.service_requests
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

-- 7. Client Portal Policy for public inserts/selects on service_requests
CREATE POLICY "Allow public insert for service_requests" ON public.service_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public read for service_requests" ON public.service_requests
  FOR SELECT TO anon, authenticated
  USING (true);

-- 8. Allow public inserts for Online Booking Page on leads
CREATE POLICY "Allow public insert for leads" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 9. Secure portal lookup & retrieval helper RPC functions
CREATE OR REPLACE FUNCTION public.portal_verify_customer(p_email text, p_phone text)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  name text,
  email text,
  phone text,
  billing_address text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.company_id, c.name, c.email, c.phone, c.billing_address
  FROM public.customers c
  WHERE LOWER(c.email) = LOWER(p_email) AND c.phone = p_phone
  LIMIT 1;
END;
$$;
GRANT EXECUTE ON FUNCTION public.portal_verify_customer(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.portal_get_jobs(p_customer_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  status text,
  description text,
  scheduled_start timestamptz,
  scheduled_end timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT j.id, j.title, j.status, j.description, j.scheduled_start, j.scheduled_end
  FROM public.jobs j
  WHERE j.customer_id = p_customer_id
  ORDER BY j.scheduled_start DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.portal_get_jobs(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.portal_get_assets(p_customer_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  serial_number text,
  install_date date,
  make text,
  model text,
  warranty_expiry date,
  equipment_type text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.name, a.serial_number, a.install_date, a.make, a.model, a.warranty_expiry, a.equipment_type
  FROM public.assets a
  WHERE a.customer_id = p_customer_id
  ORDER BY a.name;
END;
$$;
GRANT EXECUTE ON FUNCTION public.portal_get_assets(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.portal_get_invoices(p_customer_id uuid)
RETURNS TABLE (
  id uuid,
  invoice_number text,
  amount numeric,
  status text,
  payment_status text,
  created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.invoice_number, i.amount, i.status, i.payment_status, i.created_at
  FROM public.invoices i
  JOIN public.jobs j ON i.job_id = j.id
  WHERE j.customer_id = p_customer_id AND i.status != 'Draft'
  ORDER BY i.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.portal_get_invoices(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.portal_get_estimates(p_customer_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  status text,
  total_amount numeric,
  valid_until date,
  approval_token uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.title, e.status, e.total_amount, e.valid_until, e.approval_token
  FROM public.estimates e
  WHERE e.customer_id = p_customer_id AND e.status != 'Draft'
  ORDER BY e.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.portal_get_estimates(uuid) TO anon, authenticated;
