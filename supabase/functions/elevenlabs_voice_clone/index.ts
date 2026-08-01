import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the user to update their staff profile
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // We expect FormData from the frontend containing the audio blob
    const formData = await req.formData();
    const name = formData.get("name") as string || `Clone for ${user.id}`;
    const description = formData.get("description") as string || "Cloned voice via Mila";
    const audioFile = formData.get("files") as File;

    if (!audioFile) {
      throw new Error("No audio file provided.");
    }

    const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!elevenLabsApiKey) {
      throw new Error("ELEVENLABS_API_KEY is not set in environment.");
    }

    // Forward the multipart form to ElevenLabs
    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append("name", name);
    elevenLabsFormData.append("description", description);
    elevenLabsFormData.append("files", audioFile);

    const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: {
        "xi-api-key": elevenLabsApiKey,
      },
      body: elevenLabsFormData
    });

    const data = await res.json();
    if (data.detail && data.detail.status === "error") {
      throw new Error(data.detail.message || "ElevenLabs error");
    }

    const newVoiceId = data.voice_id;
    if (!newVoiceId) {
      throw new Error("Voice cloning failed. No voice ID returned.");
    }

    // Save the new voice_id to the user's staff_profile
    // Using service role to update the staff profile or regular user if RLS permits
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: updateError } = await supabaseAdmin
      .from("staff_profiles")
      .update({
        voice_settings: {
          voice_id: newVoiceId,
          is_custom_clone: true
        }
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ 
      success: true, 
      voice_id: newVoiceId,
      message: "Voice cloned successfully."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("ElevenLabs Clone Error:", error.message);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
