const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Querying project statuses...");

    const companyId = '530a86d6-1e2c-43d8-bbf8-ece534a247f8'; // ombodo

    const { rows: projects } = await client.query(`
      SELECT id, name, status, contract_value, start_date, end_date FROM public.projects WHERE company_id = $1
    `, [companyId]);
    console.log(projects);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
