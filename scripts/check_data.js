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

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key:", supabaseKey ? "[FOUND]" : "[MISSING]");

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log("--- FETCHING GEOFENCES ---");
  const { data: geofences, error: gfErr } = await supabase
    .from("geofences")
    .select("id, name, latitude, longitude, radius_meters, is_active, company_id");
    
  if (gfErr) {
    console.error("Geofence fetch error:", gfErr);
  } else {
    console.log("Geofences in database:", JSON.stringify(geofences, null, 2));
  }

  console.log("\n--- FETCHING STAFF PROFILES ---");
  const { data: staff, error: stErr } = await supabase
    .from("staff_profiles")
    .select("id, username, full_name, photo_url, company_id");
    
  if (stErr) {
    console.error("Staff profiles fetch error:", stErr);
  } else {
    console.log("Staff profiles in database:", JSON.stringify(staff, null, 2));
  }
}

checkData();
