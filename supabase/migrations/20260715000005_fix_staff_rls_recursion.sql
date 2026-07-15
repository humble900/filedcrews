-- Migration: Fix infinite recursion in staff_profiles RLS policies
-- Root cause: "Staff update own safe fields" and "Delegated role managers update staff"
-- policies both query staff_profiles from within staff_profiles policies, causing recursion.
-- Fix: Use SECURITY DEFINER helper functions to bypass RLS for policy subqueries.

-- 1. Create helper function to get a staff member's original role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_staff_role(staff_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT global_role FROM public.staff_profiles WHERE id = staff_uuid;
$$;

-- 2. Create helper function to get a staff member's can_manage_roles flag (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_staff_can_manage(staff_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT can_manage_roles FROM public.staff_profiles WHERE id = staff_uuid;
$$;

-- 3. Create helper function to check if caller is a delegated role manager (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_delegated_role_manager(user_uuid uuid, target_company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles
    WHERE auth_user_id = user_uuid
    AND company_id = target_company_id
    AND can_manage_roles = true
  );
$$;

-- 4. Drop and recreate the recursive "Staff update own safe fields" policy
DROP POLICY IF EXISTS "Staff update own safe fields" ON public.staff_profiles;
CREATE POLICY "Staff update own safe fields" ON public.staff_profiles
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (
    auth_user_id = auth.uid()
    AND global_role = public.get_staff_role(id)
    AND can_manage_roles = public.get_staff_can_manage(id)
  );

-- 5. Drop and recreate the recursive "Delegated role managers update staff" policy
DROP POLICY IF EXISTS "Delegated role managers update staff" ON public.staff_profiles;
CREATE POLICY "Delegated role managers update staff" ON public.staff_profiles
  FOR UPDATE TO authenticated
  USING (
    public.is_delegated_role_manager(auth.uid(), company_id)
    AND auth_user_id != auth.uid()
  )
  WITH CHECK (
    public.is_delegated_role_manager(auth.uid(), company_id)
    AND auth_user_id != auth.uid()
  );
