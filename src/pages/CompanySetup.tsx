import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CompanySetupProps {
  onCreate: (name: string, prefix: string) => Promise<{ data?: any; error: any }>;
  onSignOut: () => void;
}

const CompanySetup = ({ onCreate, onSignOut }: CompanySetupProps) => {
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prefix.length !== 5) {
      toast.error("Workspace tag must be exactly 5 letters");
      return;
    }
    if (!/^[A-Za-z]{5}$/.test(prefix)) {
      toast.error("Workspace tag must be 5 letters only (A-Z)");
      return;
    }
    setLoading(true);
    try {
      const { error } = await onCreate(name.trim(), prefix.toUpperCase());
      if (error) {
        if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
          toast.error("This workspace tag is already taken. Please choose another 5-letter tag.");
        } else {
          toast.error(error.message || "Failed to create workspace");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:p-8 bg-background">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <img src="/favicon.png" alt="FiledCrews" className="h-10 w-10 rounded-xl" />
          <h1 className="text-2xl font-bold text-primary tracking-tight">FiledCrews</h1>
        </div>

        <Card className="card-shadow-lg border-border/50">
          <CardHeader className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl font-bold">Setup Your Workspace</CardTitle>
            </div>
            <CardDescription className="text-xs leading-relaxed text-muted-foreground">
              Configure your organization and custom 5-letter workspace tag for team logins and job dispatches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name" className="text-xs font-bold uppercase tracking-wide">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="e.g. Paramount Constructors"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!prefix) {
                      const clean = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5);
                      setPrefix(clean.padEnd(Math.min(5, clean.length), "X"));
                    }
                  }}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Label htmlFor="prefix" className="text-xs font-bold uppercase tracking-wide">Workspace Tag</Label>
                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md shrink-0">
                      5 Letters
                    </span>
                  </div>
                  <span className={cn(
                    "text-xs font-mono font-bold px-2 py-0.5 rounded shrink-0",
                    prefix.length === 5 ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-amber-700 bg-amber-50 border border-amber-200"
                  )}>
                    {prefix.length}/5
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-muted-foreground select-none text-base">
                    @
                  </span>
                  <Input
                    id="prefix"
                    placeholder="PARAM"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5))}
                    className="font-mono text-base tracking-widest uppercase pl-8 h-11 rounded-xl font-bold"
                    required
                    maxLength={5}
                  />
                </div>

                {/* Conversational Live Preview & Guided Feedback Card */}
                <div className="p-3 bg-muted/50 border border-border/80 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      Sample Crew Login:
                    </span>
                    <span className="font-mono font-bold text-foreground bg-background border border-border/60 px-2 py-0.5 rounded-md">
                      @{prefix || "TAG"}_ALEX
                    </span>
                  </div>

                  {prefix.length > 0 && prefix.length < 5 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold pt-1 border-t border-border/60">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>Add {5 - prefix.length} more letter{5 - prefix.length === 1 ? "" : "s"} ({prefix.length}/5)</span>
                    </div>
                  )}

                  {prefix.length === 5 && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold pt-1 border-t border-border/60">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>Workspace tag locked: <strong className="font-mono text-emerald-800">@{prefix}</strong></span>
                    </div>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full font-bold h-11 rounded-xl" disabled={loading || prefix.length !== 5}>
                {loading ? "Creating Workspace…" : "Create Workspace"}
              </Button>
            </form>
            <p className="mt-4 text-center">
              <button
                type="button"
                onClick={onSignOut}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanySetup;
