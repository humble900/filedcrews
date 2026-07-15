-- Create public.customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  billing_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create public.assets (equipment) table
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name text NOT NULL,
  serial_number text,
  install_date date,
  service_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create public.projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name text NOT NULL,
  ref_number text NOT NULL,
  description text,
  address text,
  latitude double precision,
  longitude double precision,
  geofence_radius double precision NOT NULL DEFAULT 150.0,
  budget_labour_cost numeric(12, 2) NOT NULL DEFAULT 0.00,
  contract_value numeric(12, 2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'Planning',
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create public.project_phases table
CREATE TABLE public.project_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'Not Started',
  progress_percent integer NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES FOR CUSTOMERS
-- ==========================================
CREATE POLICY "Admin manage customers" ON public.customers
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff read customers" ON public.customers
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()));

-- ==========================================
-- RLS POLICIES FOR ASSETS
-- ==========================================
CREATE POLICY "Admin manage assets" ON public.assets
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

CREATE POLICY "Staff read assets" ON public.assets
  FOR SELECT TO authenticated
  USING (customer_id IN (
    SELECT id FROM public.customers WHERE company_id IN (
      SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
    )
  ));

-- ==========================================
-- RLS POLICIES FOR PROJECTS
-- ==========================================
CREATE POLICY "Admin manage projects" ON public.projects
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff read projects" ON public.projects
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()));

-- ==========================================
-- RLS POLICIES FOR PROJECT PHASES
-- ==========================================
CREATE POLICY "Admin manage project phases" ON public.project_phases
  FOR ALL TO authenticated
  USING (project_id IN (
    SELECT id FROM public.projects WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (project_id IN (
    SELECT id FROM public.projects WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Staff read project phases" ON public.project_phases
  FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT id FROM public.projects WHERE company_id IN (
      SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
    )
  ));
