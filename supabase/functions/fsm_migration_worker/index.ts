import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fetch from actual FSM providers
const fetchCustomers = async (provider: string, page: number, apiKey: string) => {
  if (provider === "ServiceTitan") {
    // ServiceTitan typically requires a tenant ID which would be parsed or passed. 
    // Here we assume apiKey is a base64 encoded string or a bearer token that also identifies the tenant
    const response = await fetch(`https://api.servicetitan.io/crm/v2/tenant/0/customers?page=${page}&pageSize=50`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) throw new Error(`ServiceTitan API Error: ${await response.text()}`);
    const result = await response.json();
    
    return {
      data: result.data.map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        email: c.email,
        phone: c.contacts?.[0]?.value || ""
      })),
      hasMore: result.hasMore,
      total: result.totalCount || 100
    };
  } else if (provider === "Housecall Pro") {
    const response = await fetch(`https://api.housecallpro.com/customers?page=${page}&per_page=50`, {
      method: "GET",
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Accept": "application/json"
      }
    });
    if (!response.ok) throw new Error(`Housecall Pro API Error: ${await response.text()}`);
    const result = await response.json();
    
    return {
      data: result.customers.map((c: any) => ({
        id: c.id.toString(),
        name: `${c.first_name} ${c.last_name}`,
        email: c.email,
        phone: c.mobile_number || c.home_number || ""
      })),
      hasMore: page < (result.total_pages || 1),
      total: result.total_count || 100
    };
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { migration_task_id, company_id, provider_name, api_key } = await req.json();

    if (!migration_task_id || !company_id || !provider_name) {
      throw new Error("Missing required parameters: migration_task_id, company_id, provider_name");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update task to in_progress
    await supabaseAdmin
      .from("migration_tasks")
      .update({ status: 'in_progress' })
      .eq("id", migration_task_id);

    console.log(`Starting FSM migration for ${provider_name} (Task: ${migration_task_id})`);

    // In a real scenario, you'd use api_key to authenticate against ServiceTitan/Housecall Pro
    let page = 1;
    let hasMore = true;
    let totalSynced = 0;
    
    while (hasMore) {
      console.log(`Fetching page ${page} from ${provider_name}...`);
      const { data: externalCustomers, hasMore: more, total } = await fetchCustomers(provider_name, page, api_key);
      hasMore = more;

      if (page === 1) {
        await supabaseAdmin
          .from("migration_tasks")
          .update({ total_records: total })
          .eq("id", migration_task_id);
      }

      if (externalCustomers.length > 0) {
        // Map to our DB schema
        const mappedCustomers = externalCustomers.map((c) => ({
          company_id: company_id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          external_source: provider_name,
          external_id: c.id
        }));

        // Robust Bulk UPSERT using the new uniqueness constraint to ensure idempotency
        const { error: upsertError } = await supabaseAdmin
          .from("customers")
          .upsert(mappedCustomers, { 
            onConflict: 'company_id, external_source, external_id',
            ignoreDuplicates: false // We want to update them if they changed
          });

        if (upsertError) {
          throw new Error(`Failed to upsert page ${page}: ${upsertError.message}`);
        }

        totalSynced += externalCustomers.length;

        // Update progress in DB so UI can reflect it
        await supabaseAdmin
          .from("migration_tasks")
          .update({ synced_records: totalSynced })
          .eq("id", migration_task_id);
      }

      page++;
    }

    // Mark as completed
    await supabaseAdmin
      .from("migration_tasks")
      .update({ status: 'completed' })
      .eq("id", migration_task_id);

    console.log(`Migration completed for task ${migration_task_id}. Total synced: ${totalSynced}`);

    return new Response(JSON.stringify({ success: true, synced: totalSynced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Migration Worker Error:", error.message);
    
    // Attempt to log failure in DB
    try {
      const { migration_task_id } = await req.clone().json();
      if (migration_task_id) {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabaseAdmin
          .from("migration_tasks")
          .update({ status: 'failed', error_log: error.message })
          .eq("id", migration_task_id);
      }
    } catch (e) {
      // Ignore inner error
    }

    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
