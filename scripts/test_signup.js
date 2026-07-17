import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

const envContent = fs.readFileSync(".env", "utf8");
const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(?:"([^"]*)"|'([^']*)'|([^\\r\\n]*))`, "m"));
  return match ? (match[1] || match[2] || match[3] || "").trim() : "";
};

const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
const supabaseKey = getEnvVar("VITE_SUPABASE_PUBLISHABLE_KEY");
const dbUrl = getEnvVar("DATABASE_URL");

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function run() {
  const email = "crew_test_new@clayrent.com";
  const password = "Gunpowder@1-10";

  console.log(`Signing up ${email}...`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    console.log("Signup returned error (might already exist):", error.message);
  } else {
    console.log("Signup response user ID:", data.user?.id);
  }

  // Force confirm via raw SQL
  console.log("Confirming user via SQL...");
  const sql = `update auth.users set confirmed_at = now(), email_confirmed_at = now() where email = '${email}';`;
  try {
    const output = execSync(`psql "${dbUrl}" -c "${sql}"`);
    console.log("SQL Output:", output.toString().trim());
  } catch (e) {
    console.error("SQL Error:", e);
  }

  // Verify we can login
  console.log("Testing login...");
  const { data: logData, error: logErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (logErr) {
    console.error("Login failed:", logErr);
  } else {
    console.log("Login successful! User ID:", logData.user.id);
  }
}

run();
