import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/framework.ts";

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabaseAdmin.from("companies").select("id").limit(1);

    if (error) {
      return jsonResponse(
        { status: "unhealthy", database: "disconnected", error: error.message },
        500,
        requestId
      );
    }

    return jsonResponse(
      {
        status: "healthy",
        database: "connected",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      },
      200,
      requestId
    );
  } catch (err: any) {
    return jsonResponse(
      { status: "unhealthy", error: err.message || "Health check failed" },
      500,
      requestId
    );
  }
});
