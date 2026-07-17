-- Create project costs table for custom budget tracking
CREATE TABLE IF NOT EXISTS public.project_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    budget_amount NUMERIC NOT NULL DEFAULT 0.0,
    actual_amount NUMERIC NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can select project costs for their company"
    ON public.project_costs
    FOR SELECT
    USING (company_id = (SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert project costs for their company"
    ON public.project_costs
    FOR INSERT
    WITH CHECK (company_id = (SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update project costs for their company"
    ON public.project_costs
    FOR UPDATE
    USING (company_id = (SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()))
    WITH CHECK (company_id = (SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete project costs for their company"
    ON public.project_costs
    FOR DELETE
    USING (company_id = (SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()));

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_project_costs_project_id ON public.project_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_company_id ON public.project_costs(company_id);
