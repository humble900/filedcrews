-- Add ai_settings column to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS ai_settings JSONB DEFAULT '{
  "enable_command_bar": false,
  "enable_smart_dispatch": false,
  "enable_voice_copilot": false,
  "autonomy_team_assembly": "draft",
  "autonomy_invoicing": "draft"
}'::jsonb;

-- Ensure it exists in the schema cache
NOTIFY pgrst, 'reload schema';
