-- Add global_role column to staff_profiles table
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS global_role text NOT NULL DEFAULT 'Technician';

-- Add comment describing available roles
COMMENT ON COLUMN public.staff_profiles.global_role IS 'Global roles for company access control: Admin, Finance, Dispatcher, Technician';
