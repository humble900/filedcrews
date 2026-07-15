import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const { referencePhoto, comparisonPhoto } = await req.json();
    if (!referencePhoto || !comparisonPhoto) {
      return new Response(JSON.stringify({ error: "Both photos are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: `You are a face verification expert. You will be given two photos. Your task is to determine whether they show the SAME person or DIFFERENT people. Analyze facial features such as face shape, eye spacing, nose structure, jawline, ears, and other distinguishing characteristics. You must respond ONLY by calling the provided tool.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Photo 1 is the REFERENCE photo. Photo 2 is the COMPARISON photo. Are these the same person?",
              },
              {
                type: "image_url",
                image_url: { url: referencePhoto },
              },
              {
                type: "image_url",
                image_url: { url: comparisonPhoto },
              },
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
                    description: "true if both photos show the same person, false otherwise",
                  },
                  confidence: {
                    type: "string",
                    enum: ["very high", "high", "medium", "low", "very low"],
                    description: "How confident you are in the match/no-match determination",
                  },
                  explanation: {
                    type: "string",
                    description: "Brief explanation of the facial features compared and reasoning",
                  },
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

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("AI did not return a structured result");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("face-verify error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
