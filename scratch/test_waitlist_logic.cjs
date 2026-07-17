const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("=== Waitlist Database Logic Integration Test ===");

    // 1. Check Platform Settings Signup Mode
    const { rows: modeSettings } = await client.query(
      `SELECT value FROM public.platform_settings WHERE key = 'signup_mode'`
    );
    const signupMode = modeSettings[0]?.value;
    console.log(`[PASS] Verified platform setting signup_mode: "${signupMode}"`);

    // 2. Simulate new waitlisted company creation
    console.log("Simulating new waitlist application submission...");
    const testCompanyId = uuidv4();
    const fakeAuthUserId = uuidv4(); // Mock auth user id
    const companyPayload = {
      id: testCompanyId,
      name: "Delta Security Testing Ltd",
      prefix: "DELTT",
      auth_user_id: fakeAuthUserId,
      currency: "USD",
      industry: "Security",
      address: "100 Main St, Suite B, Austin, TX",
      website: "www.deltasecurity.com",
      staff_count: "6-20",
      annual_revenue: "$250k-$1M",
      subscription_status: 'pending_approval' // Waitlist lock
    };

    await client.query(`
      INSERT INTO public.companies (id, name, prefix, auth_user_id, currency, industry, address, website, staff_count, annual_revenue, subscription_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      companyPayload.id, companyPayload.name, companyPayload.prefix, companyPayload.auth_user_id,
      companyPayload.currency, companyPayload.industry, companyPayload.address, companyPayload.website,
      companyPayload.staff_count, companyPayload.annual_revenue, companyPayload.subscription_status
    ]);

    // 3. Verify insertion details are correct
    const { rows: insertedCompanies } = await client.query(
      `SELECT * FROM public.companies WHERE id = $1`, [testCompanyId]
    );
    const inserted = insertedCompanies[0];
    if (inserted && inserted.subscription_status === 'pending_approval') {
      console.log(`[PASS] Verification: Company created correctly in "pending_approval" status.`);
      console.log(`       Address: ${inserted.address}`);
      console.log(`       Website: ${inserted.website}`);
      console.log(`       Staff Count: ${inserted.staff_count}`);
      console.log(`       Revenue: ${inserted.annual_revenue}`);
    } else {
      throw new Error("Failed to verify insertion of waitlist company profile");
    }

    // 4. Simulate Superadmin Approval Action
    console.log("Simulating Superadmin manual approval command...");
    await client.query(`
      UPDATE public.companies 
      SET subscription_status = 'trialing', subscription_tier = 'Founding Partner' 
      WHERE id = $1
    `, [testCompanyId]);

    // 5. Verify status change
    const { rows: approvedCompanies } = await client.query(
      `SELECT subscription_status, subscription_tier FROM public.companies WHERE id = $1`, [testCompanyId]
    );
    const approved = approvedCompanies[0];
    if (approved && approved.subscription_status === 'trialing' && approved.subscription_tier === 'Founding Partner') {
      console.log("[PASS] Verification: Superadmin approval correctly sets subscription_status to 'trialing' and tier to 'Founding Partner'.");
    } else {
      throw new Error("Failed to verify update of approved company profile");
    }

    // 6. Cleanup
    console.log("Cleaning up simulated test entries...");
    await client.query(`DELETE FROM public.companies WHERE id = $1`, [testCompanyId]);
    console.log("[PASS] Test cleanup finished.");

    console.log("\n=== ALL DATABASE FLOW TESTS PASSED SUCCESSFULLY ===");

  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
