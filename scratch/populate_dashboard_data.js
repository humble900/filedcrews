const { Client } = require('c:/Users/USER/staff-coordinator/node_modules/pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

// Generate UUID helper
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate date offset helper
function getDateOffset(daysAgo, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database. Commencing dynamic analytics seeding...");

    const companyId = '530a86d6-1e2c-43d8-bbf8-ece534a247f8'; // ombodo
    const customerId = '3d4ce61b-538d-4877-a6e7-ad4626679285'; // timer stave
    const projectId = '838a5a2d-7a7d-4604-84e6-601f2ae91899'; // bodi tomos
    const geofenceId = '18a65135-5fbf-45b6-a60e-465d21fc6c6f'; // main gate
    const staffId = '424e4cf8-0978-47ea-92e8-c2ce8dfcaab0'; // aisha anderson
    const tech2Id = '98a02211-e0e2-4b65-a7fa-d1d32c16a8d5'; // mats gonj

    // 1. Ensure Job Types exist for the company
    let { rows: jobTypes } = await client.query(
      `SELECT id FROM public.job_types WHERE company_id = $1`, [companyId]
    );

    if (jobTypes.length === 0) {
      console.log("No job types found for this company. Seeding default job types...");
      const typesToSeed = [
        { name: 'Service Call', price: 150.00, duration: 60, color: 'blue', icon: 'wrench' },
        { name: 'Maintenance', price: 200.00, duration: 90, color: 'emerald', icon: 'shield' },
        { name: 'Installation', price: 600.00, duration: 240, color: 'violet', icon: 'package' }
      ];

      for (const t of typesToSeed) {
        const id = uuidv4();
        await client.query(`
          INSERT INTO public.job_types (id, company_id, name, default_price, default_duration_minutes, color, icon, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        `, [id, companyId, t.name, t.price, t.duration, t.color, t.icon]);
      }

      // Re-fetch job types
      const res = await client.query(`SELECT id FROM public.job_types WHERE company_id = $1`, [companyId]);
      jobTypes = res.rows;
      console.log(`Seeded ${jobTypes.length} job types.`);
    }

    const jobTypeId = jobTypes[0].id;

    // 2. Clean previous mock details to prevent piling up identical items
    console.log("Cleaning historical analytics mocks...");
    await client.query(`DELETE FROM public.action_items WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM public.incident_reports WHERE project_id = $1`, [projectId]);
    await client.query(`DELETE FROM public.geofence_events WHERE staff_id IN ($1, $2)`, [staffId, tech2Id]);
    await client.query(`DELETE FROM public.invoices WHERE job_id IN (SELECT id FROM public.jobs WHERE project_id = $1)`, [projectId]);
    await client.query(`DELETE FROM public.estimates WHERE company_id = $1`, [companyId]);
    await client.query(`DELETE FROM public.jobs WHERE project_id = $1`, [projectId]);
    await client.query(`DELETE FROM public.leads WHERE company_id = $1`, [companyId]);

    // 3. Seed Leads (12 leads over the last 7 days to form a nice chart trend)
    console.log("Seeding leads...");
    const leads = [
      { name: 'Alpha Builders', val: 4500.00, status: 'Won', days: 6, src: 'Website' },
      { name: 'Beta Logistics', val: 3200.00, status: 'Won', days: 5, src: 'Phone' },
      { name: 'Gamma Properties', val: 5500.00, status: 'Won', days: 4, src: 'Referral' },
      { name: 'Delta Resourcing', val: 1200.00, status: 'Lost', days: 6, src: 'Website' },
      { name: 'Epsilon Partners', val: 2800.00, status: 'Lost', days: 3, src: 'Phone' },
      { name: 'Zeta Consulting', val: 7500.00, status: 'Qualified', days: 3, src: 'Portal' },
      { name: 'Eta Commercial', val: 8200.00, status: 'Qualified', days: 2, src: 'Website' },
      { name: 'Theta Holdings', val: 1900.00, status: 'Contacted', days: 2, src: 'Phone' },
      { name: 'Iota Enterprises', val: 3400.00, status: 'Contacted', days: 1, src: 'Referral' },
      { name: 'Kappa Retailers', val: 6200.00, status: 'New', days: 1, src: 'Website' },
      { name: 'Lambda Industries', val: 4900.00, status: 'New', days: 0, src: 'Portal' },
      { name: 'Mu Development', val: 9500.00, status: 'New', days: 0, src: 'Website' }
    ];

    for (const l of leads) {
      const id = uuidv4();
      await client.query(`
        INSERT INTO public.leads (id, company_id, customer_name, estimated_value, status, source, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      `, [id, companyId, l.name, l.val, l.status, l.src, getDateOffset(l.days)]);
    }

    // 4. Seed Estimates (8 proposals)
    console.log("Seeding estimates...");
    const estimates = [
      { title: 'Electrical Installation and Wiring', amt: 8500.00, status: 'Approved', days: 6 },
      { title: 'HVAC Ductwork Replacement', amt: 4800.00, status: 'Approved', days: 5 },
      { title: 'Preventive Pipeline Cleaning', amt: 2900.00, status: 'Sent', days: 4 },
      { title: 'Emergency Sprinkler Repair', amt: 1500.00, status: 'Sent', days: 3 },
      { title: 'Commercial Landscape Design', amt: 12500.00, status: 'Viewed', days: 2 },
      { title: 'Access Control Integration', amt: 6200.00, status: 'Viewed', days: 1 },
      { title: 'Facility Inspection Audit', amt: 900.00, status: 'Draft', days: 1 },
      { title: 'Generac Backup Installation', amt: 9500.00, status: 'Declined', days: 3 }
    ];

    for (const e of estimates) {
      const id = uuidv4();
      await client.query(`
        INSERT INTO public.estimates (id, company_id, customer_id, title, status, total_amount, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      `, [id, companyId, customerId, e.title, e.status, e.amt, getDateOffset(e.days)]);
    }

    // 5. Seed Jobs
    console.log("Seeding jobs...");
    const jobs = [
      { title: 'Commercial AC Tune-up', status: 'Paid', days: 6 },
      { title: 'Office Light Installation', status: 'Paid', days: 5 },
      { title: 'Main Water Valve Repair', status: 'Completed', days: 4 },
      { title: 'Geofence System Calibration', status: 'Completed', days: 3 },
      { title: 'CCTV Camera Placement', status: 'In Progress', days: 2 },
      { title: 'Emergency Generator Check', status: 'In Progress', days: 1 },
      { title: 'Routine Fire Alarm Test', status: 'Scheduled', days: 1 },
      { title: 'Gutter Cleaning & Clearance', status: 'Scheduled', days: 0 },
      { title: 'Landscape Maintenance Run', status: 'Booked', days: 2 },
      { title: 'Water Pressure Diagnosis', status: 'Booked', days: 1 }
    ];

    const jobList = [];
    for (const j of jobs) {
      const id = uuidv4();
      await client.query(`
        INSERT INTO public.jobs (id, project_id, customer_id, job_type_id, title, status, scheduled_start, scheduled_end, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [id, projectId, customerId, jobTypeId, j.title, j.status, getDateOffset(j.days, 8), getDateOffset(j.days, 12), getDateOffset(j.days + 1)]);
      jobList.push({ id, ...j });
    }

    // 6. Seed Invoices (8 invoices linked to completed/paid jobs)
    console.log("Seeding invoices...");
    const invoices = [
      { jobIdx: 0, amt: 2400.00, status: 'Approved', payStatus: 'Paid', days: 6 },
      { jobIdx: 1, amt: 1800.00, status: 'Approved', payStatus: 'Paid', days: 5 },
      { jobIdx: 2, amt: 1500.00, status: 'Approved', payStatus: 'Unpaid', days: 4 },
      { jobIdx: 3, amt: 3200.00, status: 'Approved', payStatus: 'Partially Paid', days: 3 },
      { jobIdx: 4, amt: 4200.00, status: 'Sent', payStatus: 'Unpaid', days: 2 },
      { jobIdx: 5, amt: 900.00, status: 'Sent', payStatus: 'Unpaid', days: 1 },
      { jobIdx: 6, amt: 1200.00, status: 'Draft', payStatus: 'Unpaid', days: 1 }
    ];

    for (const inv of invoices) {
      const id = uuidv4();
      const job = jobList[inv.jobIdx];
      if (!job) continue;
      await client.query(`
        INSERT INTO public.invoices (id, job_id, amount, status, payment_status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [id, job.id, inv.amt, inv.status, inv.payStatus, getDateOffset(inv.days)]);
    }

    // 7. Seed Geofence Attendance events (representing crew crossings)
    console.log("Seeding geofence events (crossings)...");
    // Seed morning check-in (entered) and evening check-out (exited) for the last 5 days
    for (let day = 5; day >= 1; day--) {
      // Aisha check-in
      await client.query(`
        INSERT INTO public.geofence_events (id, staff_id, geofence_id, event_type, face_check_status, created_at)
        VALUES ($1, $2, $3, 'entered', 'passed', $4)
      `, [uuidv4(), staffId, geofenceId, getDateOffset(day, 8)]);

      // Aisha check-out
      await client.query(`
        INSERT INTO public.geofence_events (id, staff_id, geofence_id, event_type, face_check_status, created_at)
        VALUES ($1, $2, $3, 'exited', 'passed', $4)
      `, [uuidv4(), staffId, geofenceId, getDateOffset(day, 17)]);

      // Mats check-in
      await client.query(`
        INSERT INTO public.geofence_events (id, staff_id, geofence_id, event_type, face_check_status, created_at)
        VALUES ($1, $2, $3, 'entered', 'passed', $4)
      `, [uuidv4(), tech2Id, geofenceId, getDateOffset(day, 9)]);

      // Mats check-out
      await client.query(`
        INSERT INTO public.geofence_events (id, staff_id, geofence_id, event_type, face_check_status, created_at)
        VALUES ($1, $2, $3, 'exited', 'passed', $4)
      `, [uuidv4(), tech2Id, geofenceId, getDateOffset(day, 18)]);
    }

    // 8. Seed Incident Reports
    console.log("Seeding incident reports...");
    const incidents = [
      { type: 'Safety Hazard', severity: 'Medium', desc: 'Slippery corridor due to condensation leakage near warehouse portal.', status: 'Open', days: 4 },
      { type: 'Equipment Breakage', severity: 'High', desc: 'Core pressure calibration monitor displaying communication module error code 404.', status: 'Investigating', days: 2 },
      { type: 'Property Damage', severity: 'Low', desc: 'Minor scratch on the rear right side fender of company transport vehicle.', status: 'Resolved', days: 5 }
    ];

    for (const inc of incidents) {
      await client.query(`
        INSERT INTO public.incident_reports (id, project_id, reporter_id, type, severity, description, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [uuidv4(), projectId, staffId, inc.type, inc.severity, inc.desc, inc.status, getDateOffset(inc.days)]);
    }

    // 9. Seed Action Items (Action Inbox homepage tab)
    console.log("Seeding action items...");
    const actionItems = [
      { type: 'Invoice', entity: 'invoices', title: 'Overdue Invoice #INV-2026-004', desc: 'Payment of $4,200.00 from Alpha Builders is 14 days overdue.', sev: 'high' },
      { type: 'Job', entity: 'jobs', title: 'Unassigned Job Scheduled Tomorrow', desc: 'Emergency Sprinkler Calibration is scheduled for tomorrow but has no crew assigned.', sev: 'medium' },
      { type: 'Estimate', entity: 'estimates', title: 'Unsold Proposal Expiring Soon', desc: 'Estimate #EST-109 for $12,500.00 expires in 48 hours without approval.', sev: 'medium' },
      { type: 'Safety', entity: 'incident_reports', title: 'Critical Equipment Incident Logged', desc: 'High severity equipment malfunction reported on project site "bodi tomos".', sev: 'high' },
      { type: 'Attendance', entity: 'geofence_events', title: 'Selfie Match Verification Request', desc: 'Mats Gonj logged a check-in event with borderline face verification confidence.', sev: 'low' }
    ];

    for (const item of actionItems) {
      await client.query(`
        INSERT INTO public.action_items (id, company_id, type, entity_type, entity_id, title, description, severity, resolved, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9)
      `, [uuidv4(), companyId, item.type, item.entity, projectId, item.title, item.desc, item.sev, getDateOffset(1)]);
    }

    console.log("Seeding complete! Seeding actions added to the global overview successfully.");

  } catch (err) {
    console.error("Error during seeding:", err);
  } finally {
    await client.end();
  }
}

main();
