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
    const { provider, action, payload } = await req.json();

    if (action === "connect") {
      // In a real OAuth flow, this endpoint handles the callback and exchanges the authorization code for tokens
      const { code, redirectUri } = payload || {};
      
      const clientId = Deno.env.get("QUICKBOOKS_CLIENT_ID");
      const clientSecret = Deno.env.get("QUICKBOOKS_CLIENT_SECRET");
      
      if (!clientId || !clientSecret) {
        throw new Error("Missing QuickBooks API credentials in environment variables.");
      }

      if (code) {
        // Exchange code for token
        const authHeader = btoa(`${clientId}:${clientSecret}`);
        const tokenResponse = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${authHeader}`
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri
          })
        });

        if (!tokenResponse.ok) {
          const errText = await tokenResponse.text();
          throw new Error(`QuickBooks OAuth Error: ${errText}`);
        }

        const tokenData = await tokenResponse.json();
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Successfully connected to QuickBooks",
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Connect initiated, waiting for OAuth redirect"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "disconnect") {
      // Typically, you would revoke the token here using Intuit's revoke endpoint
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Successfully disconnected from provider"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Syncing logic for QuickBooks
    if (action === "sync_invoice") {
      const { accessToken, realmId, invoiceData } = payload;
      
      if (!accessToken || !realmId) {
        throw new Error("Missing access token or realm ID for QuickBooks API");
      }

      const qboBaseUrl = Deno.env.get("QBO_ENVIRONMENT") === "production" 
        ? "https://quickbooks.api.intuit.com" 
        : "https://sandbox-quickbooks.api.intuit.com";

      const response = await fetch(`${qboBaseUrl}/v3/company/${realmId}/invoice`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`QuickBooks API Error: ${errText}`);
      }

      const responseData = await response.json();
      return new Response(JSON.stringify({ success: true, data: responseData, message: "Successfully synced with accounting provider" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Unsupported action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error) {
    console.error("Accounting Sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
