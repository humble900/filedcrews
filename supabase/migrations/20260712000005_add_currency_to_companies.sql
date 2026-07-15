-- Add currency column to companies table
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
