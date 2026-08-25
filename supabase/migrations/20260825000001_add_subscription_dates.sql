-- Add subscription date tracking columns to companies table
-- These allow the superadmin to set explicit start/end dates when manually activating subscriptions

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Backfill: For companies already active, set subscription_started_at to their created_at
UPDATE companies
  SET subscription_started_at = created_at
  WHERE subscription_status = 'active' AND subscription_started_at IS NULL;
