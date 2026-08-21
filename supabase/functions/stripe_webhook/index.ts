import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Content-Type": "text/plain" } });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const bodyText = await req.text();
    let event: any;

    try {
      event = JSON.parse(bodyText);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), { status: 400 });
    }

    const eventType = event.type;
    const dataObject = event.data?.object || {};

    // ─── MULTI-PROJECT ISOLATION FILTER ─────────────────────────────────
    // Check if the event belongs to FiledCrews via metadata
    const isFiledCrewsProject =
      dataObject.metadata?.project === "filedcrews" ||
      dataObject.subscription_data?.metadata?.project === "filedcrews" ||
      dataObject.lines?.data?.[0]?.price?.product?.metadata?.project === "filedcrews";

    // If metadata is absent, check if customer or client_reference_id matches FiledCrews DB
    let isMatchedCompany = false;
    let matchedCompanyId = dataObject.client_reference_id || dataObject.metadata?.companyId;

    if (!isFiledCrewsProject && !matchedCompanyId && dataObject.customer) {
      const { data: matchedComp } = await supabaseAdmin
        .from("companies")
        .select("id")
        .eq("stripe_customer_id", dataObject.customer)
        .maybeSingle();

      if (matchedComp) {
        isMatchedCompany = true;
        matchedCompanyId = matchedComp.id;
      }
    } else if (matchedCompanyId) {
      isMatchedCompany = true;
    }

    if (!isFiledCrewsProject && !isMatchedCompany) {
      // Event belongs to another application sharing this Stripe account.
      // Return 200 OK immediately and ignore without side effects.
      return new Response(
        JSON.stringify({ received: true, ignored: true, reason: "Event belongs to another project" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[FiledCrews Stripe Webhook] Processing event ${eventType} for company: ${matchedCompanyId || dataObject.customer}`);

    // ─── 1. CHECKOUT SESSION COMPLETED ──────────────────────────────────
    if (eventType === "checkout.session.completed") {
      const session = dataObject;
      const companyId = session.client_reference_id || session.metadata?.companyId;
      const rawPlanId = session.metadata?.planId || "growth";
      const canonicalTier = rawPlanId === "Founding Partner" || rawPlanId === "founding_partner"
        ? "Founding Partner"
        : "growth";

      const maxAdmin = canonicalTier === "Founding Partner" ? 20 : 3;
      const maxCrew = canonicalTier === "Founding Partner" ? 20 : 7;

      if (companyId) {
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
          .eq("id", companyId);

        // Record billing event
        await supabaseAdmin.from("platform_billing_events").insert({
          company_id: companyId,
          stripe_event_id: event.id,
          event_type: eventType,
          plan_tier: canonicalTier,
          amount_cents: session.amount_total || (canonicalTier === "Founding Partner" ? 289900 : 49500),
          currency: session.currency || "usd",
          payload: session,
        });
      }
    }

    // ─── 2. SUBSCRIPTION UPDATED / STATUS CHANGE ────────────────────────
    if (eventType === "customer.subscription.updated") {
      const subscription = dataObject;
      const status = subscription.status; // active, past_due, canceled, unpaid

      await supabaseAdmin
        .from("companies")
        .update({
          subscription_status: status === "active" ? "active" : status,
          stripe_subscription_id: subscription.id,
        })
        .eq("stripe_subscription_id", subscription.id);
    }

    // ─── 3. SUBSCRIPTION CANCELED / DELETED ─────────────────────────────
    if (eventType === "customer.subscription.deleted") {
      const subscription = dataObject;

      await supabaseAdmin
        .from("companies")
        .update({
          subscription_status: "canceled",
          subscription_tier: "free_trial",
          max_admin_seats: 1,
          max_field_crew_seats: 2,
        })
        .eq("stripe_subscription_id", subscription.id);
    }

    // ─── 4. INVOICE PAYMENT SUCCESS / FAILURE ───────────────────────────
    if (eventType === "invoice.payment_succeeded") {
      const invoice = dataObject;
      if (invoice.subscription) {
        await supabaseAdmin
          .from("companies")
          .update({ subscription_status: "active" })
          .eq("stripe_subscription_id", invoice.subscription);
      }
    }

    if (eventType === "invoice.payment_failed") {
      const invoice = dataObject;
      if (invoice.subscription) {
        await supabaseAdmin
          .from("companies")
          .update({ subscription_status: "past_due" })
          .eq("stripe_subscription_id", invoice.subscription);
      }
    }

    return new Response(
      JSON.stringify({ received: true, processed: true, event: eventType }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[FiledCrews Stripe Webhook Error]:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
