import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { authorization: authHeader } } }
    );
    const { data: { user: callerUser } } = await callerClient.auth.getUser();
    if (!callerUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse incoming payload
    // Expected: { customer_id: UUID, job_id?: UUID, content: string, channel_override?: 'sms' | 'email' | 'whatsapp' | 'phone' }
    // Or for webhooks from Twilio/SendGrid: handle inbound messages and route them to the inbox
    const payload = await req.json();

    // 1. Handle Outbound Message Request
    if (payload.customer_id && payload.content) {
      const { customer_id, job_id, content, channel_override } = payload;
      
      // We still need the tenant context to save the log correctly.
      // Fetch customer to get tenant_id, contact info, and preferred method
      const { data: customer, error: custError } = await supabaseAdmin
        .from("customers")
        .select("company_id, preferred_contact_method, phone, email")
        .eq("id", customer_id)
        .single();
        
      if (custError || !customer) {
        throw new Error("Customer not found");
      }

      const channelToUse = channel_override || customer.preferred_contact_method || "email";
      let status = "pending";

      // -------------------------------------------------------------
      // Provider Agnostic Layer (SendGrid / Twilio / Bypass)
      // -------------------------------------------------------------
      try {
        if (channelToUse === "email") {
          console.log(`[Email] Sending to ${customer.email}: ${content}`);
          const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
          if (RESEND_API_KEY) {
            const response = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "OnSite Crew Manager Alerts <alerts@fflgoyftwtlzkekrrizc.supabase.co>",
                to: customer.email,
                subject: "Message from " + (customer.company_id || "Your Service Provider"),
                text: content,
              }),
            });
            if (!response.ok) throw new Error("Resend API error");
          }
          status = "sent";
        } else if (channelToUse === "sms" || channelToUse === "whatsapp") {
          console.log(`[${channelToUse.toUpperCase()}] Sending to ${customer.phone}: ${content}`);
          const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
          const TWILIO_AUTH = Deno.env.get("TWILIO_AUTH_TOKEN");
          const TWILIO_PHONE = Deno.env.get("TWILIO_PHONE_NUMBER");
          if (TWILIO_SID && TWILIO_AUTH && TWILIO_PHONE) {
            const formData = new URLSearchParams();
            formData.append("To", channelToUse === "whatsapp" ? `whatsapp:${customer.phone}` : customer.phone);
            formData.append("From", channelToUse === "whatsapp" ? `whatsapp:${TWILIO_PHONE}` : TWILIO_PHONE);
            formData.append("Body", content);

            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + btoa(`${TWILIO_SID}:${TWILIO_AUTH}`),
              },
              body: formData.toString(),
            });
            if (!response.ok) throw new Error("Twilio API error");
          }
          status = "sent";
        } else if (channelToUse === "phone") {
          // Trigger voice AI outbound call (e.g. Vapi, Retell, Bland AI)
          console.log(`[Voice AI] Initiating call to ${customer.phone}`);
          status = "pending";
        }
      } catch (providerError) {
        console.error("Provider failed:", providerError);
        status = "failed";
      }

      // Log the communication in the unified inbox
      const { data: logEntry, error: logError } = await supabaseAdmin
        .from("communications_log")
        .insert({
          tenant_id: customer.company_id,
          customer_id: customer_id,
          job_id: job_id || null,
          channel: channelToUse,
          direction: "outbound",
          content: content,
          status: status,
          metadata: { timestamp: new Date().toISOString() }
        })
        .select()
        .single();
        
      if (logError) throw logError;

      return new Response(JSON.stringify({ success: true, log: logEntry }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Handle Inbound Webhooks (e.g. Twilio SMS Reply)
    // Twilio payload comes as form-urlencoded, but if parsed via gateway as JSON:
    if (payload.SmsStatus && payload.From) {
      // Find customer by phone number
      const { data: match } = await supabaseAdmin
        .from("customers")
        .select("id, company_id")
        .eq("phone", payload.From)
        .limit(1);

      if (match && match.length > 0) {
        await supabaseAdmin
          .from("communications_log")
          .insert({
            tenant_id: match[0].company_id,
            customer_id: match[0].id,
            channel: "sms",
            direction: "inbound",
            content: payload.Body,
            status: "received",
            metadata: { twilio_message_sid: payload.MessageSid }
          });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid payload format");

  } catch (error: any) {
    console.error("Communication Hub Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
