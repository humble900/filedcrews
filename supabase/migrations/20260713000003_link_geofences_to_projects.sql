-- Link geofences to projects (optional — nullable means company-level geofence)
ALTER TABLE public.geofences
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_geofences_project_id ON public.geofences(project_id);
