-- Enum for communication channels
CREATE TYPE contact_method AS ENUM ('sms', 'email', 'whatsapp', 'phone');
CREATE TYPE comm_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE comm_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'received');

-- Add preferred contact method to customers
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS preferred_contact_method contact_method DEFAULT 'email';

-- Create unified communications log
CREATE TABLE IF NOT EXISTS communications_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    
    channel contact_method NOT NULL,
    direction comm_direction NOT NULL,
    status comm_status NOT NULL DEFAULT 'pending',
    
    content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for communications_log
ALTER TABLE communications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_all_communications"
    ON communications_log
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Indexes for efficient querying by customer and job
CREATE INDEX IF NOT EXISTS comms_log_tenant_customer_idx ON communications_log (tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS comms_log_tenant_job_idx ON communications_log (tenant_id, job_id);
