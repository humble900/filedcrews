-- ============================================================
-- Migration: AI Copilot Monthly Credit System
-- Adds per-company AI credit tracking for metered AI usage.
-- ============================================================

-- 1. Add AI credit columns to companies table
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS ai_credits_monthly_limit INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_credits_bonus INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_credits_reset_at TIMESTAMPTZ DEFAULT (date_trunc('month', now()) + interval '1 month');

-- 2. Set initial monthly limits based on existing subscription tier
UPDATE public.companies SET ai_credits_monthly_limit = CASE
  WHEN subscription_tier IN ('growth')                              THEN 200
  WHEN subscription_tier IN ('founding_partner', 'Founding Partner') THEN 500
  WHEN subscription_tier IN ('enterprise')                          THEN 1000
  ELSE 0  -- free_trial / Free / unknown
END
WHERE ai_credits_monthly_limit = 0;

-- 3. Create a trigger function that auto-sets credit limit whenever subscription_tier changes
CREATE OR REPLACE FUNCTION public.fn_sync_ai_credits_on_tier_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    NEW.ai_credits_monthly_limit := CASE
      WHEN NEW.subscription_tier IN ('growth')                              THEN 200
      WHEN NEW.subscription_tier IN ('founding_partner', 'Founding Partner') THEN 500
      WHEN NEW.subscription_tier IN ('enterprise')                          THEN 1000
      ELSE 0
    END;
    -- Reset usage when upgrading
    IF NEW.ai_credits_monthly_limit > OLD.ai_credits_monthly_limit THEN
      NEW.ai_credits_used := 0;
      NEW.ai_credits_reset_at := date_trunc('month', now()) + interval '1 month';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_ai_credits_on_tier_change ON public.companies;
CREATE TRIGGER trg_sync_ai_credits_on_tier_change
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_ai_credits_on_tier_change();

-- 4. Index for fast credit lookups
CREATE INDEX IF NOT EXISTS idx_companies_ai_credits_reset ON public.companies(ai_credits_reset_at);

-- 5. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
