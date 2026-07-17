const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Locating seniorniki258@gmail.com auth details...");

    const { rows: users } = await client.query(
      `SELECT id FROM auth.users WHERE email = 'seniorniki258@gmail.com'`
    );

    if (users.length === 0) {
      console.error("User seniorniki258@gmail.com not found!");
      process.exit(1);
    }

    const userId = users[0].id;
    console.log(`Found User ID: ${userId}`);

    // Update staff_profiles to link auth_user_id correctly
    console.log("Updating staff_profiles entry...");
    await client.query(`
      UPDATE public.staff_profiles 
      SET auth_user_id = $1 
      WHERE username = 'senior_admin' OR id = $1
    `, [userId]);

    // Let's verify it
    const { rows: profiles } = await client.query(
      `SELECT id, username, auth_user_id, company_id FROM public.staff_profiles WHERE auth_user_id = $1`,
      [userId]
    );
    console.log("Verified Profile in Database:", profiles);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
