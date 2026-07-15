-- ==========================================
-- ROLES TABLE — dynamic role management
-- ==========================================
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT 'slate',
  permissions jsonb DEFAULT '[]'::jsonb,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Owner can manage roles
CREATE POLICY "Admin manage roles" ON public.roles
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

-- Staff can read roles for their company
CREATE POLICY "Staff read roles" ON public.roles
  FOR SELECT TO authenticated
  USING (company_id = public.get_staff_company_id(auth.uid()));

-- ==========================================
-- SEED DEFAULT ROLES for every existing company
-- ==========================================
INSERT INTO public.roles (company_id, name, description, color, is_system)
SELECT c.id, r.name, r.description, r.color, true
FROM public.companies c
CROSS JOIN (VALUES
  ('Admin',      'Full dashboard access — can manage staff, projects, work orders, invoices, and safety.', 'violet'),
  ('Finance',    'Access to CRM, invoices, change orders, and reports.',                                   'sky'),
  ('Dispatcher', 'Access to work orders, scheduling, crew map, shifts, and safety.',                       'amber'),
  ('Field Crew', 'Mobile app only — no dashboard access.',                                                 'emerald')
) AS r(name, description, color)
ON CONFLICT (company_id, name) DO NOTHING;

-- ==========================================
-- AUTO-SEED ROLES for new companies via trigger
-- ==========================================
CREATE OR REPLACE FUNCTION public.seed_default_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.roles (company_id, name, description, color, is_system) VALUES
    (NEW.id, 'Admin',      'Full dashboard access — can manage staff, projects, work orders, invoices, and safety.', 'violet', true),
    (NEW.id, 'Finance',    'Access to CRM, invoices, change orders, and reports.',                                   'sky',    true),
    (NEW.id, 'Dispatcher', 'Access to work orders, scheduling, crew map, shifts, and safety.',                       'amber',  true),
    (NEW.id, 'Field Crew', 'Mobile app only — no dashboard access.',                                                 'emerald', true);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_default_roles ON public.companies;
CREATE TRIGGER trg_seed_default_roles
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_roles();
