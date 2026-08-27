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
  Briefcase,
  Lock,
  Zap,
  CreditCard,
  KeyRound,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface AICopilotButtonProps {
  jobId?: string;
  companyId?: string;
  onCopilotComplete?: (data: any) => void;
}

type GateState = 
  | { type: "loading" }
  | { type: "ready"; creditsRemaining: number; creditsLimit: number }
  | { type: "upgrade_required" }
  | { type: "credits_exhausted"; creditsUsed: number; creditsLimit: number; resetsAt: string };

export const AICopilotButton: React.FC<AICopilotButtonProps> = ({ 
  jobId, 
  companyId, 
  onCopilotComplete 
}) => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"voice" | "write">("voice");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [gateState, setGateState] = useState<GateState>({ type: "loading" });

  const recognitionRef = useRef<any>(null);

  // ─── Pre-flight: check tier + credits on open ──────────────────────────────
  const checkAccess = async () => {
    setGateState({ type: "loading" });
    try {
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
        const { data: comp } = await supabase.from("companies").select("id").limit(1).maybeSingle();
        resolvedCompanyId = comp?.id;
      }

      if (!resolvedCompanyId) {
        setGateState({ type: "upgrade_required" });
        return;
      }

      // Check tier from local company context first (fast path)
      const tier = company?.subscription_tier || "free_trial";
      const PAID_TIERS = new Set(["growth", "founding_partner", "Founding Partner", "enterprise"]);
      
      // Check if company has a BYOK key
      const { data: byokCheck } = await (supabase as any)
        .from("api_keys")
        .select("id")
        .eq("company_id", resolvedCompanyId)
        .eq("provider", "openai")
        .maybeSingle();
      
      const hasByok = !!byokCheck?.id;
      
      if (!PAID_TIERS.has(tier) && !hasByok) {
        setGateState({ type: "upgrade_required" });
        return;
      }

      // Fetch credit state from DB
      const { data: companyData } = await (supabase as any)
        .from("companies")
        .select("ai_credits_monthly_limit, ai_credits_used, ai_credits_bonus, ai_credits_reset_at")
        .eq("id", resolvedCompanyId)
        .single();

      if (companyData) {
        const total = (companyData.ai_credits_monthly_limit || 0) + (companyData.ai_credits_bonus || 0);
        const remaining = total - (companyData.ai_credits_used || 0);
        
        if (!hasByok && remaining <= 0) {
          setGateState({
            type: "credits_exhausted",
            creditsUsed: companyData.ai_credits_used || 0,
            creditsLimit: total,
            resetsAt: companyData.ai_credits_reset_at || "",
          });
        } else {
          setGateState({
            type: "ready",
            creditsRemaining: hasByok ? -1 : remaining,
            creditsLimit: hasByok ? -1 : total,
          });
        }
      } else {
        setGateState({ type: "ready", creditsRemaining: -1, creditsLimit: -1 });
      }
    } catch {
      // If we can't check, allow through — the edge function will gate
      setGateState({ type: "ready", creditsRemaining: -1, creditsLimit: -1 });
    }
  };

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
    checkAccess();
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

      // Handle gated responses from edge function
      if (data?.gated) {
        if (data.reason === "upgrade_required") {
          setGateState({ type: "upgrade_required" });
        } else if (data.reason === "credits_exhausted") {
          setGateState({
            type: "credits_exhausted",
            creditsUsed: data.creditsUsed,
            creditsLimit: data.creditsLimit,
            resetsAt: data.resetsAt || "",
          });
        }
        return;
      }

      if (data?.success || data?.message) {
        const reply = data.message || "Summary processed successfully by Field Copilot.";
        setAiResponse(reply);
        toast.success("AI Copilot request processed!");

        // Update credit state
        if (data.creditsRemaining !== undefined && data.creditsLimit !== undefined) {
          setGateState({
            type: "ready",
            creditsRemaining: data.creditsRemaining,
            creditsLimit: data.creditsLimit,
          });
        }

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

  const formatResetDate = (dateStr: string) => {
    if (!dateStr) return "next month";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "next month";
    }
  };

  // ─── Gated UI Panels ────────────────────────────────────────────────────────
  const renderUpgradeRequired = () => (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-5">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
        <Lock className="h-8 w-8 text-amber-600" />
      </div>
      <div className="space-y-2">
        <h3 className="text-base font-extrabold text-foreground">Upgrade to Unlock Mila AI</h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
          The AI Copilot is available on paid plans. Upgrade your subscription to get AI-powered work summaries, diagnostics, and field assistance.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <Button
          className="w-full h-11 font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl gap-2 shadow-lg"
          onClick={() => { handleClose(); navigate("/ai-pricing"); }}
        >
          <Zap className="h-4 w-4" /> Upgrade Plan
        </Button>
        <Button
          variant="outline"
          className="w-full h-10 font-semibold rounded-xl gap-2 text-xs"
          onClick={() => { handleClose(); navigate("/settings"); }}
        >
          <KeyRound className="h-3.5 w-3.5" /> Or Add Your Own API Key
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Plans start at $29/month with 200 AI credits included.
      </p>
    </div>
  );

  const renderCreditsExhausted = () => {
    const gs = gateState as Extract<GateState, { type: "credits_exhausted" }>;
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-5">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-red-500/20 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-rose-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-extrabold text-foreground">AI Credits Exhausted</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            Your company has used all <span className="font-bold text-foreground">{gs.creditsLimit}</span> AI credits this month. Credits reset on <span className="font-bold text-foreground">{formatResetDate(gs.resetsAt)}</span>.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button
            className="w-full h-11 font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl gap-2 shadow-lg"
            onClick={() => { handleClose(); navigate("/ai-pricing"); }}
          >
            <CreditCard className="h-4 w-4" /> Buy More Credits
          </Button>
          <Button
            variant="outline"
            className="w-full h-10 font-semibold rounded-xl gap-2 text-xs"
            onClick={() => { handleClose(); navigate("/settings"); }}
          >
            <KeyRound className="h-3.5 w-3.5" /> Add Your Own API Key (Unlimited)
          </Button>
          <Button
            variant="ghost"
            className="w-full h-9 font-semibold rounded-xl gap-2 text-xs text-muted-foreground"
            onClick={() => { handleClose(); navigate("/ai-pricing"); }}
          >
            <ArrowUpRight className="h-3.5 w-3.5" /> Upgrade for More Monthly Credits
          </Button>
        </div>
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1">
            <span>Credits Used</span>
            <span>{gs.creditsUsed} / {gs.creditsLimit}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
      </div>
    );
  };

  // ─── Credits Badge ───────────────────────────────────────────────────────────
  const renderCreditsBadge = () => {
    if (gateState.type !== "ready") return null;
    const gs = gateState;
    if (gs.creditsRemaining === -1) {
      return (
        <Badge variant="outline" className="text-[9px] font-bold text-emerald-600 border-emerald-200 bg-emerald-50 gap-1">
          <KeyRound className="h-2.5 w-2.5" /> BYOK — Unlimited
        </Badge>
      );
    }
    const pct = gs.creditsLimit > 0 ? ((gs.creditsLimit - gs.creditsRemaining) / gs.creditsLimit) * 100 : 0;
    return (
      <Badge 
        variant="outline" 
        className={`text-[9px] font-bold gap-1 ${pct > 80 ? "text-amber-600 border-amber-200 bg-amber-50" : "text-muted-foreground border-border bg-muted/30"}`}
      >
        <Zap className="h-2.5 w-2.5" /> {gs.creditsRemaining} credits left
      </Badge>
    );
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

              {/* Credits badge + Mode Toggle */}
              <div className="flex flex-col items-end gap-1.5">
                {renderCreditsBadge()}
                {gateState.type === "ready" && (
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
                )}
              </div>
            </div>
          </div>

          {/* ─── GATED STATES ─── */}
          {gateState.type === "loading" && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          )}

          {gateState.type === "upgrade_required" && renderUpgradeRequired()}
          {gateState.type === "credits_exhausted" && renderCreditsExhausted()}

          {/* ─── READY STATE: Normal Copilot UI ─── */}
          {gateState.type === "ready" && (
            <>
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
            </>
          )}

          {/* Footer for gated states */}
          {(gateState.type === "upgrade_required" || gateState.type === "credits_exhausted") && (
            <div className="p-4 bg-muted/30 border-t border-border/40 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="rounded-xl text-xs font-semibold"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AICopilotButton;
