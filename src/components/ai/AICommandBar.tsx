import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BrainCircuit, Loader2, Command } from "lucide-react";
import { useAIOperator } from "@/hooks/useAIOperator";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function AICommandBar() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const { company } = useAuth();
  const { executeCommand, isProcessing } = useAIOperator(company?.id);
  const navigate = useNavigate();

  // Listen for CMD+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Only render if enabled in settings
  const isEnabled = (company as any)?.ai_settings?.enable_command_bar === true;
  
  if (!isEnabled) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isProcessing) return;

    const result = await executeCommand(prompt);
    
    if (result.success && result.projectId) {
      toast.success("AI Orchestration Complete", { description: "Redirecting to drafted workspace..." });
      setOpen(false);
      setPrompt("");
      // Navigate to the project with the ai_draft query param
      navigate(`/projects/${result.projectId}?review=ai_draft`);
    } else {
      toast.error("Orchestration Failed", { description: result.message });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-indigo-500/30 shadow-2xl shadow-indigo-500/10" hideCloseButton>
          <form onSubmit={handleSubmit} className="flex flex-col relative">
            <div className="absolute left-4 top-4 text-indigo-500 flex items-center gap-2 font-bold text-sm">
              <BrainCircuit className="h-5 w-5 animate-pulse" />
              AI Command Center
            </div>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'Create a project for an electrical panel upgrade at 123 Main St, quote it for $2,500...'"
              className="w-full border-0 focus-visible:ring-0 h-24 pt-10 px-4 text-base bg-card resize-none"
              autoFocus
              disabled={isProcessing}
            />
            <div className="border-t border-border/50 bg-muted/30 px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 border border-border rounded px-1.5 py-0.5 bg-background shadow-sm">
                  <Command className="h-3 w-3" /> ↵
                </span>
                to execute
              </div>
              {isProcessing && (
                <div className="flex items-center gap-2 text-indigo-500 font-bold">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing intent & generating schema...
                </div>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
