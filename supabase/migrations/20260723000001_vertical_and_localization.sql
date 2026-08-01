-- Add country to companies for localization
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'US';

-- Add trade certifications to staff_profiles
ALTER TABLE staff_profiles
ADD COLUMN IF NOT EXISTS trade_certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS gas_safe_registered BOOLEAN DEFAULT false;

-- Create dynamic vertical_data table linked to jobs
CREATE TABLE IF NOT EXISTS vertical_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for vertical_data
ALTER TABLE vertical_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_all_vertical_data"
    ON vertical_data
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Unique index to ensure only one vertical data payload per job
CREATE UNIQUE INDEX IF NOT EXISTS vertical_data_job_id_idx ON vertical_data (job_id);
