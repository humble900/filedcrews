
-- Staff profiles table
CREATE TABLE public.staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  auth_user_id uuid UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Staff locations (latest per staff)
CREATE TABLE public.staff_locations (
  staff_id uuid PRIMARY KEY REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Staff location history
CREATE TABLE public.staff_location_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_location_history_staff_time ON public.staff_location_history (staff_id, created_at DESC);

-- Enable realtime for staff_locations so the map updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_locations;
