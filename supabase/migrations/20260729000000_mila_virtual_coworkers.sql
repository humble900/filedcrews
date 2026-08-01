-- Create custom_agents table
CREATE TABLE IF NOT EXISTS public.custom_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    model_override TEXT,
    system_prompt TEXT NOT NULL,
    active_skills JSONB DEFAULT '[]'::jsonb,
    trigger_type TEXT NOT NULL, -- e.g., 'manual', 'webhook_sms', 'webhook_whatsapp', 'webhook_email', 'cron'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.custom_agents ENABLE ROW LEVEL SECURITY;

-- Policies for custom_agents
CREATE POLICY "Users can view custom_agents in their company"
ON public.custom_agents FOR SELECT
USING (company_id IN (SELECT company_id FROM public.staff_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert custom_agents in their company"
ON public.custom_agents FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.staff_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update custom_agents in their company"
ON public.custom_agents FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.staff_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete custom_agents in their company"
ON public.custom_agents FOR DELETE
USING (company_id IN (SELECT company_id FROM public.staff_profiles WHERE id = auth.uid()));


-- Create agent_knowledge_base table
CREATE TABLE IF NOT EXISTS public.agent_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.custom_agents(id) ON DELETE CASCADE, -- Optional, if null applies to all agents in company
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    -- If pgvector is installed, we can add a vector column here later. For now, text storage.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.agent_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Policies for agent_knowledge_base
CREATE POLICY "Users can view agent_knowledge_base in their company"
ON public.agent_knowledge_base FOR SELECT
USING (company_id IN (SELECT company_id FROM public.staff_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert agent_knowledge_base in their company"
ON public.agent_knowledge_base FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.staff_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update agent_knowledge_base in their company"
ON public.agent_knowledge_base FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.staff_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete agent_knowledge_base in their company"
ON public.agent_knowledge_base FOR DELETE
USING (company_id IN (SELECT company_id FROM public.staff_profiles WHERE id = auth.uid()));
