-- Phase 1: Idempotency Schema
-- Ensure company_id exists on customers, jobs, and assets before creating composite indexes
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS external_source text,
ADD COLUMN IF NOT EXISTS external_id text;

CREATE UNIQUE INDEX IF NOT EXISTS customers_external_idx 
ON public.customers (company_id, external_source, external_id) 
WHERE external_source IS NOT NULL AND external_id IS NOT NULL AND company_id IS NOT NULL;

-- Add external tracking columns to jobs
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS external_source text,
ADD COLUMN IF NOT EXISTS external_id text;

CREATE UNIQUE INDEX IF NOT EXISTS jobs_external_idx 
ON public.jobs (company_id, external_source, external_id) 
WHERE external_source IS NOT NULL AND external_id IS NOT NULL AND company_id IS NOT NULL;

-- Add external tracking columns to assets
ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS external_source text,
ADD COLUMN IF NOT EXISTS external_id text;

CREATE UNIQUE INDEX IF NOT EXISTS assets_external_idx 
ON public.assets (company_id, external_source, external_id) 
WHERE external_source IS NOT NULL AND external_id IS NOT NULL AND company_id IS NOT NULL;

-- Phase 2: Migration Tracking Table
CREATE TABLE IF NOT EXISTS public.migration_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    provider_name text NOT NULL, -- e.g., 'servicetitan'
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
    total_records integer DEFAULT 0,
    synced_records integer DEFAULT 0,
    error_log text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.migration_tasks ENABLE ROW LEVEL SECURITY;

-- Migration Tasks Policies
CREATE POLICY "Users can view their company migration_tasks"
    ON public.migration_tasks
    FOR SELECT
    USING (company_id IN (SELECT company_id FROM public.staff_profiles WHERE staff_profiles.id = auth.uid()));

CREATE POLICY "Superadmins can insert migration_tasks"
    ON public.migration_tasks
    FOR INSERT
    WITH CHECK (
      company_id IN (SELECT company_id FROM public.staff_profiles WHERE staff_profiles.id = auth.uid() AND (global_role = 'Admin' OR global_role = 'Owner'))
    );

CREATE POLICY "Superadmins can update migration_tasks"
    ON public.migration_tasks
    FOR UPDATE
    USING (
      company_id IN (SELECT company_id FROM public.staff_profiles WHERE staff_profiles.id = auth.uid() AND (global_role = 'Admin' OR global_role = 'Owner'))
    );
