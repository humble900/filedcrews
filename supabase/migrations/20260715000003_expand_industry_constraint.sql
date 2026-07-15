-- Migration: Expand check_company_industry constraint to include 'Fleet' (Internal Fleet Logistics & Scheduled Dispatch)
ALTER TABLE companies DROP CONSTRAINT IF EXISTS check_company_industry;
ALTER TABLE companies ADD CONSTRAINT check_company_industry CHECK (industry IN ('General', 'HVAC', 'Landscaping', 'Electrical', 'Plumbing', 'Cleaning', 'Security', 'Fleet'));
