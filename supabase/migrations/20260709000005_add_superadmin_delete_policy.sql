-- Add DELETE policy on companies table for platform admins (superadmins)
CREATE POLICY "Superadmin delete all companies" ON public.companies
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));
