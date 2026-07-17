const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Removing seniorniki258@gmail.com from public.staff_profiles table...");

    const { rows: users } = await client.query(
      `SELECT id FROM auth.users WHERE email = 'seniorniki258@gmail.com'`
    );

    if (users.length === 0) {
      console.error("User not found!");
      process.exit(1);
    }

    const userId = users[0].id;

    // Delete their profile row to decouple them entirely from company data structures
    await client.query(`
      DELETE FROM public.staff_profiles 
      WHERE auth_user_id = $1
    `, [userId]);

    console.log("[PASS] Successfully removed superadmin from the public.staff_profiles directory.");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
