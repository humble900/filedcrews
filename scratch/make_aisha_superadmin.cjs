const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Locating Aisha Anderson's auth profile...");

    const { rows: users } = await client.query(
      `SELECT id, email FROM auth.users WHERE email = 'ombodonti8@internal.local'`
    );

    if (users.length === 0) {
      console.error("Aisha Anderson's auth profile not found in auth.users!");
      process.exit(1);
    }

    const aishaUserId = users[0].id;
    console.log(`Found Aisha Anderson's user ID: ${aishaUserId}`);

    // Insert into platform_admins
    console.log("Adding Aisha Anderson to platform_admins table...");
    await client.query(`
      INSERT INTO public.platform_admins (user_id)
      VALUES ($1)
      ON CONFLICT DO NOTHING
    `, [aishaUserId]);

    console.log("[PASS] Aisha Anderson is now a Platform Superadmin! She can access the Superadmin Dashboard at /superadmin.");

  } catch (err) {
    console.error("Error during execution:", err);
  } finally {
    await client.end();
  }
}

main();
