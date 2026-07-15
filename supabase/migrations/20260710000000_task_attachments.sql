-- Add task tracking and verification columns to public.tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS staff_notes text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'Pending';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS manager_feedback text;

-- Create public.project_documents table
CREATE TABLE IF NOT EXISTS public.project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL, -- 'pdf', 'csv', 'image'
  uploaded_by uuid REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on project_documents
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES FOR PROJECT DOCUMENTS
-- ==========================================
CREATE POLICY "Admin manage project documents" ON public.project_documents
  FOR ALL TO authenticated
  USING (project_id IN (
    SELECT id FROM public.projects WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (project_id IN (
    SELECT id FROM public.projects WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Staff read project documents" ON public.project_documents
  FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT id FROM public.projects WHERE company_id IN (
      SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Staff insert project documents" ON public.project_documents
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (
    SELECT id FROM public.projects WHERE company_id IN (
      SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
    )
  ));

-- ==========================================
-- STORAGE BUCKET: task-attachments
-- ==========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to task-attachments
CREATE POLICY "Authenticated users can upload task attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'task-attachments');

-- Allow authenticated users to update/replace task attachments
CREATE POLICY "Authenticated users can update task attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'task-attachments');

-- Allow authenticated users to delete task attachments
CREATE POLICY "Authenticated users can delete task attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'task-attachments');

-- Allow public read access to task attachments
CREATE POLICY "Public read access for task attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'task-attachments');
