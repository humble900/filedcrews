-- Migration: Add multiple photo URLs tracking arrays to tasks
-- Migration File: 20260715000007_add_multiple_photos_to_tasks.sql

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS before_photo_urls text[] DEFAULT '{}'::text[];
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS after_photo_urls text[] DEFAULT '{}'::text[];
