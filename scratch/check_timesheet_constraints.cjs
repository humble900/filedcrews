const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const { rows } = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'public.timesheet_entries'::regclass
    `);
    console.log("=== Timesheet Entries Constraints ===");
    console.log(rows);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
