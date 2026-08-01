import { supabase } from "@/integrations/supabase/client";
import { ServiceResult, ok, fail } from "../../services/types";

export interface FeatureFlag {
  id: string;
  company_id: string;
  feature_key: string;
  enabled: boolean;
  configuration?: Record<string, any>;
}

export class FeatureFlagService {
  /**
   * Check if a specific feature flag is enabled for a company
   */
  static async isFeatureEnabled(
    companyId: string,
    featureKey: string
  ): Promise<ServiceResult<boolean>> {
    try {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("enabled")
        .eq("company_id", companyId)
        .eq("feature_key", featureKey)
        .maybeSingle();

      if (error) return fail(error.message);
      return ok(data?.enabled ?? false);
    } catch (err: any) {
      return fail(err.message || "Failed to query feature flag");
    }
  }

  /**
   * Toggle or configure a feature flag for a tenant
   */
  static async setFeatureFlag(
    companyId: string,
    featureKey: string,
    enabled: boolean,
    configuration: Record<string, any> = {}
  ): Promise<ServiceResult<FeatureFlag>> {
    try {
      const { data, error } = await supabase
        .from("feature_flags")
        .upsert(
          {
            company_id: companyId,
            feature_key: featureKey,
            enabled,
            configuration,
          },
          { onConflict: "company_id,feature_key" }
        )
        .select("*")
        .single();

      if (error) return fail(error.message);
      return ok(data as FeatureFlag);
    } catch (err: any) {
      return fail(err.message || "Failed to set feature flag");
    }
  }
}
