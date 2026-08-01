-- Phase 1: Automations Schema Updates

-- 1. Automation Settings
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS automation_settings JSONB DEFAULT '{
  "auto_request_reviews": false,
  "review_delay_minutes": 30,
  "minimum_sentiment_score": 0.8
}'::jsonb;

-- Ensure it exists in the schema cache
NOTIFY pgrst, 'reload schema';
