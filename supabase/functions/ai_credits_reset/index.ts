import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  jsonResponse,
} from "../_shared/framework.ts";

/**
 * ai_credits_reset
 * 
 * Monthly cron-triggered edge function that bulk-resets AI credits for all companies.
 * Can be invoked by:
 *   - Supabase pg_cron (SELECT net.http_post(...)) on the 1st of each month
 *   - A manual superadmin call
 * 
 * Secured via CRON_SECRET header to prevent unauthorized calls.
 */

const TIER_CREDIT_MAP: Record<string, number> = {
  free_trial: 0,
  Free: 0,
  growth: 200,
  founding_partner: 500,
  "Founding Partner": 500,
  enterprise: 1000,
};

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Simple auth: require CRON_SECRET or service-role key
    const authHeader = req.headers.get("authorization") ?? "";
    const cronSecret = Deno.env.get("CRON_SECRET");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
    const isServiceRole = serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;

    if (!isCron && !isServiceRole) {
      return jsonResponse({ error: "Unauthorized" }, 401, requestId);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    // Fetch all companies with their subscription tier
    const { data: companies, error: fetchErr } = await supabaseAdmin
      .from("companies")
      .select("id, subscription_tier")
      .order("id");

    if (fetchErr) {
      throw fetchErr;
    }

    let resetCount = 0;

    for (const company of (companies || [])) {
      const tier = company.subscription_tier || "free_trial";
      const newLimit = TIER_CREDIT_MAP[tier] ?? 0;

      const { error: updateErr } = await supabaseAdmin
        .from("companies")
        .update({
          ai_credits_used: 0,
          ai_credits_monthly_limit: newLimit,
          ai_credits_reset_at: nextReset,
          // Note: ai_credits_bonus is NOT reset — those are purchased add-ons
        })
        .eq("id", company.id);

      if (!updateErr) {
        resetCount++;
      } else {
        console.error(`[${requestId}] Failed to reset company ${company.id}:`, updateErr);
      }
    }

    console.log(`[${requestId}] AI credits reset for ${resetCount}/${(companies || []).length} companies`);

    return jsonResponse(
      {
        success: true,
        message: `Monthly AI credit reset complete.`,
        companiesReset: resetCount,
        nextResetAt: nextReset,
      },
      200,
      requestId
    );
  } catch (err: any) {
    console.error(`[${requestId}] AI Credits Reset error:`, err);
    return jsonResponse({ error: err.message || "Unexpected error" }, 500, requestId);
  }
});
