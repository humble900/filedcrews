-- Add hourly_rate column to staff_profiles
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS hourly_rate numeric(10, 2) DEFAULT 0;

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  est_hours numeric(8, 2) DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Complete', 'Blocked')),
  phase_id uuid REFERENCES public.project_phases(id) ON DELETE SET NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS: company owner can manage tasks via job → project → company chain
DROP POLICY IF EXISTS "Admin manage tasks" ON public.tasks;
CREATE POLICY "Admin manage tasks" ON public.tasks
  FOR ALL TO authenticated
  USING (job_id IN (
    SELECT j.id FROM public.jobs j
    JOIN public.projects p ON j.project_id = p.id
    JOIN public.companies c ON p.company_id = c.id
    WHERE c.auth_user_id = auth.uid()
  ))
  WITH CHECK (job_id IN (
    SELECT j.id FROM public.jobs j
    JOIN public.projects p ON j.project_id = p.id
    JOIN public.companies c ON p.company_id = c.id
    WHERE c.auth_user_id = auth.uid()
  ));

-- Staff can read tasks for their company's projects
DROP POLICY IF EXISTS "Staff read tasks" ON public.tasks;
CREATE POLICY "Staff read tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (job_id IN (
    SELECT j.id FROM public.jobs j
    JOIN public.projects p ON j.project_id = p.id
    WHERE p.company_id = public.get_staff_company_id(auth.uid())
  ));
