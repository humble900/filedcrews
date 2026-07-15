-- ==========================================
-- PHASE 2 — MONEY: accounting_sync_logs Table
-- Migration: 20260714000004_phase2_accounting_sync.sql
-- Date: 2026-07-14
-- ==========================================

CREATE TABLE public.accounting_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('QuickBooks', 'Xero')),
  records_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  synced_by uuid REFERENCES public.staff_profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_accounting_sync_logs_company ON public.accounting_sync_logs (company_id);

ALTER TABLE public.accounting_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage sync logs" ON public.accounting_sync_logs
  FOR ALL TO authenticated
  USING (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff read sync logs" ON public.accounting_sync_logs
  FOR SELECT TO authenticated
  USING (company_id = public.get_staff_company_id(auth.uid()));

CREATE POLICY "Staff write sync logs" ON public.accounting_sync_logs
  FOR ALL TO authenticated
  USING (company_id = public.get_staff_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_staff_company_id(auth.uid()));

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounting_sync_logs;
