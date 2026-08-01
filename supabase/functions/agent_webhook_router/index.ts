import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // This webhook router handles incoming events from third party providers (Twilio, SendGrid, WhatsApp)
    // For this prototype, we expect a normalized payload or we parse based on known headers.
    
    let payload;
    let contentType = req.headers.get("content-type") || "";
    
    // Quick parse (handles simple json or URL encoded for twilio)
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      payload = Object.fromEntries(formData.entries());
    } else {
      payload = await req.json();
    }

    // Determine the source of the webhook
    // e.g. if it's Twilio SMS, we look for From, To, Body
    // if it's SendGrid Inbound Parse, we look for from, to, text
    let incomingText = "";
    let senderId = "";
    let triggerType = "";
    let toAddress = ""; // Used to identify which company it belongs to

    if (payload.SmsSid || payload.MessageSid) {
      // It's a Twilio SMS or WhatsApp
      incomingText = payload.Body;
      senderId = payload.From;
      toAddress = payload.To;
      triggerType = senderId.startsWith("whatsapp:") ? "webhook_whatsapp" : "webhook_sms";
    } else if (payload.dkim !== undefined || payload.email !== undefined) {
      // Very basic SendGrid/Email detection
      incomingText = payload.text || payload.html || payload.subject;
      senderId = payload.from;
      toAddress = payload.to;
      triggerType = "webhook_email";
    } else {
      // Fallback custom JSON payload
      incomingText = payload.message || payload.text;
      senderId = payload.from || payload.senderId;
      toAddress = payload.to || payload.companyId; 
      triggerType = payload.triggerType || "manual";
    }

    if (!incomingText) {
      throw new Error("Could not parse incoming message content.");
    }

    // Identify the company based on the 'To' address (e.g. phone number or email domain)
    // We assume there's a lookup table or field, but for now we search for an active custom agent
    // that matches this trigger_type. In a production system, you'd match the exact phone number/email.
    
    // NOTE: Multi-tenant safety: The webhook router is a trusted system entry point, 
    // but the underlying AI tool execution should use the Company ID to restrict RLS.
    
    // For this prototype, we'll try to find an active agent for this trigger type globally 
    // or rely on a specific route parameter / header if available.
    
    const companyId = req.headers.get("x-company-id") || payload.company_id;
    let agentQuery = supabaseAdmin
      .from("custom_agents")
      .select("*")
      .eq("trigger_type", triggerType)
      .eq("is_active", true);
      
    if (companyId) {
      agentQuery = agentQuery.eq("company_id", companyId);
    }

    const { data: agents, error: agentError } = await agentQuery;

    if (agentError || !agents || agents.length === 0) {
      console.log("No active Mila virtual coworker found for this trigger:", triggerType);
      return new Response(JSON.stringify({ success: true, message: "No agent configured." }), { headers: corsHeaders });
    }

    // We found the agent(s) that should respond. We'll pick the first one for now.
    const activeAgent = agents[0];
    
    console.log(`Routing incoming ${triggerType} from ${senderId} to Mila Agent: ${activeAgent.name}`);

    // Call the ai_copilot edge function internally to process the message 
    // We pass bypassTools=false to let the agent take action (like creating a work order)
    
    const { data: copilotRes, error: copilotError } = await supabaseAdmin.functions.invoke("ai_copilot", {
      body: {
        prompt: `INCOMING MESSAGE from ${senderId}:\n"${incomingText}"\n\nInstructions: Act as ${activeAgent.name}. System Prompt: ${activeAgent.system_prompt}`,
        companyId: activeAgent.company_id,
        bypassTools: false
      }
    });

    if (copilotError) {
      throw copilotError;
    }

    // Log the interaction
    await supabaseAdmin.from("audit_log").insert({
      company_id: activeAgent.company_id,
      action: `Mila (${activeAgent.name}) processed incoming ${triggerType}`,
      changed_by: `Mila Virtual Coworker`,
      table_name: "custom_agents",
      record_id: activeAgent.id,
      new_data: { incoming: incomingText, response: copilotRes }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Agent processed the webhook successfully.",
      agentAction: copilotRes
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Agent Webhook Router Error:", error.message);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 200, // Return 200 so Twilio/SendGrid don't retry endlessly on hard errors
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
