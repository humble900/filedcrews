const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Locating user profiles...");

    // 1. Remove Aisha Anderson (ombodonti8@internal.local) from platform_admins
    const { rows: aishaUsers } = await client.query(
      `SELECT id FROM auth.users WHERE email = 'ombodonti8@internal.local'`
    );
    if (aishaUsers.length > 0) {
      const aishaId = aishaUsers[0].id;
      console.log(`Removing Aisha Anderson (${aishaId}) from platform_admins...`);
      await client.query(`DELETE FROM public.platform_admins WHERE user_id = $1`, [aishaId]);
    }

    // 2. Locate seniorniki258@gmail.com
    const { rows: targetUsers } = await client.query(
      `SELECT id, email FROM auth.users WHERE email = 'seniorniki258@gmail.com'`
    );

    if (targetUsers.length === 0) {
      console.error("User 'seniorniki258@gmail.com' not found in auth.users! Ensure they are registered first.");
      process.exit(1);
    }

    const newAdminId = targetUsers[0].id;
    console.log(`Found target user ID for seniorniki258@gmail.com: ${newAdminId}`);

    // 3. Add to platform_admins
    console.log("Adding seniorniki258@gmail.com to platform_admins table...");
    await client.query(`
      INSERT INTO public.platform_admins (user_id)
      VALUES ($1)
      ON CONFLICT DO NOTHING
    `, [newAdminId]);

    // 4. Ensure they have a profile in staff_profiles so they render correctly
    console.log("Checking staff_profiles entry for seniorniki258@gmail.com...");
    const { rows: existingProfiles } = await client.query(
      `SELECT id FROM public.staff_profiles WHERE id = $1`, [newAdminId]
    );

    if (existingProfiles.length === 0) {
      console.log("Creating default staff profile for seniorniki258@gmail.com...");
      // Let's attach to company ombodo (default) for dashboard visualization
      const companyId = '530a86d6-1e2c-43d8-bbf8-ece534a247f8';
      await client.query(`
        INSERT INTO public.staff_profiles (id, username, full_name, first_name, last_name, job_title, company_id, is_active, global_role, can_manage_roles)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'Admin', true)
      `, [newAdminId, 'senior_admin', 'Senior Administrator', 'Senior', 'Admin', 'Superadmin', companyId]);
    }

    console.log("[PASS] Configured seniorniki258@gmail.com as the exclusive Platform Superadmin successfully!");

  } catch (err) {
    console.error("Error during execution:", err);
  } finally {
    await client.end();
  }
}

main();
