-- Migration: Add assigned_staff_id and priority to jobs table for dispatching
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS assigned_staff_id uuid REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Normal' CHECK (priority IN ('Urgent', 'High', 'Normal', 'Low'));

-- Index on assigned staff
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_staff ON public.jobs (assigned_staff_id);
