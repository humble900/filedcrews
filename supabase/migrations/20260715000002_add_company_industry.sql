-- Migration: Add industry column to companies for dynamic FSM terminology
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry text NOT NULL DEFAULT 'General';

-- Add check constraint for allowed industries
ALTER TABLE companies DROP CONSTRAINT IF EXISTS check_company_industry;
ALTER TABLE companies ADD CONSTRAINT check_company_industry CHECK (industry IN ('General', 'HVAC', 'Landscaping', 'Electrical', 'Plumbing', 'Cleaning', 'Security'));
