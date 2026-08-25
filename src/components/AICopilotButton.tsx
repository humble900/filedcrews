import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Keyboard, 
  Sparkles, 
  Loader2, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  Copy, 
  Check, 
  RefreshCw,
  Wand2,
  FileText,
  Package,
  Clock,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AICopilotButtonProps {
  jobId?: string;
  companyId?: string;
  onCopilotComplete?: (data: any) => void;
}

export const AICopilotButton: React.FC<AICopilotButtonProps> = ({ 
  jobId, 
  companyId, 
  onCopilotComplete 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"voice" | "write">("voice");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          toast.error("Microphone permission denied. Switching to writing mode.");
          setMode("write");
        } else if (event.error === "no-speech") {
          // Keep listening or allow retry
        } else {
          toast.error(`Voice error: ${event.error}. You can type your request.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (!speechSupported) {
      toast.error("Speech recognition not supported in this browser. Please use writing mode.");
      setMode("write");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      }
    } catch (err: any) {
      console.warn("Recognition already started or error:", err);
    }
  };

  const stopListening = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setAiResponse(null);
    if (mode === "voice" && speechSupported) {
      setTimeout(() => startListening(), 400);
    }
  };

  const handleClose = () => {
    stopListening();
    setIsOpen(false);
  };

  const handleModeSwitch = (newMode: "voice" | "write") => {
    if (newMode === "write") {
      stopListening();
    } else if (newMode === "voice" && speechSupported) {
      setTimeout(() => startListening(), 200);
    }
    setMode(newMode);
  };

  const handleQuickPrompt = (promptText: string) => {
    setTranscript((prev) => (prev ? `${prev}. ${promptText}` : promptText));
  };

  const handleProcess = async () => {
    if (!transcript.trim()) {
      toast.error("Please speak or write your request first.");
      return;
    }

    stopListening();
    setIsProcessing(true);
    setAiResponse(null);

    try {
      // 1. Resolve Company ID if not passed
      let resolvedCompanyId = companyId;
      if (!resolvedCompanyId) {
        const { data: staffData } = await supabase
          .from("staff_profiles")
          .select("company_id")
          .limit(1)
          .maybeSingle();
        resolvedCompanyId = staffData?.company_id;
      }

      if (!resolvedCompanyId) {
        // Fallback to companies query
        const { data: comp } = await supabase.from("companies").select("id").limit(1).maybeSingle();
        resolvedCompanyId = comp?.id;
      }

      if (!resolvedCompanyId) {
        throw new Error("Unable to resolve company workspace.");
      }

      // 2. Call Edge Function ai_copilot
      const { data, error } = await supabase.functions.invoke("ai_copilot", {
        body: {
          prompt: transcript.trim(),
          companyId: resolvedCompanyId,
          jobId: jobId || undefined,
        },
      });

      if (error) throw error;

      if (data?.success || data?.message) {
        const reply = data.message || "Summary processed successfully by Field Copilot.";
        setAiResponse(reply);
        toast.success("AI Copilot request processed!");
        if (onCopilotComplete) {
          onCopilotComplete(data.generatedData || { summary: reply });
        }
      } else {
        throw new Error(data?.error || "AI Copilot did not return a response.");
      }
    } catch (err: any) {
      console.error("AI Copilot error:", err);
      toast.error(err.message || "Failed to process AI Copilot request.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyResponse = () => {
    if (aiResponse) {
      navigator.clipboard.writeText(aiResponse);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleOpen}
        aria-label="Open Field AI Copilot"
        className="relative group flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-xl hover:shadow-indigo-500/25 active:scale-95 transition-all duration-200"
      >
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
        </span>
        <Sparkles className="h-6 w-6 transition-transform group-hover:rotate-12" />
      </button>

      {/* Modern Slide-Up Copilot Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => (!open ? handleClose() : setIsOpen(true))}>
        <DialogContent className="sm:max-w-md bg-background border-border/80 p-0 overflow-hidden rounded-3xl shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-b from-indigo-500/10 via-background to-background p-5 pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-extrabold flex items-center gap-1.5">
                    Field AI Copilot <span className="text-xs font-bold text-indigo-500">Mila</span>
                  </DialogTitle>
                  <DialogDescription className="text-[11px] text-muted-foreground">
                    Dictate field voice notes or write instructions to generate job logs.
                  </DialogDescription>
                </div>
              </div>

              {/* Mode Toggle Switcher */}
              <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/50">
                <button
                  type="button"
                  onClick={() => handleModeSwitch("voice")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    mode === "voice"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mic className="h-3 w-3" /> Voice
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch("write")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    mode === "write"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Keyboard className="h-3 w-3" /> Write
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* VOICE MODE INTERFACE */}
            {mode === "voice" && (
              <div className="flex flex-col items-center justify-center py-2 space-y-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`h-20 w-20 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg ${
                      isListening
                        ? "bg-rose-500 hover:bg-rose-600 scale-105"
                        : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
                    }`}
                  >
                    {isListening ? (
                      <Mic className="h-9 w-9 animate-pulse" />
                    ) : (
                      <MicOff className="h-8 w-8 opacity-80" />
                    )}
                  </button>

                  {/* Pulsing Ripple Wave */}
                  {isListening && (
                    <span
                      className="absolute inset-0 rounded-full bg-rose-500 opacity-30 animate-ping pointer-events-none"
                      style={{ animationDuration: "1.6s" }}
                    />
                  )}
                </div>

                <div className="text-center space-y-0.5">
                  <p className="text-xs font-extrabold text-foreground">
                    {isListening ? "Listening... Speak naturally" : "Tap microphone to record voice"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isListening
                      ? "Speech is transcribing below in real-time"
                      : "Speak parts replaced, hours, or diagnostic summary"}
                  </p>
                </div>
              </div>
            )}

            {/* LIVE TRANSCRIPT / WRITING TEXTAREA */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  {mode === "voice" ? <Mic className="h-3 w-3 text-indigo-500" /> : <Keyboard className="h-3 w-3 text-indigo-500" />}
                  {mode === "voice" ? "Live Voice Transcript" : "Field Request / Notes"}
                </label>
                {transcript && (
                  <button
                    type="button"
                    onClick={() => setTranscript("")}
                    className="text-[10px] font-bold text-muted-foreground hover:text-rose-500 transition-colors"
                  >
                    Clear Text
                  </button>
                )}
              </div>

              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={
                  mode === "voice"
                    ? isListening
                      ? "Your words will appear here as you speak..."
                      : "Tap the mic above and explain what you did or need..."
                    : "e.g. Replaced leaking valve, tested pressure to 75 PSI, customer approved inspection..."
                }
                className="min-h-[100px] text-sm bg-muted/25 border-border/60 rounded-2xl resize-none focus-visible:ring-indigo-500 leading-relaxed"
              />
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Action Prompts</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Draft Work Summary", text: "Generate a professional work summary with completed steps and testing results." },
                  { label: "Log Parts & Materials", text: "Record the replacement parts used and recommend billing line items." },
                  { label: "Report Blocked Issue", text: "Log an obstruction and create a note for the dispatcher regarding site delay." },
                  { label: "Recommend Maintenance", text: "Suggest preventive maintenance schedule and seasonal follow-up." }
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleQuickPrompt(chip.text)}
                    className="text-[10px] font-semibold bg-muted/60 hover:bg-indigo-500/10 hover:text-indigo-600 border border-border/50 rounded-full px-2.5 py-1 transition-colors text-left"
                  >
                    + {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Response Panel */}
            {aiResponse && (
              <div className="p-4 rounded-2xl bg-indigo-500/[0.07] border border-indigo-500/20 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI Copilot Result
                  </span>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={handleCopyResponse}
                    className="h-6 text-[10px] gap-1 px-2 text-indigo-600 hover:text-indigo-700"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
              </div>
            )}
          </div>

          {/* Dialog Action Footer */}
          <div className="p-4 bg-muted/30 border-t border-border/40 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="rounded-xl text-xs font-semibold"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleProcess}
              disabled={isProcessing || !transcript.trim()}
              className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm min-w-[130px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> Execute Request
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AICopilotButton;
