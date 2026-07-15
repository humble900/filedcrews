-- Staff profile enhancements: add contact info + job title
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS job_title text;

-- Backfill: split existing full_name into first_name / last_name
UPDATE public.staff_profiles
  SET first_name = split_part(full_name, ' ', 1),
      last_name  = CASE
        WHEN position(' ' in full_name) > 0
        THEN substring(full_name from position(' ' in full_name) + 1)
        ELSE NULL
      END
  WHERE first_name IS NULL AND full_name IS NOT NULL;
