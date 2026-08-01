import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  jsonResponse,
  authenticateCaller,
} from "../_shared/framework.ts";

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, target_user_id, password } = await req.json();

    if (!action || !target_user_id) {
      return jsonResponse(
        { error: "action and target_user_id are required" },
        400,
        requestId
      );
    }

    // Authenticate caller JWT
    const { user: callerUser, error: authError } = await authenticateCaller(req);
    if (authError || !callerUser) {
      return jsonResponse(
        { error: authError || "Unauthorized caller" },
        401,
        requestId
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is listed in platform_admins
    const { data: adminRow, error: adminErr } = await supabaseAdmin
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", callerUser.id)
      .maybeSingle();

    if (adminErr || !adminRow) {
      console.warn(
        `[${requestId}] Unauthorized superadmin management attempt by user: ${callerUser.id}`
      );
      return jsonResponse(
        { error: "Access Denied: Platform Administrator privileges required" },
        403,
        requestId
      );
    }

    if (action === "update_password") {
      if (!password) {
        return jsonResponse(
          { error: "password is required to update credentials" },
          400,
          requestId
        );
      }

      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
        target_user_id,
        { password }
      );

      if (updateErr) {
        return jsonResponse({ error: updateErr.message }, 400, requestId);
      }

      console.log(
        `[${requestId}] Password updated for target user: ${target_user_id} by superadmin: ${callerUser.id}`
      );

      return jsonResponse(
        { success: true, message: "User password updated successfully." },
        200,
        requestId
      );
    }

    if (action === "delete_user") {
      const { data: profile } = await supabaseAdmin
        .from("staff_profiles")
        .select("id")
        .eq("auth_user_id", target_user_id)
        .maybeSingle();

      if (profile) {
        await supabaseAdmin.from("geofence_events").delete().eq("staff_id", profile.id);
        await supabaseAdmin.from("staff_location_history").delete().eq("staff_id", profile.id);
        await supabaseAdmin.from("staff_locations").delete().eq("staff_id", profile.id);

        const { error: profileDelErr } = await supabaseAdmin
          .from("staff_profiles")
          .delete()
          .eq("id", profile.id);

        if (profileDelErr) {
          return jsonResponse({ error: profileDelErr.message }, 500, requestId);
        }
      }

      const { error: authDelErr } = await supabaseAdmin.auth.admin.deleteUser(target_user_id);

      if (authDelErr) {
        return jsonResponse({ error: authDelErr.message }, 400, requestId);
      }

      console.log(
        `[${requestId}] User deleted: ${target_user_id} by superadmin: ${callerUser.id}`
      );

      return jsonResponse(
        { success: true, message: "User account deleted successfully." },
        200,
        requestId
      );
    }

    return jsonResponse(
      { error: `Unsupported action: ${action}` },
      400,
      requestId
    );
  } catch (err: any) {
    console.error(`[${requestId}] Superadmin manage user error:`, err);
    return jsonResponse(
      { error: err.message || "An unexpected error occurred." },
      500,
      requestId
    );
  }
});
