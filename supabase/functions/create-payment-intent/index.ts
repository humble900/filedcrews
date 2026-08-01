import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.19.0"; // Deno compatible Stripe import

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  const respond = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { authorization: authHeader } } }
    );
    const { data: { user: callerUser } } = await callerClient.auth.getUser();
    if (!callerUser) return respond({ ok: false, error: "Unauthorized" }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { invoiceId, companyId } = await req.json();
    if (!invoiceId || !companyId) return respond({ ok: false, error: "invoiceId and companyId required" }, 400);

    // Get the company's Stripe Secret Key from api_keys vault
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("secret_key")
      .eq("company_id", companyId)
      .eq("provider", "stripe")
      .single();

    if (keyError || !apiKeyData) {
      return respond({ ok: false, error: "Company has not connected a valid Stripe account." }, 400);
    }

    const stripe = new Stripe(apiKeyData.secret_key, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient() // important for Deno
    });

    // Fetch Invoice to get Amount
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .select("amount")
      .eq("id", invoiceId)
      .single();
    
    if (invoiceError || !invoice) return respond({ ok: false, error: "Invoice not found" }, 404);

    const amountInCents = Math.round(invoice.amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: { invoiceId, companyId }
    });

    return respond({
      ok: true,
      clientSecret: paymentIntent.client_secret
    });

  } catch (err: any) {
    console.error("Error creating payment intent", err);
    return respond({ ok: false, error: err.message }, 500);
  }
});
