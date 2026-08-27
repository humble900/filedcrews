import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.19.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  const respond = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { invoiceId, companyId } = await req.json();
    if (!invoiceId || !companyId) return respond({ ok: false, error: "invoiceId and companyId required" }, 400);

    // Fetch Invoice to verify it exists and is unpaid
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .select("id, amount, payment_status, company_id")
      .eq("id", invoiceId)
      .eq("company_id", companyId)
      .single();
    
    if (invoiceError || !invoice) return respond({ ok: false, error: "Invoice not found or invalid." }, 404);
    if (invoice.payment_status === "Paid") return respond({ ok: false, error: "Invoice is already paid." }, 400);

    // Get the company's Stripe Secret Key from api_keys vault
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("secret_key")
      .eq("company_id", companyId)
      .eq("provider", "stripe")
      .maybeSingle();

    // Fallback to platform STRIPE_SECRET_KEY if company key is not set
    const stripeKey = apiKeyData?.secret_key || Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeKey) {
      return respond({ ok: false, error: "Payment processing is not configured for this account." }, 400);
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const amountInCents = Math.round(invoice.amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: { invoiceId, invoice_id: invoiceId, companyId, company_id: companyId, project: "filedcrews" }
    });

    return respond({
      ok: true,
      clientSecret: paymentIntent.client_secret
    });

  } catch (err: any) {
    console.error("Error creating payment intent:", err);
    return respond({ ok: false, error: err.message }, 500);
  }
});
