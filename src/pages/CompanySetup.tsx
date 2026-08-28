import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
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
    if (prefix.length < 3 || prefix.length > 8) {
      toast.error("Workspace tag must be between 3 and 8 letters");
      return;
    }
    if (!/^[A-Za-z]{3,8}$/.test(prefix)) {
      toast.error("Workspace tag must be 3 to 8 letters only (A-Z)");
      return;
    }
    setLoading(true);
    try {
      const { error } = await onCreate(name.trim(), prefix.toUpperCase());
      if (error) {
        if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
          toast.error("This workspace tag is already taken. Please choose another tag.");
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
              Configure your organization and custom 3 to 8-letter workspace tag for team logins and job dispatches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  id="company-name"
                  placeholder="e.g. Paramount Constructors"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!prefix) {
                      const clean = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8);
                      setPrefix(clean);
                    }
                  }}
                  className="h-12 rounded-xl text-base placeholder:text-xs sm:placeholder:text-sm placeholder:text-muted-foreground/70 placeholder:font-normal"
                  required
                />
              </div>
              <div className="space-y-2.5 pt-1">
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Add a 3 to 8-letter code for your company. Your crew will use it when signing in.
                </p>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-muted-foreground select-none text-base">
                    @
                  </span>
                  <Input
                    id="prefix"
                    placeholder="e.g. PARAM"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8))}
                    className="font-mono text-base tracking-widest uppercase pl-8 h-12 rounded-xl font-bold placeholder:text-xs sm:placeholder:text-sm placeholder:text-muted-foreground/70 placeholder:font-normal"
                    required
                    maxLength={8}
                  />
                </div>

                {/* Compact Password-Strength Style Tag Completion Indicator */}
                {prefix.length > 0 && (
                  <div className="flex items-center justify-between text-[11px] font-semibold text-primary pt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className={cn("text-xs font-semibold", prefix.length >= 3 ? "text-primary" : "text-amber-600")}>
                      {prefix.length >= 3
                        ? `✓ ${prefix.length}-letter tag ready`
                        : `Add ${3 - prefix.length} more letter${3 - prefix.length === 1 ? "" : "s"} (min 3)`}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((seg) => {
                          const isFilled = prefix.length >= seg;
                          const isValid = prefix.length >= 3;
                          return (
                            <div
                              key={seg}
                              className={cn(
                                "h-1.5 w-2 rounded-full transition-all duration-300",
                                isFilled && isValid
                                  ? "bg-primary"
                                  : isFilled
                                  ? "bg-amber-400"
                                  : "bg-muted"
                              )}
                            />
                          );
                        })}
                      </div>
                      <span className="font-mono font-bold tracking-tight">
                        {prefix.length}/8
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full font-bold h-12 rounded-xl text-base" disabled={loading || prefix.length < 3 || prefix.length > 8}>
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
