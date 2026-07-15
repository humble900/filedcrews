-- Migration: Add attachment_urls to incident reports
-- Migration File: 20260715000010_add_attachments_to_incidents.sql

ALTER TABLE public.incident_reports ADD COLUMN IF NOT EXISTS attachment_urls text[];
