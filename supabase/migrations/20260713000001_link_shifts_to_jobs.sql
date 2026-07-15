-- Migration: link staff_shifts to jobs (work orders)
ALTER TABLE public.staff_shifts
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL;

-- Index to optimize querying shifts by job
CREATE INDEX IF NOT EXISTS idx_staff_shifts_job ON public.staff_shifts (job_id);
