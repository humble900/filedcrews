-- Superadmin UPDATE policy on companies
CREATE POLICY "Superadmin update all companies" ON public.companies
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

-- Superadmin UPDATE policy on staff_profiles
CREATE POLICY "Superadmin update all staff_profiles" ON public.staff_profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

-- Superadmin DELETE policy on staff_profiles
CREATE POLICY "Superadmin delete all staff_profiles" ON public.staff_profiles
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));
