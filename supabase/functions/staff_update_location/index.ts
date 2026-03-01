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
      .select("id")
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
    const { data: geofences } = await supabaseAdmin
      .from("geofences")
      .select("id, latitude, longitude, radius_meters")
      .eq("is_active", true);

    if (geofences && geofences.length > 0) {
      for (const gf of geofences) {
        const dist = haversineMeters(latitude, longitude, gf.latitude, gf.longitude);
        const isInside = dist <= gf.radius_meters;

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
          const lastTime = new Date(lastEvent.created_at).getTime();
          const now = Date.now();
          const gapMs = now - lastTime;
          const ONE_HOUR = 60 * 60 * 1000;

          if (gapMs > ONE_HOUR) {
            // Gap > 1 hour → treat as new session
            eventType = isInside ? "logged_in_inside" : "logged_in_outside";
          } else if (isInside && !lastIsInside) {
            eventType = "entered";
          } else if (!isInside && lastIsInside) {
            eventType = "exited";
          }
        }

        if (eventType) {
          await supabaseAdmin
            .from("geofence_events")
            .insert({
              geofence_id: gf.id,
              staff_id: staff.id,
              event_type: eventType,
            });
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
