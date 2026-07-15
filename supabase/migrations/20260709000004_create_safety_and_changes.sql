-- Create public.change_orders table
CREATE TABLE public.change_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  cost_impact numeric(12, 2) NOT NULL DEFAULT 0.00,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Pending',
  signature_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create public.incident_reports table
CREATE TABLE public.incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  severity text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'Open',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create public.toolbox_talks table
CREATE TABLE public.toolbox_talks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  topic text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  presenter_id uuid NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create public.toolbox_talk_attendees table
CREATE TABLE public.toolbox_talk_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talk_id uuid NOT NULL REFERENCES public.toolbox_talks(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  signed_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index to prevent duplicate check-ins
CREATE UNIQUE INDEX idx_toolbox_talk_attendees_talk_staff ON public.toolbox_talk_attendees (talk_id, staff_id);

-- Enable RLS
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toolbox_talks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toolbox_talk_attendees ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES FOR CHANGE ORDERS
-- ==========================================
CREATE POLICY "Admin manage change orders" ON public.change_orders
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

CREATE POLICY "Staff read/insert change orders" ON public.change_orders
  FOR ALL TO authenticated
  USING (project_id IN (
    SELECT id FROM public.projects WHERE company_id IN (
      SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (project_id IN (
    SELECT id FROM public.projects WHERE company_id IN (
      SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
    )
  ));

-- ==========================================
-- RLS POLICIES FOR INCIDENT REPORTS
-- ==========================================
CREATE POLICY "Admin manage incident reports" ON public.incident_reports
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

CREATE POLICY "Staff manage incident reports" ON public.incident_reports
  FOR ALL TO authenticated
  USING (project_id IN (
    SELECT id FROM public.projects WHERE company_id IN (
      SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (project_id IN (
    SELECT id FROM public.projects WHERE company_id IN (
      SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
    )
  ));

-- ==========================================
-- RLS POLICIES FOR TOOLBOX TALKS
-- ==========================================
CREATE POLICY "Admin manage toolbox talks" ON public.toolbox_talks
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

CREATE POLICY "Staff manage toolbox talks" ON public.toolbox_talks
  FOR ALL TO authenticated
  USING (project_id IN (
    SELECT id FROM public.projects WHERE company_id IN (
      SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (project_id IN (
    SELECT id FROM public.projects WHERE company_id IN (
      SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
    )
  ));

-- ==========================================
-- RLS POLICIES FOR TOOLBOX TALK ATTENDEES
-- ==========================================
CREATE POLICY "Admin manage toolbox attendees" ON public.toolbox_talk_attendees
  FOR ALL TO authenticated
  USING (talk_id IN (
    SELECT id FROM public.toolbox_talks WHERE project_id IN (
      SELECT id FROM public.projects WHERE company_id IN (
        SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
      )
    )
  ))
  WITH CHECK (talk_id IN (
    SELECT id FROM public.toolbox_talks WHERE project_id IN (
      SELECT id FROM public.projects WHERE company_id IN (
        SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Staff manage toolbox attendees" ON public.toolbox_talk_attendees
  FOR ALL TO authenticated
  USING (talk_id IN (
    SELECT id FROM public.toolbox_talks WHERE project_id IN (
      SELECT id FROM public.projects WHERE company_id IN (
        SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
      )
    )
  ))
  WITH CHECK (talk_id IN (
    SELECT id FROM public.toolbox_talks WHERE project_id IN (
      SELECT id FROM public.projects WHERE company_id IN (
        SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
      )
    )
  ));
