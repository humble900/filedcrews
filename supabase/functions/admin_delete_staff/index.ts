import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { staff_id } = await req.json();
    if (!staff_id) {
      return new Response(JSON.stringify({ error: "staff_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get staff profile to find auth_user_id
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("staff_profiles")
      .select("auth_user_id")
      .eq("id", staff_id)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: "Staff not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Delete related data (order matters for FK constraints)
    await supabaseAdmin.from("geofence_events").delete().eq("staff_id", staff_id);
    await supabaseAdmin.from("staff_location_history").delete().eq("staff_id", staff_id);
    await supabaseAdmin.from("staff_locations").delete().eq("staff_id", staff_id);

    // 3. Delete profile
    const { error: delErr } = await supabaseAdmin
      .from("staff_profiles")
      .delete()
      .eq("id", staff_id);

    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Delete auth user
    if (profile.auth_user_id) {
      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(
        profile.auth_user_id
      );
      if (authErr) {
        console.error("Failed to delete auth user:", authErr.message);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
