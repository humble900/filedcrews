import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64, type } = await req.json();

    if (!imageBase64 || !type) {
      throw new Error("Missing imageBase64 or type");
    }

    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiApiKey) {
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }

    const openai = new OpenAI({ apiKey: openAiApiKey });

    let systemPrompt = "";
    if (type === "equipment") {
      systemPrompt = `You are an expert OCR AI specializing in reading HVAC, plumbing, and industrial equipment data plates.
Analyze the provided image and extract the following details if present:
- Make (manufacturer)
- Model (model number)
- Serial Number (serial number)
Return the response strictly as a JSON object: {"make": "...", "model": "...", "serial_number": "..."}.
If a field is not found or unreadable, set its value to null.`;
    } else if (type === "receipt") {
      systemPrompt = `You are an expert OCR AI specializing in reading purchase receipts.
Analyze the provided image and extract the following details if present:
- Merchant Name
- Date (format YYYY-MM-DD if possible)
- Total Amount (numeric value only)
Return the response strictly as a JSON object: {"merchant_name": "...", "date": "...", "total_amount": 0.00}.
If a field is not found or unreadable, set its value to null.`;
    } else {
      throw new Error("Invalid type. Must be 'equipment' or 'receipt'");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high"
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const content = response.choices[0].message.content || "";
    // Extract JSON block in case GPT wraps it in markdown code block
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || content.match(/(\{[\s\S]*?\})/);
    const parsedData = jsonMatch ? JSON.parse(jsonMatch[1]) : {};

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("OCR Processor error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
