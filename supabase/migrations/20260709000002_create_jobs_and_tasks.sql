-- Create public.jobs table
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'Scheduled',
  description text,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create public.tasks table
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  phase_id uuid REFERENCES public.project_phases(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Pending',
  assignee_id uuid REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  est_hours numeric(5, 2) NOT NULL DEFAULT 0.00,
  before_photo_url text,
  after_photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES FOR JOBS
-- ==========================================
CREATE POLICY "Admin manage jobs" ON public.jobs
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

CREATE POLICY "Staff read jobs" ON public.jobs
  FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT id FROM public.projects WHERE company_id IN (
      SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
    )
  ));

-- ==========================================
-- RLS POLICIES FOR TASKS
-- ==========================================
CREATE POLICY "Admin manage tasks" ON public.tasks
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

CREATE POLICY "Staff read tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (job_id IN (
    SELECT id FROM public.jobs WHERE project_id IN (
      SELECT id FROM public.projects WHERE company_id IN (
        SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Staff update assigned tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (assignee_id IN (
    SELECT id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (assignee_id IN (
    SELECT id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
  ));
