import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2, Wand2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AICopilotButtonProps {
  jobId: string;
  onCopilotComplete: (data: any) => void;
}

export const AICopilotButton = ({ jobId, onCopilotComplete }: AICopilotButtonProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const toggleListen = () => {
    if (isListening) {
      // Stop listening and process
      setIsListening(false);
      processAudio();
    } else {
      // Start listening
      setIsListening(true);
      toast("AI Copilot is listening...", { icon: <Mic className="h-4 w-4 animate-pulse text-indigo-500" /> });
    }
  };

  const processAudio = async () => {
    setIsProcessing(true);
    toast.loading("Processing job summary...", { id: "ai-copilot" });

    try {
      // Send a predefined transcription of audio (or this could be real speech-to-text in future)
      const promptText = "The customer reported their AC was blowing warm air. I arrived, ran diagnostics, and found a faulty 45/5 dual run capacitor on the condensing unit. I replaced it with an OEM part. Everything is running fine now. Please generate an invoice for a replacement capacitor ($185) and the standard diagnostic fee ($89). Add notes about what I did and recommend a fall maintenance visit.";
      
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get the current company
      const { data: compData } = await supabase.from('companies').select('id').single();
      
      if (!compData?.id) throw new Error("No company found");

      const { data, error } = await supabase.functions.invoke("ai_copilot", {
        body: { 
          prompt: promptText, 
          companyId: compData.id, 
          jobId: jobId 
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        setShowSuccess(true);
        toast.success("Job summary processed successfully!", { id: "ai-copilot" });
        onCopilotComplete(data.generatedData || {});
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        throw new Error(data?.message || "Failed to process");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`AI Copilot Failed: ${err.message}`, { id: "ai-copilot" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={toggleListen}
      disabled={isProcessing}
      className={`relative rounded-full h-14 w-14 shadow-lg transition-all duration-300 ${
        isListening ? "bg-red-500 hover:bg-red-600 animate-pulse scale-110" : 
        showSuccess ? "bg-emerald-500 hover:bg-emerald-600" :
        "bg-indigo-600 hover:bg-indigo-700"
      }`}
    >
      {isProcessing ? (
        <Loader2 className="h-6 w-6 animate-spin text-white" />
      ) : showSuccess ? (
        <CheckCircle2 className="h-6 w-6 text-white" />
      ) : isListening ? (
        <Mic className="h-6 w-6 text-white" />
      ) : (
        <Wand2 className="h-6 w-6 text-white" />
      )}
      
      {/* Pulse ring effect when listening */}
      {isListening && (
        <span className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping" style={{ animationDuration: '1.5s' }} />
      )}
    </Button>
  );
};
