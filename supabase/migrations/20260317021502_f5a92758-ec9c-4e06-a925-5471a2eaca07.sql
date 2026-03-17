
CREATE TABLE public.staff_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  geofence_id uuid NOT NULL REFERENCES public.geofences(id) ON DELETE CASCADE,
  check_in_time time NOT NULL,
  check_out_time time,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read own company staff shifts"
  ON public.staff_shifts FOR SELECT TO authenticated
  USING (
    staff_id IN (
      SELECT sp.id FROM staff_profiles sp
      WHERE sp.company_id IN (
        SELECT c.id FROM companies c WHERE c.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admin can insert own company staff shifts"
  ON public.staff_shifts FOR INSERT TO authenticated
  WITH CHECK (
    staff_id IN (
      SELECT sp.id FROM staff_profiles sp
      WHERE sp.company_id IN (
        SELECT c.id FROM companies c WHERE c.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admin can update own company staff shifts"
  ON public.staff_shifts FOR UPDATE TO authenticated
  USING (
    staff_id IN (
      SELECT sp.id FROM staff_profiles sp
      WHERE sp.company_id IN (
        SELECT c.id FROM companies c WHERE c.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admin can delete own company staff shifts"
  ON public.staff_shifts FOR DELETE TO authenticated
  USING (
    staff_id IN (
      SELECT sp.id FROM staff_profiles sp
      WHERE sp.company_id IN (
        SELECT c.id FROM companies c WHERE c.auth_user_id = auth.uid()
      )
    )
  );
