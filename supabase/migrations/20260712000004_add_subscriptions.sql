-- Add subscription and seat limits columns to companies table
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'Free',
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS max_field_crew_seats integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_admin_seats integer NOT NULL DEFAULT 3;
