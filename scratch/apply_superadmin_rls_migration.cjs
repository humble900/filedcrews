const fs = require('fs');
const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";
const sqlPath = "c:/Users/USER/staff-coordinator/supabase/migrations/20260716000000_superadmin_rls_updates.sql";

async function main() {
  console.log("Reading superadmin RLS updates migration SQL...");
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Executing migration SQL...");
    await client.query(sql);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Error executing migration:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
