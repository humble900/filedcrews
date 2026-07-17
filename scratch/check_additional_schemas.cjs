const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database.");

    // 1. Find all tables matching patterns
    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name LIKE '%crew%' OR table_name LIKE '%task%' OR table_name LIKE '%service_request%' OR table_name LIKE '%request%')
    `);
    console.log("=== Matching Tables ===");
    console.log(tables.map(t => t.table_name));

    // 2. Query columns of crews, crew_members, and tasks
    const targetTables = ['crews', 'crew_members', 'tasks', 'service_requests', 'incident_reports'];
    for (const table of targetTables) {
      const { rows: columns } = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      console.log(`\n=== Columns for table: ${table} ===`);
      columns.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`));
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
