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

    // 1. Find tables matching patterns
    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name LIKE '%timesheet%' OR table_name LIKE '%invoice_item%' OR table_name LIKE '%invoice_line%' OR table_name LIKE '%project_staff%' OR table_name LIKE '%project_member%' OR table_name LIKE '%project_assignment%' OR table_name LIKE '%inventory%' OR table_name LIKE '%product%')
    `);
    console.log("=== Matching Tables ===");
    console.log(tables.map(t => t.name || t.table_name));

    // 2. Query columns of timesheet_entries and others if they exist
    const targetTables = ['timesheet_entries', 'inventory', 'invoice_items', 'project_members', 'project_assignments'];
    for (const table of targetTables) {
      const { rows: columns } = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      if (columns.length > 0) {
        console.log(`\n=== Columns for table: ${table} ===`);
        columns.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`));
      }
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
