import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function isValidExpoPushToken(token: string): boolean {
  // Expo push tokens look like ExponentPushToken[...] or ExpoPushToken[...]
  return /^Expo(nent)?PushToken\[.+\]$/.test(token);
}

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
    console.log("[PUSH_REG] Request received");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn("[PUSH_REG] Missing or invalid Authorization header");
      return respond({ ok: false, error: "Unauthorized", reason: "missing_auth_header" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.warn("[PUSH_REG] JWT claims extraction failed:", claimsError?.message);
      return respond({ ok: false, error: "Unauthorized", reason: "invalid_jwt" }, 401);
    }

    const userId = claimsData.claims.sub;
    console.log(`[PUSH_REG] Authenticated user: ${userId}`);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      console.warn("[PUSH_REG] Failed to parse request body");
      return respond({ ok: false, error: "Invalid JSON body", reason: "bad_body" }, 400);
    }

    const { expoPushToken } = body as { expoPushToken?: string };

    if (!expoPushToken || typeof expoPushToken !== "string") {
      console.warn("[PUSH_REG] Missing or invalid expoPushToken in body");
      return respond({ ok: false, error: "expoPushToken is required", reason: "missing_token" }, 400);
    }

    if (!isValidExpoPushToken(expoPushToken)) {
      console.warn(`[PUSH_REG] Token format invalid: ${expoPushToken}`);
      return respond({
        ok: false,
        error: "Invalid Expo push token format",
        reason: "invalid_token_format",
        receivedToken: expoPushToken,
      }, 400);
    }

    console.log(`[PUSH_REG] Token format valid: ${expoPushToken}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if a matching staff_profiles row exists
    const { data: staffRow, error: selectError } = await supabaseAdmin
      .from("staff_profiles")
      .select("id, full_name, expo_push_token")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (selectError) {
      console.error(`[PUSH_REG] DB select error: ${selectError.message}`);
      return respond({ ok: false, error: selectError.message, reason: "db_select_error" }, 500);
    }

    if (!staffRow) {
      console.warn(`[PUSH_REG] No staff_profiles row for auth_user_id=${userId}`);
      return respond({
        ok: false,
        error: "No staff profile found for this user",
        reason: "no_staff_profile",
        authUserId: userId,
      }, 404);
    }

    console.log(`[PUSH_REG] Found staff profile: id=${staffRow.id}, name=${staffRow.full_name}, existing_token=${staffRow.expo_push_token ? "present" : "null"}`);

    // Update the token
    const { error: updateError } = await supabaseAdmin
      .from("staff_profiles")
      .update({ expo_push_token: expoPushToken })
      .eq("id", staffRow.id);

    if (updateError) {
      console.error(`[PUSH_REG] DB update error: ${updateError.message}`);
      return respond({ ok: false, error: updateError.message, reason: "db_update_error" }, 500);
    }

    console.log(`[PUSH_REG] Token stored successfully for staff ${staffRow.id}`);

    return respond({
      ok: true,
      staffProfileId: staffRow.id,
      staffName: staffRow.full_name,
      expoPushTokenStored: true,
    });
  } catch (err) {
    console.error(`[PUSH_REG] Unexpected error: ${err.message}`);
    return respond({ ok: false, error: err.message, reason: "unexpected_error" }, 500);
  }
});
