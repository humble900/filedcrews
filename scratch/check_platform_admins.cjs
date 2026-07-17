const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Checking active superadmins (platform_admins)...");

    // Get all admin rows joined with profiles if possible, or auth users
    const { rows: admins } = await client.query(`
      SELECT pa.user_id, sp.full_name, sp.username, sp.global_role, au.email
      FROM public.platform_admins pa
      LEFT JOIN public.staff_profiles sp ON pa.user_id = sp.id
      LEFT JOIN auth.users au ON pa.user_id = au.id
    `);
    console.log(admins);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
