const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("=== Superadmin Access RLS Policies Verification ===");

    // Verify UPDATE policy on companies is present
    const { rows: companyPolicies } = await client.query(`
      SELECT policyname 
      FROM pg_policies 
      WHERE tablename = 'companies' AND cmd = 'UPDATE' AND policyname LIKE '%Superadmin%'
    `);
    
    if (companyPolicies.length > 0) {
      console.log(`[PASS] Found company UPDATE policy: "${companyPolicies[0].policyname}"`);
    } else {
      throw new Error("Missing UPDATE policy on companies for superadmin!");
    }

    // Verify UPDATE and DELETE policies on staff_profiles are present
    const { rows: profilePolicies } = await client.query(`
      SELECT policyname, cmd 
      FROM pg_policies 
      WHERE tablename = 'staff_profiles' AND (cmd = 'UPDATE' OR cmd = 'DELETE') AND policyname LIKE '%Superadmin%'
    `);

    const hasUpdate = profilePolicies.some(p => p.cmd === 'UPDATE');
    const hasDelete = profilePolicies.some(p => p.cmd === 'DELETE');

    if (hasUpdate && hasDelete) {
      console.log("[PASS] Verified UPDATE and DELETE policies on staff_profiles for superadmin.");
    } else {
      throw new Error(`Missing policies on staff_profiles: update=${hasUpdate}, delete=${hasDelete}`);
    }

    console.log("\n=== ALL SUPERADMIN RLS POLICIES VERIFIED IN DB SUCCESSFULLY ===");

  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
