-- ============================================================
-- SECURITY HARDENING: Lock down role management to authorized users
-- Prevents privilege escalation and script-based exploits.
--
-- WHO CAN ASSIGN ROLES:
--   1. The business owner (companies.auth_user_id)
--   2. Staff members explicitly granted can_manage_roles = true
--      (only the business owner can grant this flag)
-- ============================================================

-- 1. Add can_manage_roles column — only the owner can set this to true
ALTER TABLE public.staff_profiles
  ADD COLUMN IF NOT EXISTS can_manage_roles boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.staff_profiles.can_manage_roles IS
  'When true, this staff member can assign global_role to other staff in the same company. Only the business owner can toggle this flag.';

-- 2. Drop any existing permissive update policy on staff_profiles
--    that would let staff update their own row (including global_role)
DROP POLICY IF EXISTS "Staff update own profile" ON public.staff_profiles;

-- 3. Create a restrictive self-update policy: staff can update their own
--    row BUT only specific safe columns (NOT global_role, NOT can_manage_roles, NOT company_id, NOT auth_user_id)
CREATE POLICY "Staff update own safe fields" ON public.staff_profiles
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (
    auth_user_id = auth.uid()
    -- Prevent self-escalation: global_role must stay the same
    AND global_role = (
      SELECT sp.global_role FROM public.staff_profiles sp
      WHERE sp.id = staff_profiles.id
    )
    -- Prevent self-granting role management
    AND can_manage_roles = (
      SELECT sp.can_manage_roles FROM public.staff_profiles sp
      WHERE sp.id = staff_profiles.id
    )
  );

-- 4. Ensure the admin (company owner) policy still allows full updates
DROP POLICY IF EXISTS "Admin manage own company staff" ON public.staff_profiles;
CREATE POLICY "Admin manage own company staff" ON public.staff_profiles
  FOR ALL TO authenticated
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  );

-- 5. Allow staff with can_manage_roles to update OTHER staff in their company
--    (but NOT themselves — prevents self-escalation)
DROP POLICY IF EXISTS "Delegated role managers update staff" ON public.staff_profiles;
CREATE POLICY "Delegated role managers update staff" ON public.staff_profiles
  FOR UPDATE TO authenticated
  USING (
    -- Target must be in the same company as the acting user
    company_id IN (
      SELECT sp2.company_id FROM public.staff_profiles sp2
      WHERE sp2.auth_user_id = auth.uid()
      AND sp2.can_manage_roles = true
    )
    -- Cannot modify yourself (prevents self-escalation)
    AND auth_user_id != auth.uid()
  )
  WITH CHECK (
    company_id IN (
      SELECT sp2.company_id FROM public.staff_profiles sp2
      WHERE sp2.auth_user_id = auth.uid()
      AND sp2.can_manage_roles = true
    )
    AND auth_user_id != auth.uid()
  );

-- 6. Database-level trigger as second line of defense:
--    global_role and can_manage_roles can only be changed by:
--    a) The business owner, OR
--    b) A staff member with can_manage_roles = true (for global_role only, NOT can_manage_roles itself)
CREATE OR REPLACE FUNCTION public.protect_role_changes()
RETURNS TRIGGER AS $$
DECLARE
  caller_is_owner boolean;
  caller_can_manage boolean;
BEGIN
  -- If neither sensitive field changed, allow the update
  IF OLD.global_role = NEW.global_role AND OLD.can_manage_roles = NEW.can_manage_roles THEN
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
  IF OLD.can_manage_roles != NEW.can_manage_roles THEN
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

DROP TRIGGER IF EXISTS enforce_role_change_by_owner ON public.staff_profiles;
CREATE TRIGGER enforce_role_change_by_owner
  BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_role_changes();

-- 7. Add CHECK constraint to restrict global_role values
ALTER TABLE public.staff_profiles
  DROP CONSTRAINT IF EXISTS valid_global_role;
ALTER TABLE public.staff_profiles
  ADD CONSTRAINT valid_global_role
  CHECK (global_role IN ('Admin', 'Finance', 'Dispatcher', 'Technician'));
