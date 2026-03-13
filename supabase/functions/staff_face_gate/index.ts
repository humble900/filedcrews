import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Download an image URL and return a base64 data-url */
async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch reference photo: ${res.status}`);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const buf = await res.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return `data:${contentType};base64,${b64}`;
}

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
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userId = claimsData.claims.sub;

    // ── Parse payload ──
    const { comparisonPhoto } = await req.json();
    if (!comparisonPhoto) {
      return json({ error: "comparisonPhoto is required" }, 400);
    }

    // ── Find staff profile ──
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: staff, error: staffError } = await supabaseAdmin
      .from("staff_profiles")
      .select("id, photo_url")
      .eq("auth_user_id", userId)
      .single();

    if (staffError || !staff) {
      return json({ error: "Staff profile not found" }, 404);
    }

    if (!staff.photo_url) {
      return json({ ok: false, reason: "no_reference_photo" });
    }

    // ── Convert reference photo to base64 ──
    const referencePhoto = await urlToDataUrl(staff.photo_url);

    // ── Call AI verification (same logic as face-verify) ──
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
              { type: "image_url", image_url: { url: referencePhoto } },
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
                  match: { type: "boolean", description: "true if same person" },
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
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return a structured result");

    const result = JSON.parse(toolCall.function.arguments);
    const isMatch =
      result.match === true &&
      ["very high", "high", "medium"].includes(result.confidence);

    if (isMatch) {
      // Update last_face_verified_at
      await supabaseAdmin
        .from("staff_profiles")
        .update({ last_face_verified_at: new Date().toISOString() })
        .eq("id", staff.id);

      return json({ ok: true, match: true, confidence: result.confidence });
    }

    return json({
      ok: true,
      match: false,
      confidence: result.confidence,
      reason: "face_mismatch",
    });
  } catch (e) {
    console.error("staff_face_gate error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
