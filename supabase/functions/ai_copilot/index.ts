import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  jsonResponse,
  authenticateCaller,
} from "../_shared/framework.ts";
import {
  AI_TOOL_REGISTRY,
  sanitizePrompt,
} from "../_shared/aiToolRegistry.ts";

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, companyId } = await req.json();

    if (!prompt || !companyId) {
      return jsonResponse(
        { error: "prompt and companyId are required" },
        400,
        requestId
      );
    }

    // 1. Authenticate Caller JWT
    const { user: callerUser, error: authError } = await authenticateCaller(req);
    if (authError || !callerUser) {
      return jsonResponse({ error: authError || "Unauthorized caller" }, 401, requestId);
    }

    // 2. Prompt Injection Defense Check
    const promptCheck = sanitizePrompt(prompt);
    if (!promptCheck.safe) {
      console.warn(`[${requestId}] Prompt injection attempt blocked: ${promptCheck.reason}`);
      return jsonResponse(
        { error: `Security Policy Violation: ${promptCheck.reason}` },
        403,
        requestId
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 3. Verify Tenant Isolation & Company Ownership
    const { data: staffProfile, error: profileErr } = await supabaseAdmin
      .from("staff_profiles")
      .select("id, company_id, global_role")
      .eq("auth_user_id", callerUser.id)
      .eq("company_id", companyId)
      .single();

    if (profileErr || !staffProfile) {
      return jsonResponse(
        { error: "Access Denied: Caller does not belong to target company" },
        403,
        requestId
      );
    }

    return jsonResponse(
      {
        success: true,
        message: "Mila AI Governance Gateway active.",
        sanitizedPrompt: promptCheck.sanitized,
        toolsRegistered: Object.keys(AI_TOOL_REGISTRY).length,
      },
      200,
      requestId
    );
  } catch (err: any) {
    console.error(`[${requestId}] AI Copilot execution error:`, err);
    return jsonResponse({ error: err.message || "Unexpected AI error" }, 500, requestId);
  }
});
