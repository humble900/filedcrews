import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, affiliateId, amount } = await req.json();

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }

    if (action === "payout") {
      // 1. Create a transfer to the connected account
      const { stripeAccountId } = payload || {}; // Assuming the client sends the connected account ID
      if (!stripeAccountId || !amount) {
        throw new Error("Missing stripeAccountId or amount for payout");
      }

      const response = await fetch("https://api.stripe.com/v1/transfers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          amount: Math.round(amount * 100).toString(), // Stripe uses cents
          currency: "usd",
          destination: stripeAccountId,
          description: `Affiliate payout for ${affiliateId}`
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Stripe Transfer Error: ${errText}`);
      }
      
      const transferData = await response.json();

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Payout processed via Stripe Connect", 
        payoutId: transferData.id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "connect") {
      // Create a Stripe Connect Express account
      const accountResponse = await fetch("https://api.stripe.com/v1/accounts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          type: "express",
          "capabilities[transfers][requested]": "true"
        })
      });

      if (!accountResponse.ok) {
        throw new Error("Failed to create Stripe account: " + await accountResponse.text());
      }
      
      const accountData = await accountResponse.json();

      // Create an account link for onboarding
      const linkResponse = await fetch("https://api.stripe.com/v1/account_links", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          account: accountData.id,
          refresh_url: `${req.headers.get("origin") || "http://localhost:5173"}/affiliates?refresh=true`,
          return_url: `${req.headers.get("origin") || "http://localhost:5173"}/affiliates?success=true`,
          type: "account_onboarding"
        })
      });

      if (!linkResponse.ok) {
        throw new Error("Failed to create Stripe account link: " + await linkResponse.text());
      }
      
      const linkData = await linkResponse.json();

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Stripe Connect onboarding initiated", 
        url: linkData.url,
        stripe_account_id: accountData.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "disconnect") {
      const { stripeAccountId } = payload || {};
      if (!stripeAccountId) {
        throw new Error("Missing stripeAccountId for disconnect");
      }

      // Deauthorize or delete the connected account (usually deleting for Express/Custom accounts in testing, but rejecting in prod)
      const response = await fetch(`https://api.stripe.com/v1/accounts/${stripeAccountId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${STRIPE_SECRET_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect Stripe account: " + await response.text());
      }

      return new Response(JSON.stringify({ success: true, message: "Stripe Connect account disconnected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Stripe Payouts error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
