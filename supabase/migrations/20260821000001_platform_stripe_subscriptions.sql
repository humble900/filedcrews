-- Migration: Add platform Stripe subscription columns to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT (now() + interval '14 days');

-- Create indices for performant webhook lookups
CREATE INDEX IF NOT EXISTS idx_companies_stripe_customer ON public.companies(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_companies_stripe_subscription ON public.companies(stripe_subscription_id);

-- Optional: Create subscription audit events table
CREATE TABLE IF NOT EXISTS public.platform_billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  stripe_event_id text,
  event_type text NOT NULL,
  plan_tier text,
  amount_cents integer,
  currency text DEFAULT 'usd',
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_company ON public.platform_billing_events(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe_event ON public.platform_billing_events(stripe_event_id);

-- Enable RLS on billing events
ALTER TABLE public.platform_billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their company billing events"
  ON public.platform_billing_events
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.staff_profiles 
      WHERE auth_user_id = auth.uid() AND global_role IN ('Admin', 'Owner', 'Platform Superadmin')
    )
  );
