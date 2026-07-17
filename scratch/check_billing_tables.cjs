const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Find all public tables matching billing/payment
    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name LIKE '%billing%' OR table_name LIKE '%payment%' OR table_name LIKE '%charge%')
    `);
    console.log("=== Matching Tables ===");
    console.log(tables.map(t => t.table_name));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
