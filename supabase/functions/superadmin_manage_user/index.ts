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
    const { action, target_user_id, password } = await req.json();

    if (!action || !target_user_id) {
      return new Response(
        JSON.stringify({ error: "action and target_user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate the caller using their JWT
    const authHeader = req.headers.get("authorization") ?? "";
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { authorization: authHeader } } }
    );
    const { data: { user: callerUser }, error: userErr } = await callerClient.auth.getUser();

    if (userErr || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized caller" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the privileged service role client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the caller is a registered Platform Superadmin in public.platform_admins
    const { data: adminRow, error: adminErr } = await supabaseAdmin
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", callerUser.id)
      .maybeSingle();

    if (adminErr || !adminRow) {
      return new Response(
        JSON.stringify({ error: "Access Denied: Platform Administrator privileges required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update_password") {
      if (!password) {
        return new Response(
          JSON.stringify({ error: "password is required to update credentials" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
        target_user_id,
        { password }
      );

      if (updateErr) {
        return new Response(
          JSON.stringify({ error: updateErr.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "User password updated successfully." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete_user") {
      // Find staff profile first to wipe related database records
      const { data: profile } = await supabaseAdmin
        .from("staff_profiles")
        .select("id")
        .eq("auth_user_id", target_user_id)
        .maybeSingle();

      if (profile) {
        // Delete related child references
        await supabaseAdmin.from("geofence_events").delete().eq("staff_id", profile.id);
        await supabaseAdmin.from("staff_location_history").delete().eq("staff_id", profile.id);
        await supabaseAdmin.from("staff_locations").delete().eq("staff_id", profile.id);
        
        // Delete profile row
        const { error: profileDelErr } = await supabaseAdmin
          .from("staff_profiles")
          .delete()
          .eq("id", profile.id);

        if (profileDelErr) {
          return new Response(
            JSON.stringify({ error: profileDelErr.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Delete the auth user identity
      const { error: authDelErr } = await supabaseAdmin.auth.admin.deleteUser(target_user_id);
      
      if (authDelErr) {
        return new Response(
          JSON.stringify({ error: authDelErr.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "User account deleted successfully." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unsupported action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
