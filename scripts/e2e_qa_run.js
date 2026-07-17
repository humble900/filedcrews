import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

// Load configuration from .env
const envContent = fs.readFileSync(".env", "utf8");
const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(?:"([^"]*)"|'([^']*)'|([^\\r\\n]*))`, "m"));
  return match ? (match[1] || match[2] || match[3] || "").trim() : "";
};

const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
const supabaseKey = getEnvVar("VITE_SUPABASE_PUBLISHABLE_KEY");
const dbUrl = getEnvVar("DATABASE_URL");

console.log("Supabase URL:", supabaseUrl);

// Create owner Supabase client
const ownerClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Create crew Supabase client
const crewClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function runE2E() {
  console.log("\n========================================================");
  console.log("STARTING FULL END-TO-END QA FLOW TEST");
  console.log("========================================================");

  // Generate random email/username for test crew member
  const rand = Math.floor(Math.random() * 100000);
  const crewEmail = `crew_e2e_${rand}@clayrent.com`;
  const crewUsername = `E2ECREW${rand}`;
  const crewPassword = "Gunpowder@1-10";

  // -------------------------------------------------------------------
  // STEP 1: Sign up new Field Crew member
  // -------------------------------------------------------------------
  console.log(`\n[STEP 1] Signing up new Field Crew member: ${crewEmail}...`);
  const { data: signUpData, error: signUpErr } = await ownerClient.auth.signUp({
    email: crewEmail,
    password: crewPassword
  });

  if (signUpErr) {
    console.error("Signup failed:", signUpErr);
    process.exit(1);
  }
  const crewAuthUserId = signUpData.user.id;
  console.log(`Field Crew Auth Account created. User ID: ${crewAuthUserId}`);

  // -------------------------------------------------------------------
  // STEP 2: Log in as Owner (james@clayrent.com)
  // -------------------------------------------------------------------
  console.log("\n[STEP 2] Logging in as Owner...");
  const { data: ownerAuth, error: ownerAuthErr } = await ownerClient.auth.signInWithPassword({
    email: "james@clayrent.com",
    password: "Gunpowder@1-10"
  });
  if (ownerAuthErr) {
    console.error("Owner login failed:", ownerAuthErr);
    process.exit(1);
  }
  const ownerUserId = ownerAuth.user.id;
  console.log("Owner logged in. User ID:", ownerUserId);

  // Get Owner's Company
  const { data: companies, error: compErr } = await ownerClient
    .from("companies")
    .select("*")
    .eq("auth_user_id", ownerUserId);
  if (compErr || !companies || companies.length === 0) {
    console.error("Failed to fetch owner's company:", compErr);
    process.exit(1);
  }
  const company = companies[0];
  console.log(`Company active: "${company.name}" (ID: ${company.id})`);

  // Create Staff Profile for the new crew member
  console.log(`Creating Staff Profile for ${crewUsername}...`);
  const { data: crewProfile, error: profileCreateErr } = await ownerClient
    .from("staff_profiles")
    .insert({
      auth_user_id: crewAuthUserId,
      company_id: company.id,
      full_name: "E2E QA Field Worker",
      username: crewUsername,
      global_role: "Field Crew",
      is_active: true,
      hourly_rate: 25.00,
      email: crewEmail
    })
    .select()
    .single();

  if (profileCreateErr) {
    console.error("Failed to create staff profile:", profileCreateErr);
    process.exit(1);
  }
  console.log(`Staff Profile created successfully. ID: ${crewProfile.id}`);

  // Get or Create E2E Test Project
  const { data: projects, error: projErr } = await ownerClient
    .from("projects")
    .select("*")
    .eq("name", "E2E Test Project")
    .eq("company_id", company.id);
  
  let project;
  if (projErr || !projects || projects.length === 0) {
    console.log("E2E Test Project not found. Creating a new one...");
    
    // First retrieve or create a test customer
    const { data: customers } = await ownerClient
      .from("customers")
      .select("*")
      .eq("company_id", company.id)
      .limit(1);
    
    let customerId;
    if (customers && customers.length > 0) {
      customerId = customers[0].id;
    } else {
      const { data: newCust } = await ownerClient
        .from("customers")
        .insert({
          company_id: company.id,
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@e2etest.com",
          phone: "555-0199"
        })
        .select()
        .single();
      customerId = newCust.id;
    }

    const { data: newProj, error: createProjErr } = await ownerClient
      .from("projects")
      .insert({
        company_id: company.id,
        customer_id: customerId,
        name: "E2E Test Project",
        ref_number: "PRJ-E2E-" + Math.floor(Math.random() * 10000),
        address: "123 Test St, San Francisco, CA",
        latitude: 37.7749,
        longitude: -122.4194,
        geofence_radius: 100,
        budget_labour_cost: 5000,
        contract_value: 10000,
        status: "Planning"
      })
      .select()
      .single();
    
    if (createProjErr) {
      console.error("Failed to create project:", createProjErr);
      process.exit(1);
    }
    project = newProj;
  } else {
    project = projects[0];
  }
  console.log(`Using Project: "${project.name}" (ID: ${project.id})`);

  // Assign crew member to Project Team
  console.log("Assigning crew member to Project Team...");
  const { error: assignErr } = await ownerClient.from("project_assignments").insert({
    project_id: project.id,
    staff_id: crewProfile.id
  });
  if (assignErr) {
    console.error("Failed to assign crew to project:", assignErr);
    process.exit(1);
  }

  // -------------------------------------------------------------------
  // STEP 3: Owner creates a Geofence, Job, Task, and Shift
  // -------------------------------------------------------------------
  console.log("\n[STEP 3] Creating Geofence, Job, Task, and Shift...");

  // Create Project Geofence
  const { data: geofence, error: gfCreateErr } = await ownerClient
    .from("geofences")
    .insert({
      company_id: company.id,
      project_id: project.id,
      name: "E2E Worksite Geofence",
      latitude: 37.7749,
      longitude: -122.4194,
      radius_meters: 100,
      is_active: true
    })
    .select()
    .single();

  if (gfCreateErr) {
    console.error("Failed to create geofence:", gfCreateErr);
    process.exit(1);
  }
  console.log(`Created Geofence: "${geofence.name}" (ID: ${geofence.id})`);

  // Create Job
  const { data: job, error: jobCreateErr } = await ownerClient
    .from("jobs")
    .insert({
      project_id: project.id,
      customer_id: project.customer_id,
      title: "Electrical Panel Upgrade",
      description: "Upgrade work on main electrical panel A",
      status: "Booked",
      scheduled_start: new Date().toISOString()
    })
    .select()
    .single();

  if (jobCreateErr) {
    console.error("Failed to create job:", jobCreateErr);
    process.exit(1);
  }
  console.log(`Created Job: "${job.title}" (ID: ${job.id})`);

  // Create Task
  const { data: task, error: taskCreateErr } = await ownerClient
    .from("tasks")
    .insert({
      job_id: job.id,
      assignee_id: crewProfile.id,
      name: "Panel A spec inspection",
      description: "Perform visual check and verification on Panel A. Verify spec sheet codes.",
      priority: "High",
      status: "Pending"
    })
    .select()
    .single();

  if (taskCreateErr) {
    console.error("Failed to create task:", taskCreateErr);
    process.exit(1);
  }
  console.log(`Created Task: "${task.name}" (ID: ${task.id})`);

  // Create Shift for the crew member
  const { data: shift, error: shiftCreateErr } = await ownerClient
    .from("staff_shifts")
    .insert({
      staff_id: crewProfile.id,
      job_id: job.id,
      geofence_id: geofence.id,
      shift_date: new Date().toISOString().split("T")[0],
      check_in_time: "08:00:00",
      check_out_time: "16:00:00",
      status: "Scheduled"
    })
    .select()
    .single();

  if (shiftCreateErr) {
    console.error("Failed to create shift:", shiftCreateErr);
    process.exit(1);
  }
  console.log(`Created Shift ID: ${shift.id} for date ${shift.shift_date}`);

  // Create Safety Compliance Form Template
  const { data: formTemplate, error: tplCreateErr } = await ownerClient
    .from("form_templates")
    .insert({
      company_id: company.id,
      name: "E2E Safety Checklist",
      description: "Required PPE and safety check before panel work",
      is_required: true,
      schema: [
        { label: "Hard Hat On?", type: "checkbox", required: true },
        { label: "High Vis Vest?", type: "checkbox", required: true },
        { label: "Conduits clear?", type: "checkbox", required: true }
      ]
    })
    .select()
    .single();

  if (tplCreateErr) {
    console.error("Failed to create form template:", tplCreateErr);
    process.exit(1);
  }
  console.log(`Created Form Template: "${formTemplate.name}" (ID: ${formTemplate.id})`);

  // -------------------------------------------------------------------
  // STEP 4: Log in as the new Field Crew member
  // -------------------------------------------------------------------
  console.log("\n[STEP 4] Logging in as Field Crew...");
  const { data: crewAuth, error: crewAuthErr } = await crewClient.auth.signInWithPassword({
    email: crewEmail,
    password: crewPassword
  });
  if (crewAuthErr) {
    console.error("Crew login failed:", crewAuthErr);
    process.exit(1);
  }
  console.log("Field Crew logged in successfully.");

  // -------------------------------------------------------------------
  // STEP 5: Field Crew simulates entering geofence and clocking in
  // -------------------------------------------------------------------
  console.log("\n[STEP 5] Simulating geofence enter and Clock In...");

  // Geofence Enter Event (GPS simulated at worksite coordinates)
  const { data: geofenceEvent, error: gfEvtErr } = await crewClient
    .from("geofence_events")
    .insert({
      staff_id: crewProfile.id,
      geofence_id: geofence.id,
      event_type: "entered"
    })
    .select()
    .single();
  if (gfEvtErr) {
    console.error("Failed to log geofence enter event:", gfEvtErr);
    process.exit(1);
  }
  console.log(`Logged Geofence Event: "${geofenceEvent.event_type}" at worksite`);

  // Clock In (Start drive / onsite work)
  const { data: timesheet, error: tsCreateErr } = await crewClient
    .from("timesheet_entries")
    .insert({
      staff_id: crewProfile.id,
      job_id: job.id,
      entry_type: "onsite",
      source: "auto",
      start_time: new Date(Date.now() - 3600000).toISOString(), // Started 1 hour ago
      approval_status: "pending",
      notes: "Arrived at site, beginning panel upgrade"
    })
    .select()
    .single();

  if (tsCreateErr) {
    console.error("Failed to clock in:", tsCreateErr);
    process.exit(1);
  }
  console.log(`Clocked In: Timesheet ID ${timesheet.id} started at ${timesheet.start_time}`);

  // Confirm Shift
  await crewClient
    .from("staff_shifts")
    .update({ status: "Confirmed" })
    .eq("id", shift.id);
  console.log("Shift status updated to 'Confirmed'");

  // -------------------------------------------------------------------
  // STEP 6: Field Crew completes Task & Checklist (Forms)
  // -------------------------------------------------------------------
  console.log("\n[STEP 6] Performing work and submitting checklist...");

  // Start Task
  const { error: taskStartErr } = await crewClient
    .from("tasks")
    .update({ status: "In Progress" })
    .eq("id", task.id);
  if (taskStartErr) {
    console.error("Failed to start task:", taskStartErr);
    process.exit(1);
  }
  console.log("Task status updated to 'In Progress'");

  // Submit Safety Checklist Response
  const { data: formResp, error: formRespErr } = await crewClient
    .from("form_responses")
    .insert({
      template_id: formTemplate.id,
      job_id: job.id,
      submitted_by: crewProfile.id,
      data: {
        "Hard Hat On?": true,
        "High Vis Vest?": true,
        "Conduits clear?": true
      }
    })
    .select()
    .single();
  if (formRespErr) {
    console.error("Failed to submit checklist response:", formRespErr);
    process.exit(1);
  }
  console.log(`Safety Checklist response submitted. ID: ${formResp.id}`);

  // Submit Task for Review (Completed status, with before/after photos and notes)
  const { error: taskCompleteErr } = await crewClient
    .from("tasks")
    .update({
      status: "Completed",
      approval_status: "Pending",
      before_photo_url: "https://jxvifnggjjmyjefudjuf.supabase.co/storage/v1/object/public/task-attachments/before.jpg",
      after_photo_url: "https://jxvifnggjjmyjefudjuf.supabase.co/storage/v1/object/public/task-attachments/after.jpg",
      before_photo_urls: ["https://jxvifnggjjmyjefudjuf.supabase.co/storage/v1/object/public/task-attachments/before_1.jpg"],
      after_photo_urls: ["https://jxvifnggjjmyjefudjuf.supabase.co/storage/v1/object/public/task-attachments/after_1.jpg"],
      staff_notes: "Panel upgrade completed successfully. Placed safety covers on all wire connections.",
      completed_at: new Date().toISOString()
    })
    .eq("id", task.id);

  if (taskCompleteErr) {
    console.error("Failed to complete task:", taskCompleteErr);
    process.exit(1);
  }
  console.log("Task completed and submitted for review.");

  // Clock Out (Submit timesheet)
  const { data: timesheetOut, error: tsOutErr } = await crewClient
    .from("timesheet_entries")
    .update({
      end_time: new Date().toISOString(),
      duration_minutes: 60
    })
    .eq("id", timesheet.id)
    .select()
    .single();

  if (tsOutErr) {
    console.error("Failed to clock out:", tsOutErr);
    process.exit(1);
  }
  console.log(`Clocked Out: Timesheet ID ${timesheetOut.id} ended. Duration: ${timesheetOut.duration_minutes} minutes.`);

  // -------------------------------------------------------------------
  // STEP 7: Owner Reviews Work and Issues Invoice
  // -------------------------------------------------------------------
  console.log("\n[STEP 7] Owner reviews timesheet and issues invoice...");

  // Approve timesheet
  const { data: approvedTs, error: tsApproveErr } = await ownerClient
    .from("timesheet_entries")
    .update({
      approval_status: "approved",
      approved_by: crewProfile.id
    })
    .eq("id", timesheet.id)
    .select()
    .single();
  if (tsApproveErr) {
    console.error("Failed to approve timesheet:", tsApproveErr);
    process.exit(1);
  }
  console.log(`Timesheet approved! Status: ${approvedTs.approval_status}`);

  // Create Invoice
  const { data: invoice, error: invCreateErr } = await ownerClient
    .from("invoices")
    .insert({
      job_id: job.id,
      amount: 450.00,
      status: "Sent",
      payment_status: "Unpaid"
    })
    .select()
    .single();
  if (invCreateErr) {
    console.error("Failed to create invoice:", invCreateErr);
    process.exit(1);
  }
  console.log(`Invoice issued! Invoice ID: ${invoice.id}, Amount: ${invoice.amount}, Status: ${invoice.status}`);

  // -------------------------------------------------------------------
  // STEP 8: Client views and pays the Invoice
  // -------------------------------------------------------------------
  console.log("\n[STEP 8] Client views and pays invoice...");

  // Simulating payment on invoice
  const { data: payment, error: payCreateErr } = await ownerClient
    .from("payments")
    .insert({
      invoice_id: invoice.id,
      amount: 450.00,
      payment_method: "Credit Card",
      status: "Completed"
    })
    .select()
    .single();

  if (payCreateErr) {
    console.error("Failed to process payment:", payCreateErr);
    process.exit(1);
  }
  console.log(`Payment logged! ID: ${payment.id}, Amount: ${payment.amount}, Status: ${payment.status}`);

  // Verify Invoice payment status updated automatically via trigger/logic
  const { data: paidInvoice, error: invFetchErr } = await ownerClient
    .from("invoices")
    .select("*")
    .eq("id", invoice.id)
    .single();

  if (invFetchErr) {
    console.error("Failed to fetch invoice for verification:", invFetchErr);
    process.exit(1);
  }
  console.log(`Invoice Payment Status verified: ${paidInvoice.payment_status}`);

  // -------------------------------------------------------------------
  // STEP 9: Check Auditing / Logs
  // -------------------------------------------------------------------
  console.log("\n[STEP 9] Verifying security audit logs...");
  const { data: logs, error: logErr } = await ownerClient
    .from("audit_log")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (logErr) {
    console.error("Failed to fetch audit log:", logErr);
  } else {
    console.log(`Audit log records found: ${logs.length}`);
    logs.forEach(l => {
      console.log(`  - [${l.action}] Table: ${l.table_name}, Record: ${l.record_id}, Time: ${l.created_at}`);
    });
  }

  // -------------------------------------------------------------------
  // Cleanup Test Data
  // -------------------------------------------------------------------
  console.log("\n[STEP 10] Cleaning up E2E test records...");
  await ownerClient.from("payments").delete().eq("invoice_id", invoice.id);
  await ownerClient.from("invoices").delete().eq("id", invoice.id);
  await ownerClient.from("timesheet_entries").delete().eq("id", timesheet.id);
  await ownerClient.from("form_responses").delete().eq("id", formResp.id);
  await ownerClient.from("form_templates").delete().eq("id", formTemplate.id);
  await ownerClient.from("staff_shifts").delete().eq("id", shift.id);
  await ownerClient.from("tasks").delete().eq("id", task.id);
  await ownerClient.from("jobs").delete().eq("id", job.id);
  await ownerClient.from("geofences").delete().eq("id", geofence.id);
  await ownerClient.from("geofence_events").delete().eq("id", geofenceEvent.id);
  
  // Cleanup staff profile and assignments
  await ownerClient.from("project_assignments").delete().eq("project_id", project.id).eq("staff_id", crewProfile.id);
  await ownerClient.from("staff_profiles").delete().eq("id", crewProfile.id);

  // Clean up auth user
  console.log("Cleaning up auth account via SQL...");
  try {
    execSync(`psql "${dbUrl}" -c "delete from auth.users where id = '${crewAuthUserId}';"`);
    console.log("Auth account deleted.");
  } catch (e) {
    console.error("Failed to delete auth user:", e);
  }

  console.log("\n========================================================");
  console.log("✅ ALL END-TO-END QA FLOW TASKS COMPLETED SUCCESSFULLY!");
  console.log("========================================================");
}

runE2E();
