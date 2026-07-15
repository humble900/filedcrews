-- Rename 'Technician' role to 'Field Crew'

-- Drop the old CHECK constraint (added by rbac_security_hardening migration)
ALTER TABLE public.staff_profiles DROP CONSTRAINT IF EXISTS valid_global_role;

-- Temporarily disable the role-protection trigger for this data migration
ALTER TABLE public.staff_profiles DISABLE TRIGGER enforce_role_change_by_owner;

-- Rename the role
UPDATE public.staff_profiles
  SET global_role = 'Field Crew'
  WHERE global_role = 'Technician';

-- Re-enable the trigger
ALTER TABLE public.staff_profiles ENABLE TRIGGER enforce_role_change_by_owner;

-- Re-add CHECK constraint with the updated role name
ALTER TABLE public.staff_profiles
  ADD CONSTRAINT valid_global_role
  CHECK (global_role IN ('Admin', 'Finance', 'Dispatcher', 'Field Crew'));
