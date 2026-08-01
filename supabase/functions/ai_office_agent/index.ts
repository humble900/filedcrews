import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.28.0";
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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const payload = await req.json();

    // -------------------------------------------------------------
    // Action: autonomous_booking
    // Expected to be called by an AI Telephony Provider (e.g. Vapi, Retell) 
    // after a successful conversation with a customer.
    // -------------------------------------------------------------
    if (action === "autonomous_booking") {
      const { tenant_id, customer_phone, customer_name, job_title, scheduled_start, notes } = payload;

      if (!tenant_id || !customer_phone) {
        throw new Error("Missing required fields: tenant_id, customer_phone");
      }

      // 1. Find or create customer
      let customerId;
      const { data: existingCust } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("company_id", tenant_id)
        .eq("phone", customer_phone)
        .limit(1);

      if (existingCust && existingCust.length > 0) {
        customerId = existingCust[0].id;
      } else {
        const { data: newCust, error: custError } = await supabaseAdmin
          .from("customers")
          .insert({
            company_id: tenant_id,
            name: customer_name || "Unknown AI Caller",
            phone: customer_phone,
            preferred_contact_method: "phone"
          })
          .select("id")
          .single();
          
        if (custError) throw custError;
        customerId = newCust.id;
      }

      // 2. Create the Job unassigned on the dispatch board
      const { data: newJob, error: jobError } = await supabaseAdmin
        .from("jobs")
        .insert({
          company_id: tenant_id,
          customer_id: customerId,
          title: job_title || "AI Auto-Booked Service Request",
          description: `Booked by AI Agent. Notes: ${notes}`,
          status: "Unassigned",
          start_time: scheduled_start || null,
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // 3. Log the interaction
      await supabaseAdmin.from("communications_log").insert({
        tenant_id: tenant_id,
        customer_id: customerId,
        job_id: newJob.id,
        channel: "phone",
        direction: "inbound",
        status: "received",
        content: `Call Summary: ${notes}`,
        metadata: { source: "ai_voice_agent" }
      });

      return new Response(JSON.stringify({ success: true, job: newJob }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -------------------------------------------------------------
    // Action: second_chance_leads
    // Called periodically or manually to scan cancelled jobs
    // -------------------------------------------------------------
    if (action === "second_chance_leads") {
      const { tenant_id } = payload;
      
      if (!tenant_id) throw new Error("Missing tenant_id");

      // Find recently cancelled jobs without a follow-up
      const { data: cancelledJobs } = await supabaseAdmin
        .from("jobs")
        .select("id, title, description, customer_id")
        .eq("company_id", tenant_id)
        .eq("status", "Cancelled")
        .limit(10);

      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not configured");
      }
      
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
      const flaggedOpportunities = [];

      for (const job of (cancelledJobs || [])) {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a sales recovery assistant for a field service company. Analyze cancelled job descriptions/notes and determine if it's a 'High Probability Win-Back'. Output JSON with format: { flag: string, reason: string, suggested_action: string }" },
              { role: "user", content: `Job Title: ${job.title}\nNotes: ${job.description}` }
            ],
            response_format: { type: "json_object" }
          });
          
          const result = JSON.parse(response.choices[0].message.content || "{}");
          flaggedOpportunities.push({
            job_id: job.id,
            customer_id: job.customer_id,
            flag: result.flag || "Review manually",
            reason: result.reason || "Analysis completed",
            suggested_action: result.suggested_action || "Follow up call"
          });
        } catch (e) {
          console.error(`Error analyzing job ${job.id}:`, e);
        }
      }

      return new Response(JSON.stringify({ success: true, opportunities: flaggedOpportunities }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action specified");

  } catch (error: any) {
    console.error("AI Office Agent Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
