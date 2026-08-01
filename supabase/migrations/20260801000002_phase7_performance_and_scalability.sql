-- =====================================================================
-- PHASE 7 — PERFORMANCE & QUERY SCALABILITY INDEXES
-- Migration: 20260801000002_phase7_performance_and_scalability.sql
-- Date: 2026-08-01
-- =====================================================================

-- 1. Composite & Partial Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_company_status_created 
  ON public.jobs (company_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_assigned_staff 
  ON public.jobs (assigned_staff_id, status) 
  WHERE assigned_staff_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff_time 
  ON public.staff_shifts (staff_id, check_in_time DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_items_company_part 
  ON public.inventory_items (company_id, part_number);

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_invoices_company_created 
  ON public.invoices (company_id, created_at DESC);

-- 2. STABLE Security & RLS Company Resolution Function
-- Keep original parameter name 'user_uuid' to match existing dependent policies
CREATE OR REPLACE FUNCTION public.get_staff_company_id(user_uuid uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id 
  FROM public.staff_profiles 
  WHERE auth_user_id = user_uuid 
  LIMIT 1;
$$;
