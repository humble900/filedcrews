import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as decodeBase64 } from "https://deno.land/std@0.203.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // --- Input ---
    const { geofenceEventId, comparisonPhoto } = await req.json();
    if (!geofenceEventId || !comparisonPhoto) {
      return json({ error: "geofenceEventId and comparisonPhoto are required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // --- Look up staff profile ---
    const { data: staff, error: staffErr } = await admin
      .from("staff_profiles")
      .select("id, photo_url")
      .eq("auth_user_id", userId)
      .single();

    if (staffErr || !staff) {
      return json({ error: "Staff profile not found" }, 404);
    }

    if (!staff.photo_url) {
      return json({ error: "No reference photo on file" }, 400);
    }

    // --- Validate geofence event ---
    const { data: evt, error: evtErr } = await admin
      .from("geofence_events")
      .select("id, staff_id, face_check_status")
      .eq("id", geofenceEventId)
      .single();

    if (evtErr || !evt) {
      return json({ error: "Geofence event not found" }, 404);
    }

    if (evt.staff_id !== staff.id) {
      return json({ error: "Event does not belong to this staff member" }, 403);
    }

    if (!["requested", "not_requested"].includes(evt.face_check_status ?? "")) {
      return json({ error: "Face check already completed for this event" }, 400);
    }

    // --- Upload comparison photo to storage ---
    let faceCheckPhotoUrl: string | null = null;
    try {
      // Strip data URL prefix to get raw base64
      const base64Data = comparisonPhoto.replace(/^data:image\/\w+;base64,/, "");
      const imageBytes = decodeBase64(base64Data);
      const storagePath = `face-checks/${staff.id}/${geofenceEventId}.jpg`;

      const { error: uploadErr } = await admin.storage
        .from("face-verifications")
        .upload(storagePath, imageBytes, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadErr) {
        console.error("Failed to upload face photo:", uploadErr);
      } else {
        const { data: urlData } = admin.storage
          .from("face-verifications")
          .getPublicUrl(storagePath);
        faceCheckPhotoUrl = urlData.publicUrl;
      }
    } catch (uploadError) {
      console.error("Face photo upload error (non-blocking):", uploadError);
    }

    // --- Download reference photo and base64-encode ---
    const photoRes = await fetch(staff.photo_url);
    if (!photoRes.ok) {
      return json({ error: "Failed to download reference photo" }, 500);
    }
    const photoBuffer = await photoRes.arrayBuffer();
    const base64Ref =
      "data:image/jpeg;base64," +
      btoa(String.fromCharCode(...new Uint8Array(photoBuffer)));

    // --- Call AI face verification ---
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.2",
        messages: [
          {
            role: "system",
            content:
              "You are a face verification expert. You will be given two photos. Your task is to determine whether they show the SAME person or DIFFERENT people. Analyze facial features such as face shape, eye spacing, nose structure, jawline, ears, and other distinguishing characteristics. You must respond ONLY by calling the provided tool.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Photo 1 is the REFERENCE photo. Photo 2 is the COMPARISON photo. Are these the same person?",
              },
              { type: "image_url", image_url: { url: base64Ref } },
              { type: "image_url", image_url: { url: comparisonPhoto } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "face_verification_result",
              description: "Report face verification result",
              parameters: {
                type: "object",
                properties: {
                  match: {
                    type: "boolean",
                    description: "true if both photos show the same person",
                  },
                  confidence: {
                    type: "string",
                    enum: ["very high", "high", "medium", "low", "very low"],
                  },
                  explanation: { type: "string" },
                },
                required: ["match", "confidence", "explanation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "face_verification_result" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return json({ error: `AI verification failed (${aiResponse.status})` }, 502);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return json({ error: "AI did not return a structured result" }, 502);
    }

    const result = JSON.parse(toolCall.function.arguments);
    const passConfidences = ["very high", "high", "medium"];
    const status =
      result.match && passConfidences.includes(result.confidence)
        ? "verified"
        : "mismatch";

    // --- Update geofence event (including photo URL if upload succeeded) ---
    const updatePayload: Record<string, unknown> = {
      face_check_status: status,
      face_check_at: new Date().toISOString(),
      face_check_confidence: result.confidence,
    };
    if (faceCheckPhotoUrl) {
      updatePayload.face_check_photo_url = faceCheckPhotoUrl;
    }

    await admin
      .from("geofence_events")
      .update(updatePayload)
      .eq("id", geofenceEventId);

    return json({ ok: true, status, confidence: result.confidence });
  } catch (e) {
    console.error("staff_submit_face_for_event error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
