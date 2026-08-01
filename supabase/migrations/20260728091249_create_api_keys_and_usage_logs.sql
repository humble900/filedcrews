-- Create api_keys table for secure BYOK vault
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, provider)
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policies for api_keys
CREATE POLICY "Users can view their company's api keys"
    ON public.api_keys FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
        UNION
        SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their company's api keys"
    ON public.api_keys FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
        UNION
        SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can update their company's api keys"
    ON public.api_keys FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
        UNION
        SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their company's api keys"
    ON public.api_keys FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
        UNION
        SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    ));

-- Create company_usage_logs for metered billing
CREATE TABLE IF NOT EXISTS public.company_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.company_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies for company_usage_logs
CREATE POLICY "Users can view their company's usage logs"
    ON public.company_usage_logs FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
        UNION
        SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their company's usage logs"
    ON public.company_usage_logs FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
        UNION
        SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    ));
