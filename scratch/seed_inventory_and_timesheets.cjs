const { Client } = require('pg');

const databaseUrl = "postgresql://postgres.jxvifnggjjmyjefudjuf:hcKjtGwB1MnDyG2k@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate date offset helpers
function getDateOffset(daysAgo, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database. Seeding timesheets, inventory, and office assignments...");

    const companyId = '530a86d6-1e2c-43d8-bbf8-ece534a247f8'; // ombodo
    const project1Id = '838a5a2d-7a7d-4604-84e6-601f2ae91899'; // bodi tomos
    const project2Id = 'df36385d-e82e-41da-9bf0-1442d2313f17'; // ginter united

    // 1. Resolve staff IDs
    const { rows: staff } = await client.query(
      `SELECT id, username FROM public.staff_profiles WHERE company_id = $1`, [companyId]
    );

    const staffMap = {};
    staff.forEach(s => { staffMap[s.username] = s.id; });

    // Clean up previous runs to allow clean repeats
    const officeUsernames = ['karen_vance', 'liam_sterling', 'diana_rossi'];
    console.log("Cleaning up previous timesheets, inventory, and office staff...");
    
    await client.query(`
      DELETE FROM public.project_assignments 
      WHERE staff_id IN (SELECT id FROM public.staff_profiles WHERE username = ANY($1))
    `, [officeUsernames]);

    await client.query(`
      DELETE FROM public.staff_profiles 
      WHERE username = ANY($1) AND company_id = $2
    `, [officeUsernames, companyId]);

    await client.query(`
      DELETE FROM public.inventory_items 
      WHERE company_id = $1
    `, [companyId]);

    await client.query(`
      DELETE FROM public.timesheet_entries 
      WHERE staff_id IN (SELECT id FROM public.staff_profiles WHERE company_id = $1)
    `, [companyId]);

    // 2. Create 3 Office Staff Profiles
    console.log("Creating 3 Office Staff profiles...");
    const officeStaff = [
      { user: 'karen_vance', first: 'Karen', last: 'Vance', title: 'Finance Administrator', role: 'Finance' },
      { user: 'liam_sterling', first: 'Liam', last: 'Sterling', title: 'Lead Dispatcher', role: 'Dispatcher' },
      { user: 'diana_rossi', first: 'Diana', last: 'Rossi', title: 'Operations Director', role: 'Admin' }
    ];

    const officeIds = {};
    for (const o of officeStaff) {
      const id = uuidv4();
      const fullName = `${o.first} ${o.last}`;
      await client.query(`
        INSERT INTO public.staff_profiles (id, username, full_name, first_name, last_name, job_title, company_id, is_active, global_role, can_manage_roles)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, true)
      `, [id, o.user, fullName, o.first, o.last, o.title, companyId, o.role]);
      officeIds[o.user] = id;
    }

    // 3. Assign Office Staff to Projects
    console.log("Assigning office staff to projects...");
    await client.query(`
      INSERT INTO public.project_assignments (id, project_id, staff_id, role, assigned_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [uuidv4(), project1Id, officeIds['diana_rossi'], 'Operations Manager']);

    await client.query(`
      INSERT INTO public.project_assignments (id, project_id, staff_id, role, assigned_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [uuidv4(), project2Id, officeIds['liam_sterling'], 'Lead Dispatcher']);

    await client.query(`
      INSERT INTO public.project_assignments (id, project_id, staff_id, role, assigned_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [uuidv4(), project1Id, officeIds['karen_vance'], 'Finance & Cost Controller']);

    // 4. Seed Inventory Items
    console.log("Seeding inventory items...");
    const inventory = [
      { part: 'COP-100', name: 'Copper Pipe 1/2 in (50ft Reel)', desc: 'High-grade copper piping for refrigeration and AC installs', cost: 85.00, stock: 24, min: 10 },
      { part: 'MOT-200', name: 'Carrier Outdoor Condenser Fan Motor', desc: 'OEM replacement motor for Carrier AC condenser models', cost: 185.00, stock: 12, min: 5 },
      { part: 'WIR-300', name: '12/2 Romex Wire Reel (250ft)', desc: 'Copper electrical wire with grounding conductor', cost: 115.00, stock: 18, min: 8 },
      { part: 'PAN-400', name: 'Square D 200A Main Breaker Panel', desc: 'Outdoor rated electrical distribution panel board', cost: 245.00, stock: 6, min: 3 },
      { part: 'BRK-500', name: 'Solar Mounting Bracket Clamps (Box of 50)', desc: 'End and mid-clamps for securing PV panels to roof rails', cost: 45.00, stock: 45, min: 15 }
    ];

    for (const inv of inventory) {
      await client.query(`
        INSERT INTO public.inventory_items (id, company_id, part_number, name, description, unit_cost, current_stock, minimum_stock)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [uuidv4(), companyId, inv.part, inv.name, inv.desc, inv.cost, inv.stock, inv.min]);
    }

    // 5. Seed Timesheet Entries for Technicians (Aisha, Carlos, David, Sarah, Marcus)
    console.log("Seeding daily timesheet entries...");
    const techUsernames = ['aisha_anderson', 'carlos_ramirez', 'sarah_jenkins', 'david_lee', 'marcus_vance'];
    
    // Resolve technician IDs
    const techIds = [];
    for (const user of techUsernames) {
      // Find staff ID (some might have user name, or check full list)
      const id = staffMap[user] || staffMap[user.replace('_', ' ')];
      if (id) {
        techIds.push(id);
      }
    }

    // Fallback: use all staff IDs with Field Crew role if not found
    if (techIds.length === 0) {
      const { rows: techRows } = await client.query(
        `SELECT id FROM public.staff_profiles WHERE company_id = $1 AND global_role = 'Field Crew'`, [companyId]
      );
      techRows.forEach(r => techIds.push(r.id));
    }

    console.log(`Resolved ${techIds.length} technician IDs for timesheet seeding.`);

    // Seed 5 days of regular work and travel timesheets
    for (const staffId of techIds) {
      for (let day = 5; day >= 1; day--) {
        // onsite entry
        await client.query(`
          INSERT INTO public.timesheet_entries (id, staff_id, entry_type, source, start_time, end_time, duration_minutes, approval_status, notes)
          VALUES ($1, $2, 'onsite', 'auto', $3, $4, 480, 'approved', 'Standard shift onsite maintenance and repair work.')
        `, [uuidv4(), staffId, getDateOffset(day, 8, 0), getDateOffset(day, 16, 0)]);

        // drive entry
        await client.query(`
          INSERT INTO public.timesheet_entries (id, staff_id, entry_type, source, start_time, end_time, duration_minutes, approval_status, notes)
          VALUES ($1, $2, 'drive', 'auto', $3, $4, 90, 'approved', 'Driving to warehouse for parts pickup.')
        `, [uuidv4(), staffId, getDateOffset(day, 16, 0), getDateOffset(day, 17, 30)]);
      }
    }

    console.log("Detailed timesheets, inventory, and office assignments seeded successfully!");

  } catch (err) {
    console.error("Error during seeding:", err);
  } finally {
    await client.end();
  }
}

main();
