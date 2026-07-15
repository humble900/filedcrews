-- Check if key tables and columns from the 20260712 migrations actually exist
-- 1. Check staff_profiles columns from 20260712000001
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'staff_profiles' 
ORDER BY ordinal_position;
