-- =====================================================================
-- PHASE 8 — ENTERPRISE IDENTITY, GOVERNANCE & AUDIT TRAIL MIGRATION
-- Migration: 20260801000003_enterprise_features.sql
-- Date: 2026-08-01
-- =====================================================================

-- 1. Enterprise Identity Connections (SSO & SCIM Metadata)
CREATE TABLE IF NOT EXISTS public.enterprise_identity_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('saml', 'oidc', 'scim')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enterprise SCIM Provisioning Tokens
CREATE TABLE IF NOT EXISTS public.scim_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  last_used_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Tenant Feature Flags System
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  configuration jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_company_feature UNIQUE (company_id, feature_key)
);

-- 4. Enterprise Cryptographic Audit Chain Enhancements
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS previous_hash text,
  ADD COLUMN IF NOT EXISTS current_hash text;

-- RLS Enforcement for Enterprise Tables
ALTER TABLE public.enterprise_identity_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scim_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies for Feature Flags
CREATE POLICY "Tenant feature flags policy" ON public.feature_flags
  FOR ALL TO authenticated
  USING (company_id = public.get_staff_company_id(auth.uid()));
