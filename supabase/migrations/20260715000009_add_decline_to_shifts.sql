-- Migration: Add decline columns to shifts table
-- Migration File: 20260715000009_add_decline_to_shifts.sql

ALTER TABLE public.staff_shifts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Confirmed', 'Declined'));
ALTER TABLE public.staff_shifts ADD COLUMN IF NOT EXISTS decline_reason text;
