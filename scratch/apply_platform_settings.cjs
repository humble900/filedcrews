const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

const ddl = `
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read platform_settings" ON public.platform_settings;
CREATE POLICY "Public read platform_settings" ON public.platform_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage platform_settings" ON public.platform_settings;
CREATE POLICY "Admin manage platform_settings" ON public.platform_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
    )
  );

INSERT INTO public.platform_settings (key, value)
VALUES ('signup_mode', 'founders_partner')
ON CONFLICT (key) DO NOTHING;
`;

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database. Applying platform_settings DDL...");
    await client.query(ddl);
    console.log("platform_settings table successfully created, secured, and seeded!");
  } catch (err) {
    console.error("Error executing DDL:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
