-- Add planned_costs JSONB column to estimates table for inline cost tracking
ALTER TABLE public.estimates 
ADD COLUMN IF NOT EXISTS planned_costs JSONB NOT NULL DEFAULT '[]'::jsonb;
