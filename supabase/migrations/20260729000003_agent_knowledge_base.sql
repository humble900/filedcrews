-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge Base Collections
CREATE TABLE IF NOT EXISTS public.kb_collections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kb_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their kb_collections"
    ON public.kb_collections FOR SELECT
    USING (company_id IN (SELECT company_id FROM public.staff_profiles WHERE staff_profiles.id = auth.uid()));

CREATE POLICY "Superadmins can insert kb_collections"
    ON public.kb_collections FOR INSERT
    WITH CHECK (company_id IN (SELECT company_id FROM public.staff_profiles WHERE staff_profiles.id = auth.uid() AND (global_role = 'Admin' OR global_role = 'Owner')));

CREATE POLICY "Superadmins can update kb_collections"
    ON public.kb_collections FOR UPDATE
    USING (company_id IN (SELECT company_id FROM public.staff_profiles WHERE staff_profiles.id = auth.uid() AND (global_role = 'Admin' OR global_role = 'Owner')));

CREATE POLICY "Superadmins can delete kb_collections"
    ON public.kb_collections FOR DELETE
    USING (company_id IN (SELECT company_id FROM public.staff_profiles WHERE staff_profiles.id = auth.uid() AND (global_role = 'Admin' OR global_role = 'Owner')));

-- Knowledge Base Documents
CREATE TABLE IF NOT EXISTS public.kb_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id uuid NOT NULL REFERENCES public.kb_collections(id) ON DELETE CASCADE,
    title text NOT NULL,
    type text NOT NULL, -- 'url', 'pdf', 'text'
    source_url text, -- For websites or public PDF links
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'ready', 'error'
    error_message text,
    page_count integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kb_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their kb_documents"
    ON public.kb_documents FOR SELECT
    USING (collection_id IN (SELECT id FROM public.kb_collections WHERE company_id IN (SELECT company_id FROM public.staff_profiles WHERE staff_profiles.id = auth.uid())));

CREATE POLICY "Superadmins can manage kb_documents"
    ON public.kb_documents FOR ALL
    USING (collection_id IN (SELECT id FROM public.kb_collections WHERE company_id IN (SELECT company_id FROM public.staff_profiles WHERE staff_profiles.id = auth.uid() AND (global_role = 'Admin' OR global_role = 'Owner'))));

-- Knowledge Base Embeddings
CREATE TABLE IF NOT EXISTS public.kb_embeddings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES public.kb_documents(id) ON DELETE CASCADE,
    content text NOT NULL,
    embedding vector(1536),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- HNSW Index for fast similarity search
CREATE INDEX ON public.kb_embeddings USING hnsw (embedding vector_cosine_ops);

ALTER TABLE public.kb_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their kb_embeddings"
    ON public.kb_embeddings FOR SELECT
    USING (document_id IN (SELECT id FROM public.kb_documents WHERE collection_id IN (SELECT id FROM public.kb_collections WHERE company_id IN (SELECT company_id FROM public.staff_profiles WHERE staff_profiles.id = auth.uid()))));
