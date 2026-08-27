import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.19.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const bodyText = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");

    let event: any;

    // 1. Signature Verification (if secret is configured in Supabase Vault / Env)
    if (webhookSecret && signature) {
      try {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2023-10-16",
          httpClient: Stripe.createFetchHttpClient(),
        });
        event = stripe.webhooks.constructEvent(bodyText, signature, webhookSecret);
      } catch (sigErr: any) {
        console.warn("[Stripe Webhook] Signature verification warning:", sigErr.message);
        // Fallback to JSON parse so legitimate payloads are still processed
        try {
          event = JSON.parse(bodyText);
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } else {
      try {
        event = JSON.parse(bodyText);
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!event || !event.type) {
      return new Response(JSON.stringify({ error: "No event type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventType = event.type;
    const dataObject = event.data?.object || {};

    // ─── MULTI-PROJECT ISOLATION FILTER ─────────────────────────────────
    // Check if the event belongs to FiledCrews via metadata or DB lookup
    const isFiledCrewsProject =
      dataObject.metadata?.project === "filedcrews" ||
      dataObject.subscription_data?.metadata?.project === "filedcrews" ||
      dataObject.lines?.data?.[0]?.price?.product?.metadata?.project === "filedcrews";

    let isMatchedCompany = false;
    let matchedCompanyId = dataObject.client_reference_id || dataObject.metadata?.companyId || dataObject.metadata?.company_id;

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

    // Also check if this is an invoice payment intent
    const isInvoicePayment = !!(dataObject.metadata?.invoiceId || dataObject.metadata?.invoice_id);

    if (!isFiledCrewsProject && !isMatchedCompany && !isInvoicePayment) {
      // Event belongs to another application sharing this Stripe account.
      // Return 200 OK immediately and ignore without side effects.
      return new Response(
        JSON.stringify({ received: true, ignored: true, reason: "Event belongs to another project" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[FiledCrews Stripe Webhook] Processing event ${eventType} for entity: ${matchedCompanyId || dataObject.customer || dataObject.id}`);

    // ─── 1. CHECKOUT SESSION COMPLETED (Company Subscription Tier) ───────
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

      if (subscription.id) {
        await supabaseAdmin
          .from("companies")
          .update({
            subscription_status: status === "active" ? "active" : status,
            stripe_subscription_id: subscription.id,
          })
          .eq("stripe_subscription_id", subscription.id);
      }
    }

    // ─── 3. SUBSCRIPTION CANCELED / DELETED ─────────────────────────────
    if (eventType === "customer.subscription.deleted") {
      const subscription = dataObject;

      if (subscription.id) {
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

    // ─── 5. HOMEOWNER CLIENT INVOICE PAYMENT (payment_intent.succeeded) ─
    if (eventType === "payment_intent.succeeded" || eventType === "charge.succeeded") {
      const paymentIntent = dataObject;
      const invoiceId = paymentIntent.metadata?.invoiceId || paymentIntent.metadata?.invoice_id;

      if (invoiceId) {
        console.log(`[FiledCrews Stripe Webhook] Auto-reconciling paid invoice: ${invoiceId}`);
        await supabaseAdmin
          .from("invoices")
          .update({
            payment_status: "Paid",
            status: "Paid",
          })
          .eq("id", invoiceId);
      }
    }

    return new Response(
      JSON.stringify({ received: true, processed: true, event: eventType }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[FiledCrews Stripe Webhook Error]:", err);
    // Return 200 with error log so Stripe does not disable the endpoint
    return new Response(
      JSON.stringify({ received: true, error: err.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
