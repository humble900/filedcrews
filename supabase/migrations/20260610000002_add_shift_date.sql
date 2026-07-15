
-- Add shift_date column to staff_shifts to support specific day scheduling
ALTER TABLE public.staff_shifts 
  ADD COLUMN IF NOT EXISTS shift_date date DEFAULT CURRENT_DATE;

-- Add index to optimize date range queries
CREATE INDEX IF NOT EXISTS idx_staff_shifts_date ON public.staff_shifts (shift_date);
