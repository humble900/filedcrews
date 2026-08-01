import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-request-id, x-twilio-signature, stripe-signature",
};

export interface Context {
  requestId: string;
  authHeader: string;
  user: any | null;
}

/**
 * Standardized response helper with CORS headers and Request ID tracking
 */
export function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  requestId?: string
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...(requestId ? { "X-Request-ID": requestId } : {}),
    },
  });
}

/**
 * Validates JWT bearer token and resolves authenticated user identity
 */
export async function authenticateCaller(req: Request): Promise<{
  user: any | null;
  error: string | null;
}> {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { user: null, error: "Missing or invalid Authorization header" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, error: "Supabase client credentials missing in environment" };
  }

  const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { authorization: authHeader } },
  });

  const {
    data: { user },
    error: authErr,
  } = await callerClient.auth.getUser();

  if (authErr || !user) {
    return { user: null, error: authErr?.message || "Unauthorized caller" };
  }

  return { user, error: null };
}

/**
 * Cryptographic HMAC SHA256 Webhook Verification Helper (Stripe / Standard Webhooks)
 */
export async function verifyHmacSha256(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBytes = new Uint8Array(
    signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );
  return await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    encoder.encode(payload)
  );
}
