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
      .select("id, photo_url, company_id, full_name")
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

    // --- Download full-quality original reference photo ---
    const originalUrl = staff.photo_url.replace(/([^/?]+)(\.webp)/, "$1_original$2").replace(/\?v=\d+$/, "");
    const photoRes = await fetch(originalUrl);
    if (!photoRes.ok) {
      return json({ error: "Failed to download reference photo" }, 500);
    }
    const photoBuffer = await photoRes.arrayBuffer();
    const referenceBytes = new Uint8Array(photoBuffer);

    let isMatch = false;
    let confidence = "low";
    let explanation = "";

    const AWS_KEY = Deno.env.get("AWS_REKOGNITION_ACCESS_KEY");
    if (AWS_KEY) {
      console.log("AWS Rekognition credentials detected. Using AWS Rekognition for face comparison.");
      try {
        const { RekognitionClient, CompareFacesCommand } = await import("https://esm.sh/@aws-sdk/client-rekognition@3.500.0");
        const { decode: decodeBase64 } = await import("https://deno.land/std@0.203.0/encoding/base64.ts");

        const accessKeyId = AWS_KEY;
        const secretAccessKey = Deno.env.get("AWS_REKOGNITION_SECRET_KEY") || Deno.env.get("AWS_SECRET_ACCESS_KEY")!;
        const region = Deno.env.get("AWS_REGION") || "us-east-1";

        const rekognition = new RekognitionClient({
          region,
          credentials: { accessKeyId, secretAccessKey }
        });

        const base64Data = comparisonPhoto.replace(/^data:image\/\w+;base64,/, "");
        const comparisonBytes = decodeBase64(base64Data);

        const command = new CompareFacesCommand({
          SourceImage: { Bytes: referenceBytes },
          TargetImage: { Bytes: comparisonBytes },
          SimilarityThreshold: 80,
        });

        const response = await rekognition.send(command);
        const hasMatch = response.FaceMatches && response.FaceMatches.length > 0;
        const similarity = hasMatch ? response.FaceMatches[0].Similarity || 0 : 0;
        
        isMatch = hasMatch;
        confidence = similarity >= 95 ? "very high" : similarity >= 90 ? "high" : similarity >= 80 ? "medium" : "low";
        explanation = hasMatch 
          ? `AWS Rekognition verified face match with ${similarity.toFixed(1)}% similarity.` 
          : "AWS Rekognition did not find a matching face in the comparison photo.";
      } catch (awsError) {
        console.error("AWS Rekognition failed, falling back to OpenAI:", awsError);
        // Fall through to OpenAI logic below...
      }
    }

    if (!explanation) {
      // --- Call AI face verification ---
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

      const contentType = photoRes.headers.get("content-type") || "image/jpeg";
      let binary = "";
      const len = referenceBytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(referenceBytes[i]);
      }
      const b64 = btoa(binary);
      const base64Ref = `data:${contentType};base64,${b64}`;

      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
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
      isMatch = result.match === true;
      confidence = result.confidence;
      explanation = result.explanation;
    }

    const passConfidences = ["very high", "high", "medium"];
    const status =
      isMatch && passConfidences.includes(confidence)
        ? "verified"
        : "mismatch";

    // --- Update geofence event (including photo URL if upload succeeded) ---
    const updatePayload: Record<string, unknown> = {
      face_check_status: status,
      face_check_at: new Date().toISOString(),
      face_check_confidence: confidence,
    };
    if (faceCheckPhotoUrl) {
      updatePayload.face_check_photo_url = faceCheckPhotoUrl;
    }

    await admin
      .from("geofence_events")
      .update(updatePayload)
      .eq("id", geofenceEventId);

    if (status === "mismatch") {
      // Find company details
      const { data: comp } = await admin
        .from("companies")
        .select("name, auth_user_id")
        .eq("id", staff.company_id)
        .single();
      
      if (comp) {
        // Query auth.users using admin client to get email
        const { data: userLink } = await admin.auth.admin.getUserById(comp.auth_user_id);
        const adminEmail = userLink?.user?.email;
        if (adminEmail) {
          try {
            await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send_email_notification`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                to: adminEmail,
                subject: `[OnSite Crew Manager Alert] Face Verification Mismatch for ${staff.full_name || 'Staff'}`,
                html: `
                  <h3>Face Verification Warning</h3>
                  <p>A face verification mismatch was detected for staff member <strong>${staff.full_name}</strong> during check-in/event.</p>
                  <ul>
                    <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                    <li><strong>AI Status:</strong> Mismatch</li>
                    <li><strong>Confidence:</strong> ${confidence}</li>
                    <li><strong>Reasoning:</strong> ${explanation}</li>
                  </ul>
                  <p>Please log in to the OnSite Crew Manager dashboard and inspect the selfie comparison in the Face Audit section.</p>
                `,
              }),
            });
          } catch (emailErr) {
            console.error("Non-blocking email send failure:", emailErr);
          }
        }
      }
    }

    return json({ ok: true, status, confidence });
  } catch (e) {
    console.error("staff_submit_face_for_event error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
