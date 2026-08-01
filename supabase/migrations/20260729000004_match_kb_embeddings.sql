-- Migration to create the match_kb_embeddings RPC with strict multi-tenancy enforcement
-- It joins with kb_documents and kb_collections to ensure the agent only accesses data for p_company_id

CREATE OR REPLACE FUNCTION public.match_kb_embeddings(
    p_company_id uuid,
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id uuid,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.content,
        1 - (e.embedding <=> query_embedding) AS similarity
    FROM public.kb_embeddings e
    JOIN public.kb_documents d ON e.document_id = d.id
    JOIN public.kb_collections c ON d.collection_id = c.id
    WHERE c.company_id = p_company_id
      AND 1 - (e.embedding <=> query_embedding) > match_threshold
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
