import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
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
    if (prefix.length !== 3) {
      toast.error("Prefix must be exactly 3 letters");
      return;
    }
    if (!/^[A-Za-z]{3}$/.test(prefix)) {
      toast.error("Prefix must be 3 letters only (A-Z)");
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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Setup Your Company</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a 3-letter prefix. All staff usernames will start with this prefix.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Company Name</label>
            <Input
              placeholder="e.g. Acme Corporation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Staff Username Prefix (3 letters)</label>
            <Input
              placeholder="e.g. ACM"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3))}
              className="h-11 font-mono text-lg tracking-widest uppercase"
              required
              maxLength={3}
            />
            {prefix.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Staff usernames will look like: <span className="font-mono font-medium text-foreground">{prefix}{prefix.length === 3 ? "johndoe" : "..."}</span>
              </p>
            )}
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading || prefix.length !== 3}>
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
      </div>
    </div>
  );
};

export default CompanySetup;
