-- Migration: Add payment details to staff profiles
-- Migration File: 20260715000008_add_payment_details_to_staff.sql

ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS routing_number text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS account_number text;
