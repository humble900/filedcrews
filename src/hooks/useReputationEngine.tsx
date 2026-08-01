import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquareHeart } from "lucide-react";

export function useReputationEngine(companyId: string | undefined) {
  const [isProcessing, setIsProcessing] = useState(false);

  const analyzeSentiment = async (notes: string): Promise<number> => {
    try {
      const { data, error } = await supabase.functions.invoke("ai_copilot", {
        body: {
          prompt: `Analyze the sentiment of these job completion notes and return a score from 0.0 to 1.0, where 1.0 is extremely positive, 0.5 is neutral, and 0.0 is extremely negative. Return ONLY the number. Notes: "${notes}"`,
          companyId,
          bypassTools: true // Custom flag to just get raw response if we want
        }
      });
      if (error || !data?.response) throw error;
      const score = parseFloat(data.response);
      return isNaN(score) ? 0.6 : score;
    } catch (e) {
      console.warn("AI sentiment analysis failed, falling back to local regex:", e);
      const lowerNotes = notes.toLowerCase();
      if (lowerNotes.includes("happy") || lowerNotes.includes("great") || lowerNotes.includes("excellent")) return 0.9;
      if (lowerNotes.includes("angry") || lowerNotes.includes("upset") || lowerNotes.includes("complain")) return 0.2;
      return 0.6;
    }
  };

  const processJobCompletion = async (jobId: string, customerId: string, completionNotes: string) => {
    if (!companyId) return;
    
    setIsProcessing(true);
    try {
      // 1. Check if automations are enabled
      const { data: company } = await (supabase as any)
        .from("companies")
        .select("ai_settings")
        .eq("id", companyId)
        .single();
        
      const settings = (company?.ai_settings as any) || {};
      
      if (!settings.auto_request_reviews) {
        return; // Reputation automation is disabled
      }

      // 2. Analyze Sentiment
      const sentimentScore = await analyzeSentiment(completionNotes);
      const minScore = settings.minimum_sentiment_score || 0.8;

      if (sentimentScore >= minScore) {
        toast("Reputation Engine Triggered", {
          description: "Positive sentiment detected. Google Review SMS requested via Communication Hub.",
          icon: <MessageSquareHeart className="h-5 w-5 text-pink-500" />,
        });
        
        await supabase.functions.invoke("communication_hub", {
          body: {
            customer_id: customerId,
            job_id: jobId,
            content: "Hi there! Thank you for choosing us. If you had a great experience, we'd love it if you could leave us a quick review: https://g.page/r/example/review",
            channel_override: "sms"
          }
        });
      } else if (sentimentScore < 0.4) {
        // Poor sentiment - Alert management
        toast.error("Low Sentiment Detected", {
          description: "Notes indicate potential dissatisfaction. Added to win-back queue.",
        });
      }

    } catch (err: any) {
      console.error("Reputation Engine Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return { processJobCompletion, isProcessing };
}
