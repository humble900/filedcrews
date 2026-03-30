import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin } from "lucide-react";
import { toast } from "sonner";

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
      toast.error("Prefix must be exactly 5 letters");
      return;
    }
    if (!/^[A-Za-z]{5}$/.test(prefix)) {
      toast.error("Prefix must be 5 letters only (A-Z)");
      return;
    }
    setLoading(true);
    try {
      const { error } = await onCreate(name.trim(), prefix.toUpperCase());
      if (error) {
        if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
          toast.error("This prefix is already taken. Choose a different one.");
        } else {
          toast.error(error.message || "Failed to create company");
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
          <MapPin className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary">Staff Tracker</h1>
        </div>

        <Card className="card-shadow-lg border-border/50">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl font-bold">Setup Your Company</CardTitle>
            </div>
            <CardDescription>
              Choose a 5-letter prefix. All staff usernames will start with this prefix.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="e.g. Acme Corporation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prefix">Staff Username Prefix (5 letters)</Label>
                <Input
                  id="prefix"
                  placeholder="e.g. ACMCO"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5))}
                  className="font-mono text-lg tracking-widest uppercase"
                  required
                  maxLength={5}
                />
                {prefix.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Staff usernames will look like: <span className="font-mono font-medium text-foreground">{prefix}{prefix.length === 5 ? "johndoe" : "..."}</span>
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading || prefix.length !== 5}>
                {loading ? "Creating…" : "Create Company"}
              </Button>
            </form>
            <p className="mt-4 text-center">
              <button
                type="button"
                onClick={onSignOut}
                className="text-sm text-muted-foreground hover:text-foreground"
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
