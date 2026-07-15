-- 1. Create SECURITY DEFINER functions to bypass RLS internally
CREATE OR REPLACE FUNCTION public.get_staff_company_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.staff_profiles WHERE auth_user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.is_company_owner(user_uuid uuid, target_company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies
    WHERE auth_user_id = user_uuid AND id = target_company_id
  );
$$;

-- 2. Drop existing recursive policies
DROP POLICY IF EXISTS "Staff read own company" ON public.companies;
DROP POLICY IF EXISTS "Admin manage company staff" ON public.staff_profiles;
DROP POLICY IF EXISTS "Platform admins can manage other platform admins" ON public.platform_admins;
DROP POLICY IF EXISTS "Platform admins can insert platform admins" ON public.platform_admins;
DROP POLICY IF EXISTS "Platform admins can update platform admins" ON public.platform_admins;
DROP POLICY IF EXISTS "Platform admins can delete platform admins" ON public.platform_admins;

-- 3. Recreate policies using the SECURITY DEFINER helpers and correct structures
CREATE POLICY "Staff read own company" ON public.companies
  FOR SELECT TO authenticated
  USING (id = public.get_staff_company_id(auth.uid()));

CREATE POLICY "Admin manage company staff" ON public.staff_profiles
  FOR ALL TO authenticated
  USING (public.is_company_owner(auth.uid(), company_id))
  WITH CHECK (public.is_company_owner(auth.uid(), company_id));

-- Recreate platform_admins policies separating read and write to avoid recursion
CREATE POLICY "Platform admins can insert platform admins" ON public.platform_admins
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

CREATE POLICY "Platform admins can update platform admins" ON public.platform_admins
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

CREATE POLICY "Platform admins can delete platform admins" ON public.platform_admins
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));
