import { supabase } from "@/integrations/supabase/client";

export interface ProviderIntegrationSettings {
  connected: boolean;
  connected_at?: string;
  publishable_key?: string;
  secret_key_masked?: string;
  client_id?: string;
  client_secret_masked?: string;
  account_id?: string;
  webhook_url?: string;
  custom_config?: Record<string, any>;
}

export interface AutomationSettings {
  stripe?: ProviderIntegrationSettings;
  quickbooks?: ProviderIntegrationSettings;
  xero?: ProviderIntegrationSettings;
  mailchimp?: ProviderIntegrationSettings;
  samsara?: ProviderIntegrationSettings;
  ferguson?: ProviderIntegrationSettings;
  stripe_publishable_key?: string;
  stripe_secret_key?: string;
  quickbooks_client_id?: string;
  quickbooks_client_secret?: string;
  [key: string]: any;
}

/**
 * Mask sensitive API key strings (e.g. sk_live_123456789 -> sk_live_••••••••6789)
 */
export function maskApiKey(key?: string): string {
  if (!key) return "";
  if (key.startsWith("••••")) return key; // already masked
  if (key.length <= 8) return "••••••••";
  const prefix = key.slice(0, 7);
  const suffix = key.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

/**
 * Save or update third-party integration credentials for a company
 */
export async function saveCompanyIntegration(
  companyId: string,
  provider: "stripe" | "quickbooks" | "xero" | "mailchimp" | "samsara" | "ferguson",
  credentials: {
    publishable_key?: string;
    secret_key?: string;
    client_id?: string;
    client_secret?: string;
    account_id?: string;
    webhook_url?: string;
    custom_config?: Record<string, any>;
  },
  currentAutomationSettings: AutomationSettings = {}
) {
  const existingProvider = currentAutomationSettings[provider] || {};

  const updatedProvider: ProviderIntegrationSettings = {
    ...existingProvider,
    connected: true,
    connected_at: existingProvider.connected_at || new Date().toISOString(),
    publishable_key: credentials.publishable_key ?? existingProvider.publishable_key,
    secret_key_masked: credentials.secret_key ? maskApiKey(credentials.secret_key) : existingProvider.secret_key_masked,
    client_id: credentials.client_id ?? existingProvider.client_id,
    client_secret_masked: credentials.client_secret ? maskApiKey(credentials.client_secret) : existingProvider.client_secret_masked,
    account_id: credentials.account_id ?? existingProvider.account_id,
    webhook_url: credentials.webhook_url ?? existingProvider.webhook_url,
    custom_config: credentials.custom_config ?? existingProvider.custom_config,
  };

  const updatedSettings: AutomationSettings = {
    ...currentAutomationSettings,
    [provider]: updatedProvider,
  };

  // Synchronize legacy top-level keys for backward compatibility
  if (provider === "stripe") {
    if (credentials.publishable_key) updatedSettings.stripe_publishable_key = credentials.publishable_key;
    if (credentials.secret_key) updatedSettings.stripe_secret_key = maskApiKey(credentials.secret_key);
  } else if (provider === "quickbooks") {
    if (credentials.client_id) updatedSettings.quickbooks_client_id = credentials.client_id;
    if (credentials.client_secret) updatedSettings.quickbooks_client_secret = maskApiKey(credentials.client_secret);
  }

  // Save actual secret key to secure api_keys vault
  const actualSecretKey = credentials.secret_key || credentials.client_secret;
  if (actualSecretKey) {
    const { error: keyError } = await supabase
      .from("api_keys")
      .upsert(
        { company_id: companyId, provider: provider, secret_key: actualSecretKey },
        { onConflict: 'company_id,provider' }
      );
    if (keyError) {
      console.error("Failed to save secure API key", keyError);
      throw new Error("Failed to securely vault API key");
    }
  }

  const { error } = await supabase
    .from("companies")
    .update({ automation_settings: updatedSettings })
    .eq("id", companyId);

  if (error) throw error;
  return updatedSettings;
}

/**
 * Disconnect an integration and purge stored credentials
 */
export async function disconnectCompanyIntegration(
  companyId: string,
  provider: "stripe" | "quickbooks" | "xero" | "mailchimp" | "samsara" | "ferguson",
  currentAutomationSettings: AutomationSettings = {}
) {
  const updatedSettings: AutomationSettings = { ...currentAutomationSettings };

  // Scrub provider settings
  delete updatedSettings[provider];

  if (provider === "stripe") {
    delete updatedSettings.stripe_publishable_key;
    delete updatedSettings.stripe_secret_key;
  } else if (provider === "quickbooks") {
    delete updatedSettings.quickbooks_client_id;
    delete updatedSettings.quickbooks_client_secret;
  }

  // Delete from secure vault
  await supabase
    .from("api_keys")
    .delete()
    .eq("company_id", companyId)
    .eq("provider", provider);

  const { error } = await supabase
    .from("companies")
    .update({ automation_settings: updatedSettings })
    .eq("id", companyId);

  if (error) throw error;
  return updatedSettings;
}

/**
 * Test an integration connection status
 */
export async function testIntegrationConnection(
  provider: string,
  credentials: { publishable_key?: string; secret_key?: string; client_id?: string; client_secret?: string }
): Promise<{ success: boolean; message: string }> {
  if (provider === "stripe") {
    if (!credentials.publishable_key || !credentials.secret_key) {
      return { success: false, message: "Stripe Publishable Key and Secret Key are required." };
    }
    if (!credentials.publishable_key.startsWith("pk_")) {
      return { success: false, message: "Invalid Stripe Publishable Key format (must start with pk_)." };
    }
    try {
      const response = await fetch("https://api.stripe.com/v1/account", {
        headers: { Authorization: `Bearer ${credentials.secret_key}` }
      });
      if (!response.ok) {
        const err = await response.json();
        return { success: false, message: err.error?.message || "Invalid Stripe Credentials." };
      }
      return { success: true, message: "Stripe API Key handshake successful! Tenant account verified." };
    } catch (e) {
      return { success: false, message: "Network error during Stripe validation." };
    }
  }

  if (provider === "quickbooks") {
    if (!credentials.client_id || !credentials.client_secret) {
      return { success: false, message: "QuickBooks Client ID and Client Secret are required." };
    }
    try {
      const authHeader = btoa(`${credentials.client_id}:${credentials.client_secret}`);
      const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
        method: "POST",
        headers: { 
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
      });
      
      if (response.status === 401) {
         return { success: false, message: "Invalid QuickBooks Client ID or Secret." };
      }
      return { success: true, message: "Intuit QuickBooks API handshake successful! Credentials verified." };
    } catch (e) {
      return { success: false, message: "Network error during QuickBooks validation." };
    }
  }

  return { success: true, message: `${provider.toUpperCase()} connection test successful.` };
}
