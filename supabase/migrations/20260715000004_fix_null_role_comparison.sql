-- Migration: Fix null comparison in protect_role_changes trigger function to prevent 500 status update failures
CREATE OR REPLACE FUNCTION public.protect_role_changes()
RETURNS TRIGGER AS $$
DECLARE
  caller_is_owner boolean;
  caller_can_manage boolean;
BEGIN
  -- If neither sensitive field changed, allow the update (using null-safe IS NOT DISTINCT FROM)
  IF (OLD.global_role IS NOT DISTINCT FROM NEW.global_role) AND (OLD.can_manage_roles IS NOT DISTINCT FROM NEW.can_manage_roles) THEN
    RETURN NEW;
  END IF;

  -- Check if the caller is the business owner
  SELECT EXISTS(
    SELECT 1 FROM public.companies
    WHERE id = NEW.company_id
    AND auth_user_id = auth.uid()
  ) INTO caller_is_owner;

  -- Business owner can change anything
  IF caller_is_owner THEN
    RETURN NEW;
  END IF;

  -- can_manage_roles flag itself can ONLY be changed by the business owner
  IF OLD.can_manage_roles IS DISTINCT FROM NEW.can_manage_roles THEN
    RAISE EXCEPTION 'Only the business owner can grant or revoke role management authority'
      USING ERRCODE = '42501';
  END IF;

  -- Check if caller is a delegated role manager
  SELECT EXISTS(
    SELECT 1 FROM public.staff_profiles
    WHERE auth_user_id = auth.uid()
    AND company_id = NEW.company_id
    AND can_manage_roles = true
  ) INTO caller_can_manage;

  -- Prevent self-modification (even delegated managers)
  IF NEW.auth_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot change your own role'
      USING ERRCODE = '42501';
  END IF;

  IF caller_can_manage THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'You do not have permission to change staff roles'
    USING ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
