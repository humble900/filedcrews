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
    console.log("Connected to database. Activating projects and seeding phases...");

    const project1Id = '838a5a2d-7a7d-4604-84e6-601f2ae91899'; // bodi tomos
    const project2Id = 'df36385d-e82e-41da-9bf0-1442d2313f17'; // ginter united

    // 1. Update project statuses to Active
    console.log("Updating project statuses to 'Active'...");
    await client.query(`
      UPDATE public.projects 
      SET status = 'Active' 
      WHERE id IN ($1, $2)
    `, [project1Id, project2Id]);

    // 2. Clean previous phases for project1
    console.log("Cleaning up old phases...");
    await client.query(`
      UPDATE public.tasks 
      SET phase_id = NULL 
      WHERE job_id IN (SELECT id FROM public.jobs WHERE project_id = $1)
    `, [project1Id]);

    await client.query(`
      DELETE FROM public.project_phases 
      WHERE project_id = $1
    `, [project1Id]);

    // 3. Insert 2 phases for project1 (bodi tomos)
    console.log("Seeding project phases...");
    const phase1Id = uuidv4();
    const phase2Id = uuidv4();

    await client.query(`
      INSERT INTO public.project_phases (id, project_id, name, status, progress_percent, start_date, end_date)
      VALUES ($1, $2, 'Phase 1: Diagnostic & Electrical Wiring', 'In Progress', 60, NOW() - interval '5 days', NOW() + interval '5 days')
    `, [phase1Id, project1Id]);

    await client.query(`
      INSERT INTO public.project_phases (id, project_id, name, status, progress_percent, start_date, end_date)
      VALUES ($1, $2, 'Phase 2: Equipment Mounting & Commissioning', 'Not Started', 0, NOW() + interval '6 days', NOW() + interval '15 days')
    `, [phase2Id, project1Id]);

    // 4. Assign tasks to the correct phases
    console.log("Linking tasks to phases...");

    // Phase 1 tasks (HVAC retrofit, fuse board, sewer clearout)
    await client.query(`
      UPDATE public.tasks 
      SET phase_id = $1 
      WHERE job_id IN (
        SELECT id FROM public.jobs 
        WHERE project_id = $2 AND title IN ('HVAC Air Compressor Retrofit', 'Industrial Fuse Board Renewal', 'Sewer Line Pipeline Clearout')
      )
    `, [phase1Id, project1Id]);

    // Phase 2 tasks (solar rack framing, warehouse joist repair)
    await client.query(`
      UPDATE public.tasks 
      SET phase_id = $1 
      WHERE job_id IN (
        SELECT id FROM public.jobs 
        WHERE project_id = $2 AND title IN ('Residential Solar Rack Framing', 'Warehouse Support Joist Repair')
      )
    `, [phase2Id, project1Id]);

    console.log("Project activation and phase alignment complete!");

  } catch (err) {
    console.error("Error during execution:", err);
  } finally {
    await client.end();
  }
}

main();
