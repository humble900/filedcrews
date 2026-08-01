-- =====================================================================
-- PHASE 2 — DATABASE CONCURRENCY & DATA INTEGRITY FIXES
-- Migration: 20260801000001_phase2_concurrency_and_integrity.sql
-- Date: 2026-08-01
-- =====================================================================

-- 1. Ensure GIST Extension for Exclusion Guards
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Clean up historical overlapping shifts by setting older duplicate rows to 'Declined'
WITH duplicates AS (
  SELECT s1.id
  FROM public.staff_shifts s1
  JOIN public.staff_shifts s2 ON s1.staff_id = s2.staff_id
    AND s1.id != s2.id
    AND COALESCE(s1.status, '') != 'Declined'
    AND COALESCE(s2.status, '') != 'Declined'
    AND tsrange((s1.shift_date + s1.check_in_time), (s1.shift_date + COALESCE(s1.check_out_time, '23:59:59'::time)), '[)')
        && tsrange((s2.shift_date + s2.check_in_time), (s2.shift_date + COALESCE(s2.check_out_time, '23:59:59'::time)), '[)')
    AND (s1.created_at < s2.created_at OR (s1.created_at = s2.created_at AND s1.id < s2.id))
)
UPDATE public.staff_shifts
SET status = 'Declined'
WHERE id IN (SELECT id FROM duplicates);

-- 3. Shift Overlap Exclusion Guard: Prevent Double-Booking Field Crew Shifts
ALTER TABLE public.staff_shifts
  DROP CONSTRAINT IF EXISTS no_overlapping_tech_shifts;

ALTER TABLE public.staff_shifts
  ADD CONSTRAINT no_overlapping_tech_shifts
  EXCLUDE USING gist (
    staff_id WITH =,
    tsrange((shift_date + check_in_time), (shift_date + COALESCE(check_out_time, '23:59:59'::time)), '[)') WITH &&
  ) WHERE (status IS NULL OR status != 'Declined');

-- 4. Ensure job_materials Table Exists
CREATE TABLE IF NOT EXISTS public.job_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  quantity_used integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Automated Inventory Stock Depletion Trigger
CREATE OR REPLACE FUNCTION public.deplete_inventory_on_job_material()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.inventory_item_id IS NOT NULL AND NEW.quantity_used > 0) THEN
    UPDATE public.inventory_items
    SET current_stock = GREATEST(0, current_stock - NEW.quantity_used)
    WHERE id = NEW.inventory_item_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deplete_inventory ON public.job_materials;

CREATE TRIGGER trg_deplete_inventory
  AFTER INSERT ON public.job_materials
  FOR EACH ROW EXECUTE FUNCTION public.deplete_inventory_on_job_material();

-- 6. Atomic Sequence Generator for Invoices (Pessimistic Row Lock & Sequence Protection)
CREATE SEQUENCE IF NOT EXISTS public.global_invoice_seq START WITH 10001;

CREATE OR REPLACE FUNCTION public.generate_next_invoice_number(p_company_id uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_prefix text;
  v_seq bigint;
BEGIN
  SELECT prefix INTO v_prefix FROM public.companies WHERE id = p_company_id FOR UPDATE;
  IF v_prefix IS NULL THEN
    v_prefix := 'INV';
  END IF;
  v_seq := nextval('public.global_invoice_seq');
  RETURN v_prefix || '-INV-' || lpad(v_seq::text, 6, '0');
END;
$$;
