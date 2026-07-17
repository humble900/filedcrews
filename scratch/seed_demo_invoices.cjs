const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

// Generate UUID helper
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
    console.log("Connected to database. Commencing demo invoice and job-photo seeding...");

    const companyId = '530a86d6-1e2c-43d8-bbf8-ece534a247f8'; // ombodo
    const customerId = '3d4ce61b-538d-4877-a6e7-ad4626679285'; // timer stave
    const projectId = '838a5a2d-7a7d-4604-84e6-601f2ae91899'; // bodi tomos

    // 1. Fetch default job type to associate with jobs
    const { rows: jobTypes } = await client.query(
      `SELECT id FROM public.job_types WHERE company_id = $1 LIMIT 1`, [companyId]
    );
    const jobTypeId = jobTypes.length > 0 ? jobTypes[0].id : null;

    // 2. Resolve staff IDs of newly created technicians
    const { rows: staff } = await client.query(
      `SELECT id, username FROM public.staff_profiles WHERE company_id = $1 AND username IN ('carlos_ramirez', 'sarah_jenkins', 'david_lee', 'elena_rostova', 'marcus_vance', 'chloe_dupont', 'james_carter', 'linda_ng', 'robert_taylor', 'patricia_kelly')`,
      [companyId]
    );

    const staffMap = {};
    staff.forEach(s => { staffMap[s.username] = s.id; });

    // Ensure we have resolved staff
    if (!staffMap['carlos_ramirez']) {
      console.error("New staff members not found in database. Run populate_crews_and_tasks.cjs first.");
      process.exit(1);
    }

    // 3. Delete previous jobs/tasks/invoices created in populate_crews_and_tasks to overwrite them
    console.log("Cleaning up old crew jobs to overwrite with rich invoice/photo detail...");
    const jobTitles = [
      'HVAC Air Compressor Retrofit', 'Industrial Fuse Board Renewal', 'Sewer Line Pipeline Clearout',
      'Residential Solar Rack Framing', 'Warehouse Support Joist Repair'
    ];

    await client.query(`
      DELETE FROM public.invoices 
      WHERE job_id IN (SELECT id FROM public.jobs WHERE title = ANY($1) AND project_id = $2)
    `, [jobTitles, projectId]);

    await client.query(`
      DELETE FROM public.tasks 
      WHERE job_id IN (SELECT id FROM public.jobs WHERE title = ANY($1) AND project_id = $2)
    `, [jobTitles, projectId]);

    await client.query(`
      DELETE FROM public.jobs 
      WHERE title = ANY($1) AND project_id = $2
    `, [jobTitles, projectId]);

    // 4. Create 5 Jobs representing work done by staff, with high quality before/after photos
    const demoJobs = [
      {
        title: 'HVAC Air Compressor Retrofit',
        status: 'Completed',
        staffUser: 'carlos_ramirez',
        taskName: 'Wire outdoor condenser compressor',
        taskDesc: 'Secure high-voltage line connections and verify refrigerant charge.',
        priority: 'High',
        before: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
        after: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=600&q=80',
        invoiceAmt: 2450.00,
        invoiceStatus: 'Approved',
        paymentStatus: 'Paid'
      },
      {
        title: 'Industrial Fuse Board Renewal',
        status: 'Completed',
        staffUser: 'david_lee',
        taskName: 'Mount 3-phase circuit panels',
        taskDesc: 'Position and secure backing board, route main feeder conduit cables.',
        priority: 'High',
        before: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=600&q=80',
        after: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=600&q=80',
        invoiceAmt: 3800.00,
        invoiceStatus: 'Approved',
        paymentStatus: 'Partially Paid'
      },
      {
        title: 'Sewer Line Pipeline Clearout',
        status: 'Completed',
        staffUser: 'marcus_vance',
        taskName: 'Run mechanical hydro-jet snaking',
        taskDesc: 'Clear tree root infiltration in underground line segment B-4.',
        priority: 'Medium',
        before: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80',
        after: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
        invoiceAmt: 1500.00,
        invoiceStatus: 'Sent', // This is "Pending" (Unpaid client invoice)
        paymentStatus: 'Unpaid'
      },
      {
        title: 'Residential Solar Rack Framing',
        status: 'Completed',
        staffUser: 'james_carter',
        taskName: 'Bolt racking bracket rails',
        taskDesc: 'Attach roof attachment flashings and torque bolts to specs.',
        priority: 'Medium',
        before: 'https://images.unsplash.com/photo-1635424710928-0544e8512eae?auto=format&fit=crop&w=600&q=80',
        after: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=600&q=80',
        invoiceAmt: 4900.00,
        invoiceStatus: 'Draft',
        paymentStatus: 'Unpaid'
      },
      {
        title: 'Warehouse Support Joist Repair',
        status: 'Completed',
        staffUser: 'robert_taylor',
        taskName: 'Replace dry-rotted base plates',
        taskDesc: 'Lift structural load safely and replace framing timber base.',
        priority: 'Low',
        before: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
        after: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80',
        invoiceAmt: 5500.00,
        invoiceStatus: 'Approved',
        paymentStatus: 'Overdue'
      }
    ];

    for (const d of demoJobs) {
      const jobId = uuidv4();
      const staffId = staffMap[d.staffUser];

      console.log(`Seeding job: "${d.title}"...`);
      // 1. Insert completed Job
      await client.query(`
        INSERT INTO public.jobs (id, project_id, customer_id, job_type_id, title, status, scheduled_start, scheduled_end, assigned_staff_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW() - interval '2 days', NOW() - interval '2 days 4 hours', $7, NOW() - interval '3 days')
      `, [jobId, projectId, customerId, jobTypeId, d.title, d.status, staffId]);

      // 2. Insert Task with before/after photos
      console.log(`  - Adding task with before/after photos...`);
      await client.query(`
        INSERT INTO public.tasks (id, job_id, name, description, priority, status, assignee_id, est_hours, before_photo_url, after_photo_url, before_photo_urls, after_photo_urls, approval_status, completed_at, approved_at)
        VALUES ($1, $2, $3, $4, $5, 'Completed', $6, 4.0, $7, $8, ARRAY[$7], ARRAY[$8], 'approved', NOW() - interval '2 days', NOW() - interval '2 days')
      `, [uuidv4(), jobId, d.taskName, d.taskDesc, d.priority, staffId, d.before, d.after]);

      // 3. Insert Invoice
      console.log(`  - Seeding invoice [Status: ${d.invoiceStatus}, Payment Status: ${d.paymentStatus}] for $${d.invoiceAmt}...`);
      await client.query(`
        INSERT INTO public.invoices (id, job_id, amount, status, payment_status, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW() - interval '1 day')
      `, [uuidv4(), jobId, d.invoiceAmt, d.invoiceStatus, d.paymentStatus]);
    }

    console.log("Demo invoices and tasks photos successfully seeded!");

  } catch (err) {
    console.error("Error during seeding:", err);
  } finally {
    await client.end();
  }
}

main();
