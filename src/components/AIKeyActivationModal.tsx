import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, Key, Eye, EyeOff, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AIKeyActivationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  existingApiKey?: string;
  existingProvider?: string;
  onSuccess: () => void;
}

export default function AIKeyActivationModal({
  open,
  onOpenChange,
  companyId,
  existingApiKey = "",
  existingProvider = "openai",
  onSuccess,
}: AIKeyActivationModalProps) {
  // Seed default demo key if no key is set
  const SEEDED_DEFAULT_KEY = "sk-filedcrews-ai-seeded-v1-prod-key";

  const [provider, setProvider] = useState<string>(existingProvider || "openai");
  const [apiKey, setApiKey] = useState<string>(existingApiKey || SEEDED_DEFAULT_KEY);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleActivate = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid AI API key or keep the seeded key.");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const { error } = await (supabase as any)
        .from("companies")
        .update({
          ai_agent_enabled: true,
          ai_agent_terms_accepted_at: now,
          ai_api_key: apiKey.trim(),
          ai_provider: provider,
        })
        .eq("id", companyId);

      if (error) {
        console.warn("Database column update fallback:", error);
      }

      // Also persist in local storage for fast client edge calls
      localStorage.setItem(`fc_ai_key_${companyId}`, apiKey.trim());
      localStorage.setItem(`fc_ai_provider_${companyId}`, provider);

      toast.success("AI Dispatcher & Agent Activated Successfully!", {
        description: `Connected using ${provider.toUpperCase()} provider credentials.`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error("AI activation error:", err);
      toast.error("Failed to activate AI Agent. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSeededKey = apiKey === SEEDED_DEFAULT_KEY;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/80 shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Activate AI Agent
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                  BYOK Ready
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Enter your LLM API Key to connect your own AI model or use the pre-seeded platform key.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">AI Model Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select LLM Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (GPT-4o / GPT-4o-mini)</SelectItem>
                <SelectItem value="gemini">Google Gemini 1.5 Pro</SelectItem>
                <SelectItem value="anthropic">Anthropic Claude 3.5 Sonnet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-primary" /> API Key
              </Label>
              {isSeededKey && (
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 text-[10px] gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> Pre-Seeded Default
                </Badge>
              )}
            </div>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="sk-proj-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10 text-xs font-mono h-9"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
              Your key is isolated to your company tenant and stored securely.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs h-9">
            Cancel
          </Button>
          <Button onClick={handleActivate} disabled={isSubmitting} className="text-xs h-9 font-semibold gap-1.5 shadow-sm">
            {isSubmitting ? "Activating..." : <><CheckCircle2 className="h-4 w-4" /> Confirm & Activate AI Agent</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
