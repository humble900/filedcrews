import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// Simple env file parser
const envContent = fs.readFileSync(".env", "utf8");
const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(?:"([^"]*)"|'([^']*)'|([^\\r\\n]*))`, "m"));
  return match ? (match[1] || match[2] || match[3] || "").trim() : "";
};

const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
const supabaseKey = getEnvVar("VITE_SUPABASE_PUBLISHABLE_KEY");

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function run() {
  console.log("Logging in as james@clayrent.com...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: "james@clayrent.com",
    password: "Gunpowder@1-10"
  });

  if (authErr) {
    console.error("Auth failed:", authErr);
    process.exit(1);
  }
  
  console.log("Logged in successfully. User ID:", authData.user.id);

  console.log("\n--- FETCHING COMPANIES OWNED BY USER ---");
  const { data: companies, error: compErr } = await supabase
    .from("companies")
    .select("*");
  if (compErr) console.error(compErr);
  else console.log("Companies:", companies);

  console.log("\n--- FETCHING STAFF PROFILES ---");
  const { data: staff, error: stErr } = await supabase
    .from("staff_profiles")
    .select("*");
  if (stErr) console.error(stErr);
  else console.log("Staff profiles count:", staff?.length, staff);

  console.log("\n--- FETCHING PROJECTS ---");
  const { data: projects, error: projErr } = await supabase
    .from("projects")
    .select("*");
  if (projErr) console.error(projErr);
  else console.log("Projects count:", projects?.length, projects);
}

run();
