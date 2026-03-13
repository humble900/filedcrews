import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Haversine distance in meters */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Fire-and-forget Expo push. Never throws. */
async function sendExpoPush(
  token: string,
  title: string,
  body: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data,
        sound: "default",
      }),
    });
  } catch (e) {
    console.error("Expo push failed (non-blocking):", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    const { latitude, longitude, accuracy } = await req.json();

    if (latitude == null || longitude == null) {
      return new Response(
        JSON.stringify({ error: "latitude and longitude are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for DB operations since RLS is disabled
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find staff profile
    const { data: staff, error: staffError } = await supabaseAdmin
      .from("staff_profiles")
      .select("id, company_id, expo_push_token")
      .eq("auth_user_id", userId)
      .single();

    if (staffError || !staff) {
      return new Response(
        JSON.stringify({ error: "Staff profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert latest location
    await supabaseAdmin
      .from("staff_locations")
      .upsert({
        staff_id: staff.id,
        latitude,
        longitude,
        accuracy,
        updated_at: new Date().toISOString(),
      });

    // Insert history
    await supabaseAdmin
      .from("staff_location_history")
      .insert({
        staff_id: staff.id,
        latitude,
        longitude,
        accuracy,
      });

    // ── Geofence detection ──
    let geofenceQuery = supabaseAdmin
      .from("geofences")
      .select("id, latitude, longitude, radius_meters, ask_for_face_id")
      .eq("is_active", true);
    
    if (staff.company_id) {
      geofenceQuery = geofenceQuery.eq("company_id", staff.company_id);
    }
    
    const { data: geofences, error: gfError } = await geofenceQuery;
    console.log("Geofence query result:", JSON.stringify({ staffId: staff.id, companyId: staff.company_id, geofencesCount: geofences?.length, gfError }));

    if (geofences && geofences.length > 0) {
      for (const gf of geofences) {
        const dist = haversineMeters(latitude, longitude, gf.latitude, gf.longitude);
        const isInside = dist <= gf.radius_meters;
        console.log("Geofence check:", JSON.stringify({ gfId: gf.id, dist, radius: gf.radius_meters, isInside, staffLat: latitude, staffLng: longitude, gfLat: gf.latitude, gfLng: gf.longitude }));

        // Get last event for this staff+geofence
        const { data: lastEvent } = await supabaseAdmin
          .from("geofence_events")
          .select("event_type, created_at")
          .eq("geofence_id", gf.id)
          .eq("staff_id", staff.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let eventType: string | null = null;

        if (!lastEvent) {
          // First ever signal for this staff+geofence
          eventType = isInside ? "logged_in_inside" : "logged_in_outside";
        } else {
          const lastIsInside = ["inside", "entered", "logged_in", "logged_in_inside"].includes(lastEvent.event_type);
          const lastTime = new Date(lastEvent.created_at);
          const nowDate = new Date();
          
          // Check if last event was on a different day (UTC)
          const lastDay = lastTime.toISOString().slice(0, 10);
          const today = nowDate.toISOString().slice(0, 10);
          const isDifferentDay = lastDay !== today;

          if (isDifferentDay) {
            // New day → treat as new session regardless
            eventType = isInside ? "logged_in_inside" : "logged_in_outside";
          } else if (isInside && !lastIsInside) {
            eventType = "entered";
          } else if (!isInside && lastIsInside) {
            eventType = "exited";
          }
        }

        console.log("Event decision:", JSON.stringify({ gfId: gf.id, eventType, lastEvent }));

        if (eventType) {
          // Determine face_check_status for entry events
          const isEntryEvent = eventType === "entered" || eventType === "logged_in_inside";
          const shouldRequestFace = isEntryEvent && gf.ask_for_face_id === true;

          const { data: insertedEvent, error: insertError } = await supabaseAdmin
            .from("geofence_events")
            .insert({
              geofence_id: gf.id,
              staff_id: staff.id,
              event_type: eventType,
              face_check_status: shouldRequestFace ? "requested" : "not_requested",
            })
            .select("id")
            .single();
          console.log("Event insert result:", JSON.stringify({ insertedEvent, insertError }));

          // Send push notification for face verification (fire-and-forget)
          if (shouldRequestFace && staff.expo_push_token && insertedEvent) {
            sendExpoPush(
              staff.expo_push_token,
              "Face verification requested",
              "Please take a selfie to verify while inside this site.",
              {
                type: "FACE_VERIFY_REQUEST",
                geofenceEventId: insertedEvent.id,
                staffId: staff.id,
              }
            );
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
