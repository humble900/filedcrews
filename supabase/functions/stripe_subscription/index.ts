import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const respond = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { action, planId, companyId, sessionId, returnUrl, cancelUrl } = await req.json();

    // ─── 1. CREATE CHECKOUT SESSION ─────────────────────────────────────
    if (action === "create_checkout_session") {
      if (!companyId || !planId) {
        return respond({ error: "Missing required fields: companyId and planId" }, 400);
      }

      // Fetch company record
      const { data: company, error: compErr } = await supabaseAdmin
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (compErr || !company) {
        return respond({ error: "Company not found" }, 404);
      }

      // Fetch admin user email
      let userEmail = "";
      if (company.auth_user_id) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(company.auth_user_id);
        userEmail = userData?.user?.email || "";
      }

      // 1a. Ensure Stripe Customer exists
      let customerId = company.stripe_customer_id;
      if (!customerId) {
        const custParams = new URLSearchParams();
        if (userEmail) custParams.append("email", userEmail);
        custParams.append("name", company.name || "FiledCrews Organization");
        custParams.append("description", `FiledCrews Company: ${company.name} (@${company.prefix})`);
        custParams.append("metadata[project]", "filedcrews");
        custParams.append("metadata[companyId]", companyId);

        const custRes = await fetch("https://api.stripe.com/v1/customers", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: custParams,
        });

        if (custRes.ok) {
          const custData = await custRes.json();
          customerId = custData.id;
          await supabaseAdmin
            .from("companies")
            .update({ stripe_customer_id: customerId })
            .eq("id", companyId);
        }
      }

      // 1b. Plan Specifications (Recurring Subscriptions)
      let planName = "FiledCrews Growth Plan";
      let planDesc = "10 Total Seats (3 Admin, 7 Crew), AI Dispatcher & Safety Hub";
      let unitAmount = "49500"; // $495.00
      let interval = "month";
      let canonicalTier = "growth";

      if (planId === "founding_partner" || planId === "Founding Partner") {
        planName = "FiledCrews - Founding Partner VIP Charter";
        planDesc = "20 Total Seats, Permanent Founder Pricing ($12/seat/mo), Direct Co-Design Channel";
        unitAmount = "289900"; // $2,899.00
        interval = "year";
        canonicalTier = "Founding Partner";
      }

      const reqOrigin = req.headers.get("origin") || "https://filedcrews.com";
      const finalSuccessUrl = returnUrl
        ? `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}&success=true`
        : `${reqOrigin}/settings?tab=billing&session_id={CHECKOUT_SESSION_ID}&success=true`;

      const finalCancelUrl = cancelUrl
        ? `${cancelUrl}${cancelUrl.includes("?") ? "&" : "?"}canceled=true`
        : `${reqOrigin}/settings?tab=billing&canceled=true`;

      // 1c. Build Stripe Checkout Request
      const sessionParams = new URLSearchParams();
      sessionParams.append("mode", "subscription");
      sessionParams.append("payment_method_types[0]", "card");
      if (customerId) sessionParams.append("customer", customerId);
      else if (userEmail) sessionParams.append("customer_email", userEmail);

      sessionParams.append("client_reference_id", companyId);
      sessionParams.append("metadata[project]", "filedcrews");
      sessionParams.append("metadata[companyId]", companyId);
      sessionParams.append("metadata[planId]", canonicalTier);
      sessionParams.append("metadata[planInterval]", interval);

      // Subscription item metadata for multi-project isolation
      sessionParams.append("subscription_data[metadata][project]", "filedcrews");
      sessionParams.append("subscription_data[metadata][companyId]", companyId);
      sessionParams.append("subscription_data[metadata][planId]", canonicalTier);

      // Line items with dynamic pricing
      sessionParams.append("line_items[0][price_data][currency]", "usd");
      sessionParams.append("line_items[0][price_data][product_data][name]", planName);
      sessionParams.append("line_items[0][price_data][product_data][description]", planDesc);
      sessionParams.append("line_items[0][price_data][product_data][metadata][project]", "filedcrews");
      sessionParams.append("line_items[0][price_data][unit_amount]", unitAmount);
      sessionParams.append("line_items[0][price_data][recurring][interval]", interval);
      sessionParams.append("line_items[0][quantity]", "1");

      sessionParams.append("success_url", finalSuccessUrl);
      sessionParams.append("cancel_url", finalCancelUrl);
      sessionParams.append("allow_promotion_codes", "true");
      sessionParams.append("billing_address_collection", "auto");

      const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: sessionParams,
      });

      if (!sessionRes.ok) {
        const errText = await sessionRes.text();
        throw new Error(`Stripe Checkout Session error: ${errText}`);
      }

      const sessionData = await sessionRes.json();
      return respond({
        success: true,
        url: sessionData.url,
        sessionId: sessionData.id,
      });
    }

    // ─── 2. CREATE BILLING CUSTOMER PORTAL SESSION ──────────────────────
    if (action === "create_portal_session") {
      if (!companyId) {
        return respond({ error: "Missing companyId" }, 400);
      }

      const { data: company, error: compErr } = await supabaseAdmin
        .from("companies")
        .select("stripe_customer_id")
        .eq("id", companyId)
        .single();

      if (compErr || !company?.stripe_customer_id) {
        return respond({ error: "No active Stripe customer found for this company. Please subscribe to a plan first." }, 400);
      }

      const reqOrigin = req.headers.get("origin") || "https://filedcrews.com";
      const portalParams = new URLSearchParams();
      portalParams.append("customer", company.stripe_customer_id);
      portalParams.append("return_url", returnUrl || `${reqOrigin}/settings?tab=billing`);

      const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: portalParams,
      });

      if (!portalRes.ok) {
        const errText = await portalRes.text();
        throw new Error(`Stripe Portal Session error: ${errText}`);
      }

      const portalData = await portalRes.json();
      return respond({
        success: true,
        url: portalData.url,
      });
    }

    // ─── 3. VERIFY COMPLETED SESSION (INSTANT CLIENT SYNC) ──────────────
    if (action === "verify_session") {
      if (!sessionId) {
        return respond({ error: "Missing sessionId" }, 400);
      }

      const sessRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
        headers: {
          "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        },
      });

      if (!sessRes.ok) {
        return respond({ error: "Failed to retrieve Stripe session" }, 400);
      }

      const session = await sessRes.json();

      // Multi-project safety check: Ensure session belongs to FiledCrews
      if (session.metadata?.project !== "filedcrews") {
        return respond({ error: "Session does not belong to FiledCrews" }, 403);
      }

      const targetCompanyId = session.client_reference_id || session.metadata?.companyId;
      const targetPlanId = session.metadata?.planId || "growth";
      const canonicalTier = targetPlanId === "Founding Partner" || targetPlanId === "founding_partner"
        ? "Founding Partner"
        : "growth";

      const maxAdmin = canonicalTier === "Founding Partner" ? 20 : 3;
      const maxCrew = canonicalTier === "Founding Partner" ? 20 : 7;

      if (targetCompanyId && (session.payment_status === "paid" || session.status === "complete")) {
        await supabaseAdmin
          .from("companies")
          .update({
            subscription_tier: canonicalTier,
            subscription_status: "active",
            stripe_customer_id: session.customer || null,
            stripe_subscription_id: session.subscription || null,
            max_admin_seats: maxAdmin,
            max_field_crew_seats: maxCrew,
          })
          .eq("id", targetCompanyId);

        return respond({
          success: true,
          verified: true,
          planTier: canonicalTier,
          companyId: targetCompanyId,
        });
      }

      return respond({
        success: true,
        verified: false,
        paymentStatus: session.payment_status,
      });
    }

    return respond({ error: `Unknown action: ${action}` }, 400);

  } catch (err: any) {
    console.error("stripe_subscription error:", err);
    return respond({ error: err.message || "Internal server error" }, 500);
  }
});
