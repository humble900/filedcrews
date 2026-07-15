
-- Drop all existing policies on companies
DROP POLICY IF EXISTS "Users can read own company" ON public.companies;
DROP POLICY IF EXISTS "Users can insert own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update own company" ON public.companies;

-- Drop all existing policies on staff_profiles
DROP POLICY IF EXISTS "Admin can read own company staff" ON public.staff_profiles;
DROP POLICY IF EXISTS "Admin can update own company staff" ON public.staff_profiles;

-- Drop all existing policies on geofences
DROP POLICY IF EXISTS "Admin can read own geofences" ON public.geofences;
DROP POLICY IF EXISTS "Admin can insert own geofences" ON public.geofences;
DROP POLICY IF EXISTS "Admin can update own geofences" ON public.geofences;
DROP POLICY IF EXISTS "Admin can delete own geofences" ON public.geofences;

-- Drop all existing policies on staff_locations
DROP POLICY IF EXISTS "Admin can read own company staff locations" ON public.staff_locations;

-- Drop all existing policies on staff_location_history
DROP POLICY IF EXISTS "Admin can read own company staff history" ON public.staff_location_history;

-- Drop all existing policies on geofence_events
DROP POLICY IF EXISTS "Admin can read own geofence events" ON public.geofence_events;
DROP POLICY IF EXISTS "Service can insert geofence events" ON public.geofence_events;

-- Drop all existing policies on staff_shifts
DROP POLICY IF EXISTS "Admin can read own company staff shifts" ON public.staff_shifts;
DROP POLICY IF EXISTS "Admin can insert own company staff shifts" ON public.staff_shifts;
DROP POLICY IF EXISTS "Admin can update own company staff shifts" ON public.staff_shifts;
DROP POLICY IF EXISTS "Admin can delete own company staff shifts" ON public.staff_shifts;


-- ==========================================
-- 1. COMPANIES POLICIES
-- ==========================================
CREATE POLICY "Admin read own company" ON public.companies
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Admin insert own company" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Admin update own company" ON public.companies
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid());

-- Staff members can read the company they belong to
CREATE POLICY "Staff read own company" ON public.companies
  FOR SELECT TO authenticated
  USING (id IN (
    SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
  ));


-- ==========================================
-- 2. STAFF PROFILES POLICIES
-- ==========================================
CREATE POLICY "Admin manage company staff" ON public.staff_profiles
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff read own profile" ON public.staff_profiles
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());


-- ==========================================
-- 3. GEOFENCES POLICIES
-- ==========================================
CREATE POLICY "Admin manage geofences" ON public.geofences
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff read geofences" ON public.geofences
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
  ));


-- ==========================================
-- 4. STAFF LOCATIONS POLICIES
-- ==========================================
CREATE POLICY "Admin manage staff locations" ON public.staff_locations
  FOR ALL TO authenticated
  USING (staff_id IN (
    SELECT id FROM public.staff_profiles WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (staff_id IN (
    SELECT id FROM public.staff_profiles WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Staff view and update own location" ON public.staff_locations
  FOR ALL TO authenticated
  USING (staff_id IN (SELECT id FROM public.staff_profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (staff_id IN (SELECT id FROM public.staff_profiles WHERE auth_user_id = auth.uid()));


-- ==========================================
-- 5. STAFF LOCATION HISTORY POLICIES
-- ==========================================
CREATE POLICY "Admin manage staff history" ON public.staff_location_history
  FOR ALL TO authenticated
  USING (staff_id IN (
    SELECT id FROM public.staff_profiles WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (staff_id IN (
    SELECT id FROM public.staff_profiles WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Staff view and insert own history" ON public.staff_location_history
  FOR ALL TO authenticated
  USING (staff_id IN (SELECT id FROM public.staff_profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (staff_id IN (SELECT id FROM public.staff_profiles WHERE auth_user_id = auth.uid()));


-- ==========================================
-- 6. GEOFENCE EVENTS POLICIES
-- ==========================================
CREATE POLICY "Admin manage geofence events" ON public.geofence_events
  FOR ALL TO authenticated
  USING (staff_id IN (
    SELECT id FROM public.staff_profiles WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (staff_id IN (
    SELECT id FROM public.staff_profiles WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Staff view and insert own events" ON public.geofence_events
  FOR ALL TO authenticated
  USING (staff_id IN (SELECT id FROM public.staff_profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (staff_id IN (SELECT id FROM public.staff_profiles WHERE auth_user_id = auth.uid()));


-- ==========================================
-- 7. STAFF SHIFTS POLICIES
-- ==========================================
CREATE POLICY "Admin manage shifts" ON public.staff_shifts
  FOR ALL TO authenticated
  USING (staff_id IN (
    SELECT id FROM public.staff_profiles WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (staff_id IN (
    SELECT id FROM public.staff_profiles WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Staff view own shifts" ON public.staff_shifts
  FOR SELECT TO authenticated
  USING (staff_id IN (SELECT id FROM public.staff_profiles WHERE auth_user_id = auth.uid()));
