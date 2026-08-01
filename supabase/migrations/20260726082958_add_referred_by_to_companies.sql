-- Add referred_by to companies table to track affiliate referrals
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS referred_by text;
