-- Fix project_costs table RLS policies to allow Admins/Owners and Staff appropriate access.

-- Drop existing restricted policies on project_costs
DROP POLICY IF EXISTS "Users can select project costs for their company" ON public.project_costs;
DROP POLICY IF EXISTS "Users can insert project costs for their company" ON public.project_costs;
DROP POLICY IF EXISTS "Users can update project costs for their company" ON public.project_costs;
DROP POLICY IF EXISTS "Users can delete project costs for their company" ON public.project_costs;

-- Create Admin Policies (can manage all project costs for their company)
CREATE POLICY "Admin manage project costs"
    ON public.project_costs
    FOR ALL TO authenticated
    USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()))
    WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

-- Create Staff Policies (can select/read project costs for their company)
CREATE POLICY "Staff read project costs"
    ON public.project_costs
    FOR SELECT TO authenticated
    USING (company_id IN (SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()));
