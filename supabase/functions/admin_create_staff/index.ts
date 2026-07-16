import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      username: rawUsername,
      password,
      full_name,
      first_name,
      last_name,
      email: staffEmail,
      phone,
      address,
      job_title,
      company_id,
      global_role: rawRole,
    } = await req.json();
    const username = rawUsername?.toUpperCase();
    const VALID_ROLES = ["Admin", "Finance", "Dispatcher", "Field Crew"];
    // Default to Field Crew if not provided or invalid
    const global_role = VALID_ROLES.includes(rawRole) ? rawRole : "Field Crew";

    // Build full_name from first/last if not explicitly provided
    const computedFullName = full_name || [first_name, last_name].filter(Boolean).join(" ") || "";

    if (!username || !password || !computedFullName || !company_id) {
      return new Response(
        JSON.stringify({ error: "username, password, name, and company_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the company to validate the prefix
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("prefix")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enforce username starts with the company's prefix
    if (!username.startsWith(company.prefix)) {
      return new Response(
        JSON.stringify({ error: `Username must start with your company prefix: ${company.prefix}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Authorization check ────────────────────────────────────────────────
    // Only the company owner OR a staff member with can_manage_roles=true
    // may create staff with elevated roles (non-Field Crew).
    // We verify the JWT caller identity against the company record.
    // Every account creation is privileged. Do not trust a caller-supplied
    // company_id: authenticate and authorize the caller for every role.
    {
      const authHeader = req.headers.get("authorization") ?? "";
      const callerClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { authorization: authHeader } } }
      );
      const { data: { user: callerUser } } = await callerClient.auth.getUser();
      if (!callerUser) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Check if caller is the company owner
      const { data: ownerCheck } = await supabaseAdmin
        .from("companies")
        .select("id")
        .eq("id", company_id)
        .eq("auth_user_id", callerUser.id)
        .maybeSingle();
      if (!ownerCheck) {
        // Company admins and delegated role managers may create staff.
        const { data: delegateCheck } = await supabaseAdmin
          .from("staff_profiles")
          .select("id")
          .eq("auth_user_id", callerUser.id)
          .eq("company_id", company_id)
          .or("global_role.eq.Admin,can_manage_roles.eq.true")
          .maybeSingle();
        if (!delegateCheck) {
          return new Response(
            JSON.stringify({ error: "Only a company owner, admin, or delegated role manager can create staff" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const authEmail = `${username}@internal.local`;

    // Create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: authEmail,
        password,
        email_confirm: true,
      });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert staff profile with all fields
    const profilePayload: Record<string, unknown> = {
      username,
      full_name: computedFullName,
      auth_user_id: authData.user.id,
      company_id,
      global_role,
    };
    // Optional fields
    if (first_name) profilePayload.first_name = first_name;
    if (last_name) profilePayload.last_name = last_name;
    if (staffEmail) profilePayload.email = staffEmail;
    if (phone) profilePayload.phone = phone;
    if (address) profilePayload.address = address;
    if (job_title) profilePayload.job_title = job_title;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("staff_profiles")
      .insert(profilePayload)
      .select("id, username, full_name, global_role, job_title")
      .single();

    if (profileError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        staff_id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        global_role: profile.global_role,
        job_title: profile.job_title,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
