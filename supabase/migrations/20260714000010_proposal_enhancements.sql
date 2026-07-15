-- ==========================================
-- SPRINT 4 — ESTIMATES PROPOSAL ENHANCEMENTS
-- Migration: 20260714000010_proposal_enhancements.sql
-- ==========================================

-- 1. Extend public.estimates table
ALTER TABLE public.estimates 
  ADD COLUMN IF NOT EXISTS introduction text,
  ADD COLUMN IF NOT EXISTS introduction_image_url text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS tax_percent numeric(5, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS disclaimer text,
  ADD COLUMN IF NOT EXISTS client_message text;

-- 2. Extend public.estimate_items table
ALTER TABLE public.estimate_items
  ADD COLUMN IF NOT EXISTS is_optional boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS selected_by_client boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS image_url text;
