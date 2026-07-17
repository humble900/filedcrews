const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Setting superadmin profile to be fully independent (company_id = NULL)...");

    const { rows: users } = await client.query(
      `SELECT id FROM auth.users WHERE email = 'seniorniki258@gmail.com'`
    );

    if (users.length === 0) {
      console.error("User seniorniki258@gmail.com not found!");
      process.exit(1);
    }

    const userId = users[0].id;

    // Set company_id to NULL to make the superadmin independent
    await client.query(`
      UPDATE public.staff_profiles 
      SET company_id = NULL 
      WHERE auth_user_id = $1
    `, [userId]);

    // Verify it
    const { rows: profiles } = await client.query(
      `SELECT id, username, auth_user_id, company_id FROM public.staff_profiles WHERE auth_user_id = $1`,
      [userId]
    );
    console.log("Verified Profile Details (Independent):", profiles);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
