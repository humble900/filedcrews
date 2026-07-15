-- Create public.project_assignments table
CREATE TABLE public.project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Crew Member',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_project_staff UNIQUE(project_id, staff_id)
);

-- Enable RLS
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES FOR PROJECT ASSIGNMENTS
-- ==========================================
CREATE POLICY "Admin manage project assignments" ON public.project_assignments
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

CREATE POLICY "Staff read project assignments" ON public.project_assignments
  FOR SELECT TO authenticated
  USING (staff_id IN (
    SELECT id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
  ));
