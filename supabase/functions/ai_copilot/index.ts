import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.28.0";
import {
  corsHeaders,
  jsonResponse,
  authenticateCaller,
} from "../_shared/framework.ts";
import {
  AI_TOOL_REGISTRY,
  sanitizePrompt,
} from "../_shared/aiToolRegistry.ts";

// ─── Tier-based monthly credit allocations ───────────────────────────────────
const TIER_CREDIT_MAP: Record<string, number> = {
  free_trial: 0,
  Free: 0,
  growth: 200,
  founding_partner: 500,
  "Founding Partner": 500,
  enterprise: 1000,
};

const PAID_TIERS = new Set([
  "growth",
  "founding_partner",
  "Founding Partner",
  "enterprise",
]);

// ─── System Prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Mila, an AI copilot for field service technicians and staff.

Your role:
- Help staff draft professional work summaries, job reports, and diagnostic notes.
- Assist with parts & materials logging and billing recommendations.
- Provide safety reminders and best-practice suggestions for HVAC, plumbing, electrical, and general trade work.
- Generate checklists, maintenance schedules, and follow-up recommendations.
- Be concise, professional, and actionable.

Rules:
- Keep responses under 300 words unless the user asks for more detail.
- Use bullet points for lists. Use professional language suitable for customer-facing reports.
- If a job ID is provided, reference it in your response.
- Never make up specific part numbers, prices, or warranty details—use placeholders if needed.
- Always sign off responses with a brief next-step suggestion when appropriate.`;

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, companyId, jobId } = await req.json();

    if (!prompt || !companyId) {
      return jsonResponse(
        { error: "prompt and companyId are required" },
        400,
        requestId
      );
    }

    // ── 1. Authenticate Caller JWT ──────────────────────────────────────────
    const { user: callerUser, error: authError } = await authenticateCaller(req);
    if (authError || !callerUser) {
      return jsonResponse({ error: authError || "Unauthorized caller" }, 401, requestId);
    }

    // ── 2. Prompt Injection Defense ─────────────────────────────────────────
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

    // ── 3. Verify Tenant Isolation & Fetch Company ──────────────────────────
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

    // Fetch company details for tier + credits
    const { data: company, error: companyErr } = await supabaseAdmin
      .from("companies")
      .select("id, subscription_tier, ai_api_key, ai_credits_monthly_limit, ai_credits_used, ai_credits_bonus, ai_credits_reset_at")
      .eq("id", companyId)
      .single();

    if (companyErr || !company) {
      return jsonResponse({ error: "Company not found" }, 404, requestId);
    }

    const tier = company.subscription_tier || "free_trial";

    // ── 4. Plan Gating — Free users cannot access AI ────────────────────────
    // Check if company has a BYOK key (BYOK overrides free-tier gating)
    const { data: byokRow } = await supabaseAdmin
      .from("api_keys")
      .select("secret_key")
      .eq("company_id", companyId)
      .eq("provider", "openai")
      .maybeSingle();

    const candidateByok = byokRow?.secret_key || company.ai_api_key || "";
    const isRealByok = candidateByok.trim().length > 10 && 
      !candidateByok.includes("seeded-v1-prod-key") && 
      (candidateByok.startsWith("sk-") || candidateByok.startsWith("org-") || candidateByok.startsWith("sess-"));
    const hasByokKey = !!isRealByok;

    if (!PAID_TIERS.has(tier) && !hasByokKey) {
      return jsonResponse(
        {
          gated: true,
          reason: "upgrade_required",
          message: "AI Copilot is available on paid plans. Upgrade your subscription to unlock Mila AI.",
          tier,
        },
        200,
        requestId
      );
    }

    // ── 5. Monthly Credit Auto-Reset ────────────────────────────────────────
    const now = new Date();
    const resetAt = company.ai_credits_reset_at ? new Date(company.ai_credits_reset_at) : null;

    if (!resetAt || now >= resetAt) {
      // Reset credits for the new billing month
      const newLimit = TIER_CREDIT_MAP[tier] ?? 0;
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      await supabaseAdmin
        .from("companies")
        .update({
          ai_credits_used: 0,
          ai_credits_monthly_limit: newLimit,
          ai_credits_reset_at: nextReset,
        })
        .eq("id", companyId);

      // Refresh local values after reset
      company.ai_credits_used = 0;
      company.ai_credits_monthly_limit = newLimit;
    }

    // ── 6. Credit Check (BYOK users = unlimited) ────────────────────────────
    const totalAvailable = company.ai_credits_monthly_limit + (company.ai_credits_bonus || 0);
    const creditsRemaining = totalAvailable - company.ai_credits_used;

    if (!hasByokKey && creditsRemaining <= 0) {
      return jsonResponse(
        {
          gated: true,
          reason: "credits_exhausted",
          message: "Your company has used all AI credits for this month.",
          creditsUsed: company.ai_credits_used,
          creditsLimit: totalAvailable,
          resetsAt: company.ai_credits_reset_at,
          tier,
        },
        200,
        requestId
      );
    }

    // ── 7. Resolve API Key (BYOK > Global Fallback) ─────────────────────────
    let apiKey: string;
    let keySource: "byok" | "platform";

    if (hasByokKey) {
      apiKey = candidateByok;
      keySource = "byok";
    } else {
      const globalKey = Deno.env.get("OPENAI_API_KEY");
      if (!globalKey) {
        console.error(`[${requestId}] OPENAI_API_KEY is not configured in Edge Secrets`);
        return jsonResponse(
          { error: "AI service is not configured. Please contact support." },
          503,
          requestId
        );
      }
      apiKey = globalKey;
      keySource = "platform";
    }

    // ── 8. Call OpenAI ──────────────────────────────────────────────────────
    const openai = new OpenAI({ apiKey });

    const userMessage = jobId
      ? `[Job ID: ${jobId}] ${promptCheck.sanitized}`
      : promptCheck.sanitized;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const aiMessage = completion.choices?.[0]?.message?.content || "I wasn't able to generate a response. Please try again.";
    const tokensUsed = completion.usage?.total_tokens || 0;

    // ── 9. Increment Credits & Log Usage (skip for BYOK) ────────────────────
    if (keySource === "platform") {
      await supabaseAdmin
        .from("companies")
        .update({ ai_credits_used: (company.ai_credits_used || 0) + 1 })
        .eq("id", companyId);
    }

    // Log usage regardless of key source
    await supabaseAdmin
      .from("company_usage_logs")
      .insert({
        company_id: companyId,
        metric_type: "ai_copilot_call",
        quantity: 1,
        details: {
          staff_id: staffProfile.id,
          job_id: jobId || null,
          tokens_used: tokensUsed,
          model: "gpt-4o-mini",
          key_source: keySource,
          request_id: requestId,
        },
      });

    // ── 10. Return Response ─────────────────────────────────────────────────
    const newCreditsUsed = keySource === "platform" ? (company.ai_credits_used || 0) + 1 : company.ai_credits_used;

    return jsonResponse(
      {
        success: true,
        message: aiMessage,
        creditsUsed: newCreditsUsed,
        creditsLimit: totalAvailable,
        creditsRemaining: keySource === "byok" ? -1 : totalAvailable - newCreditsUsed,
        keySource,
        toolsRegistered: Object.keys(AI_TOOL_REGISTRY).length,
      },
      200,
      requestId
    );
  } catch (err: any) {
    console.error(`[${requestId}] AI Copilot execution error:`, err);

    // Handle OpenAI-specific errors gracefully
    if (err?.status === 401 || err?.code === "invalid_api_key") {
      return jsonResponse(
        { error: "Invalid AI API key. Please check your BYOK key in Settings or contact support." },
        401,
        requestId
      );
    }
    if (err?.status === 429) {
      return jsonResponse(
        { error: "AI rate limit reached. Please wait a moment and try again." },
        429,
        requestId
      );
    }

    return jsonResponse({ error: err.message || "Unexpected AI error" }, 500, requestId);
  }
});
