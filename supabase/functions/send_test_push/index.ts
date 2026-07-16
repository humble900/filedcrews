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

  const respond = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { staffId } = await req.json();
    if (!staffId) return respond({ ok: false, error: "staffId required" }, 400);

    const authHeader = req.headers.get("authorization") ?? "";
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { authorization: authHeader } } }
    );
    const { data: { user: callerUser } } = await callerClient.auth.getUser();
    if (!callerUser) return respond({ ok: false, error: "Unauthorized" }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: staff, error } = await supabaseAdmin
      .from("staff_profiles")
      .select("id, full_name, expo_push_token, company_id")
      .eq("id", staffId)
      .single();

    if (error || !staff) return respond({ ok: false, error: "Staff not found" }, 404);
    const { data: ownerCheck } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("id", staff.company_id)
      .eq("auth_user_id", callerUser.id)
      .maybeSingle();
    if (!ownerCheck) {
      const { data: adminCheck } = await supabaseAdmin
        .from("staff_profiles")
        .select("id")
        .eq("auth_user_id", callerUser.id)
        .eq("company_id", staff.company_id)
        .eq("global_role", "Admin")
        .maybeSingle();
      if (!adminCheck) return respond({ ok: false, error: "Forbidden" }, 403);
    }
    if (!staff.expo_push_token) return respond({ ok: false, error: "No push token registered for this staff" }, 400);

    const testEventId = `test-${Date.now()}`;
    const pushPayload = {
      to: staff.expo_push_token,
      title: "Face verification requested",
      body: "Take a selfie to verify while inside this site.",
      data: {
        type: "FACE_VERIFY_REQUEST",
        geofenceEventId: testEventId,
      },
      sound: "default",
    };

    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pushPayload),
    });

    const expoBody = await expoRes.json();
    console.log("[TEST_PUSH] Expo response:", JSON.stringify(expoBody));

    return respond({
      ok: true,
      staffName: staff.full_name,
      tokenUsed: staff.expo_push_token.substring(0, 25) + "...",
      testEventId,
      expoResponse: expoBody,
    });
  } catch (err) {
    return respond({ ok: false, error: err.message }, 500);
  }
});
