-- SQL Migration: Add company onboarding metadata fields
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS staff_count text,
ADD COLUMN IF NOT EXISTS annual_revenue text;
