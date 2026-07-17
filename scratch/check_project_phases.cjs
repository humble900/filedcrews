const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check if project_phases table exists
    const { rows: tableCheck } = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'project_phases'
    `);
    console.log("=== project_phases Table Exists ===");
    console.log(tableCheck);

    if (tableCheck.length > 0) {
      const { rows: columns } = await client.query(`
        SELECT column_name, data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'project_phases'
      `);
      console.log("=== project_phases Columns ===");
      console.log(columns);

      const { rows: phases } = await client.query(`
        SELECT * FROM public.project_phases LIMIT 5
      `);
      console.log("=== project_phases Rows ===");
      console.log(phases);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
