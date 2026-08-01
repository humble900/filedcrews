import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AIIntent = {
  action: "create_project" | "unknown";
  customerName?: string;
  customerAddress?: string;
  projectDescription?: string;
  quoteAmount?: number;
  teamRequirement?: {
    role: string;
    count: number;
  };
};

export function useAIOperator(companyId: string | undefined) {
  const [isProcessing, setIsProcessing] = useState(false);

  const executeCommand = async (prompt: string): Promise<{ projectId?: string; success: boolean; message: string }> => {
    if (!companyId) throw new Error("No company ID");
    
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai_copilot", {
        body: { prompt, companyId }
      });

      if (error) {
        throw new Error(error.message || "Failed to reach AI Copilot.");
      }

      return data as { success: boolean; projectId?: string; message: string };

    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message || "An unexpected error occurred." };
    } finally {
      setIsProcessing(false);
    }
  };

  return { executeCommand, isProcessing };
}
