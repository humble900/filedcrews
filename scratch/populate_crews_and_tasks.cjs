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
    console.log("Connected to database. Commencing detailed entities seeding...");

    const companyId = '530a86d6-1e2c-43d8-bbf8-ece534a247f8'; // ombodo
    const customerId = '3d4ce61b-538d-4877-a6e7-ad4626679285'; // timer stave
    const projectId = '838a5a2d-7a7d-4604-84e6-601f2ae91899'; // bodi tomos

    // Clean up from previous partial run to avoid unique/duplicate key violations
    console.log("Cleaning up previous runs...");
    const usernames = [
      'carlos_ramirez', 'sarah_jenkins', 'david_lee', 'elena_rostova', 'marcus_vance',
      'chloe_dupont', 'james_carter', 'linda_ng', 'robert_taylor', 'patricia_kelly'
    ];
    const crewNames = [
      'HVAC Alpha Crew', 'Electrical Sparks', 'Plumbing Repair Squad', 'Solar Power Installers', 'General Site Handymen'
    ];

    // Clean tasks and jobs linked to these staff members
    await client.query(`
      DELETE FROM public.tasks 
      WHERE assignee_id IN (SELECT id FROM public.staff_profiles WHERE username = ANY($1))
    `, [usernames]);

    await client.query(`
      DELETE FROM public.jobs 
      WHERE assigned_staff_id IN (SELECT id FROM public.staff_profiles WHERE username = ANY($1))
    `, [usernames]);

    // Clean crew members and crews
    await client.query(`
      DELETE FROM public.crew_members 
      WHERE crew_id IN (SELECT id FROM public.crews WHERE name = ANY($1))
    `, [crewNames]);

    await client.query(`
      DELETE FROM public.crews 
      WHERE name = ANY($1) AND company_id = $2
    `, [crewNames, companyId]);

    // Clean incident reports and service requests
    await client.query(`
      DELETE FROM public.incident_reports 
      WHERE reporter_id IN (SELECT id FROM public.staff_profiles WHERE username = ANY($1))
    `, [usernames]);

    await client.query(`
      DELETE FROM public.service_requests 
      WHERE customer_id = $1 AND urgency IN ('urgent', 'normal', 'emergency', 'low')
    `, [customerId]);

    // Clean staff profiles
    await client.query(`
      DELETE FROM public.staff_profiles 
      WHERE username = ANY($1) AND company_id = $2
    `, [usernames, companyId]);

    // 1. Fetch default job type to associate with jobs
    const { rows: jobTypes } = await client.query(
      `SELECT id FROM public.job_types WHERE company_id = $1 LIMIT 1`, [companyId]
    );
    const jobTypeId = jobTypes.length > 0 ? jobTypes[0].id : null;

    // 2. Create 10 staff profiles
    console.log("Creating 10 team members...");
    const team = [
      { first: 'Carlos', last: 'Ramirez', title: 'HVAC Technician', user: 'carlos_ramirez' },
      { first: 'Sarah', last: 'Jenkins', title: 'Electrician', user: 'sarah_jenkins' },
      { first: 'David', last: 'Lee', title: 'Plumber', user: 'david_lee' },
      { first: 'Elena', last: 'Rostova', title: 'Carpenter', user: 'elena_rostova' },
      { first: 'Marcus', last: 'Vance', title: 'Solar Installer', user: 'marcus_vance' },
      { first: 'Chloe', last: 'Dupont', title: 'Inspector', user: 'chloe_dupont' },
      { first: 'James', last: 'Carter', title: 'Technician', user: 'james_carter' },
      { first: 'Linda', last: 'Ng', title: 'Cleaning Specialist', user: 'linda_ng' },
      { first: 'Robert', last: 'Taylor', title: 'Roofer', user: 'robert_taylor' },
      { first: 'Patricia', last: 'Kelly', title: 'Locksmith', user: 'patricia_kelly' }
    ];

    const staffIds = [];
    for (const m of team) {
      const id = uuidv4();
      const fullName = `${m.first} ${m.last}`;
      await client.query(`
        INSERT INTO public.staff_profiles (id, username, full_name, first_name, last_name, job_title, company_id, is_active, global_role, can_manage_roles)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'Field Crew', false)
      `, [id, m.user, fullName, m.first, m.last, m.title, companyId]);
      staffIds.push(id);
    }
    console.log(`Successfully created ${staffIds.length} staff profiles.`);

    // 3. Create 5 crews
    console.log("Creating 5 crews...");
    const crews = [
      { name: 'HVAC Alpha Crew', desc: 'Commercial HVAC diagnostics and replacements' },
      { name: 'Electrical Sparks', desc: 'Heavy duty wiring and panel installations' },
      { name: 'Plumbing Repair Squad', desc: 'Emergency pipe maintenance and cleaning' },
      { name: 'Solar Power Installers', desc: 'Rooftop photovoltiac framing and wiring' },
      { name: 'General Site Handymen', desc: 'Routine facility inspection and woodwork repairs' }
    ];

    const crewIds = [];
    for (const c of crews) {
      const id = uuidv4();
      await client.query(`
        INSERT INTO public.crews (id, company_id, name, description)
        VALUES ($1, $2, $3, $4)
      `, [id, companyId, c.name, c.desc]);
      crewIds.push(id);
    }
    console.log(`Successfully created ${crewIds.length} crews.`);

    // 4. Assign members to crews
    console.log("Assigning team members to crews...");
    for (let i = 0; i < crewIds.length; i++) {
      const crewId = crewIds[i];
      // Assign 2 members to each crew
      const idx1 = i * 2;
      const idx2 = i * 2 + 1;
      
      await client.query(`
        INSERT INTO public.crew_members (id, crew_id, staff_id, added_at)
        VALUES ($1, $2, $3, NOW())
      `, [uuidv4(), crewId, staffIds[idx1]]);

      await client.query(`
        INSERT INTO public.crew_members (id, crew_id, staff_id, added_at)
        VALUES ($1, $2, $3, NOW())
      `, [uuidv4(), crewId, staffIds[idx2]]);
    }

    // 5. Create 5 jobs and assign them to crew lead (staff member)
    console.log("Creating 5 crew jobs and assigning them...");
    const crewJobs = [
      { title: 'HVAC Air Compressor Retrofit', staffIdx: 0 },
      { title: 'Industrial Fuse Board Renewal', staffIdx: 2 },
      { title: 'Sewer Line Pipeline Clearout', staffIdx: 4 },
      { title: 'Residential Solar Rack Framing', staffIdx: 6 },
      { title: 'Warehouse Support Joist Repair', staffIdx: 8 }
    ];

    const jobIds = [];
    for (let i = 0; i < crewJobs.length; i++) {
      const jobInfo = crewJobs[i];
      const jobId = uuidv4();
      const assigneeId = staffIds[jobInfo.staffIdx];
      
      await client.query(`
        INSERT INTO public.jobs (id, project_id, customer_id, job_type_id, title, status, scheduled_start, scheduled_end, assigned_staff_id)
        VALUES ($1, $2, $3, $4, $5, 'Scheduled', NOW() + interval '1 day', NOW() + interval '1 day 4 hours', $6)
      `, [jobId, projectId, customerId, jobTypeId, jobInfo.title, assigneeId]);
      
      jobIds.push(jobId);
    }

    // 6. Give each job a task assigned to the crew member
    console.log("Adding tasks to the jobs...");
    const tasks = [
      { name: 'Wire outdoor condenser compressor', desc: 'Secure high-voltage line connections and verify refrigerant charge.', jobIdx: 0, staffIdx: 0, priority: 'High' },
      { name: 'Mount 3-phase circuit panels', desc: 'Position and secure backing board, route main feeder conduit cables.', jobIdx: 1, staffIdx: 2, priority: 'High' },
      { name: 'Run mechanical hydro-jet snaking', desc: 'Clear tree root infiltration in underground line segment B-4.', jobIdx: 2, staffIdx: 4, priority: 'Medium' },
      { name: 'Bolt racking bracket rails', desc: 'Attach roof attachment flashings and torque bolts to specs.', jobIdx: 3, staffIdx: 6, priority: 'Medium' },
      { name: 'Replace dry-rotted base plates', desc: 'Lift structural load safely and replace framing timber base.', jobIdx: 4, staffIdx: 8, priority: 'Low' }
    ];

    for (const t of tasks) {
      const jobId = jobIds[t.jobIdx];
      const assigneeId = staffIds[t.staffIdx];
      
      await client.query(`
        INSERT INTO public.tasks (id, job_id, name, description, priority, status, assignee_id, est_hours, approval_status)
        VALUES ($1, $2, $3, $4, $5, 'Pending', $6, 4.0, 'pending')
      `, [uuidv4(), jobId, t.name, t.desc, t.priority, assigneeId]);
    }

    // 7. Add Client Requests (service_requests)
    console.log("Creating 5 client requests...");
    const clientRequests = [
      { desc: 'HVAC unit blowing warm air on the 3rd floor west wing.', urgency: 'urgent' },
      { desc: 'Flickering lights and humming sound near primary switch panel.', urgency: 'normal' },
      { desc: 'Water leaking through ceiling drywall directly beneath bathroom line.', urgency: 'emergency' },
      { desc: 'Inquire quote for additional solar panel expansion.', urgency: 'low' },
      { desc: 'Inspect deck joints for splitting or signs of foundation sinking.', urgency: 'normal' }
    ];

    for (const req of clientRequests) {
      await client.query(`
        INSERT INTO public.service_requests (id, company_id, customer_id, description, urgency, status)
        VALUES ($1, $2, $3, $4, $5, 'new')
      `, [uuidv4(), companyId, customerId, req.desc, req.urgency]);
    }

    // 8. Add Reports (incident_reports)
    console.log("Creating reports...");
    const reports = [
      { type: 'Safety Hazard', severity: 'Medium', desc: 'Exposed wire found in building electrical closet. Secured area temporarily.' },
      { type: 'Equipment Breakage', severity: 'High', desc: 'Rotary drill motor burned out during frame boring. Replacement requested.' },
      { type: 'Toolbox Brief', severity: 'Low', desc: 'Daily safety meeting completed with crew: topic was roofing safety harness checks.' }
    ];

    for (const r of reports) {
      await client.query(`
        INSERT INTO public.incident_reports (id, project_id, reporter_id, type, severity, description, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'Open')
      `, [uuidv4(), projectId, staffIds[0], r.type, r.severity, r.desc]);
    }

    console.log("Detailed entities seeding successfully completed!");

  } catch (err) {
    console.error("Error during seeding:", err);
  } finally {
    await client.end();
  }
}

main();
