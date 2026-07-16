import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Shield, Loader2, Key } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

export default function SuperadminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in and verified admin, redirect straight to dashboard
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: adminCheck } = await supabase
          .from("platform_admins")
          .select("user_id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (adminCheck) {
          navigate("/superadmin");
        }
      }
    };
    checkExistingSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Sign in with password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("No user profile returned from auth service");
      }

      // 2. Query platform_admins to check if this user is a superadmin
      const { data: adminCheck, error: dbError } = await supabase
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (dbError) throw dbError;

      if (!adminCheck) {
        // Sign out immediately if not a platform admin
        await supabase.auth.signOut();
        throw new Error("Access Denied: Platform Administrator credentials required.");
      }

      toast.success("Administrator session verified successfully");
      navigate("/superadmin");

    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Platform Console Login — Secure Administrative Gateway"
        description="Secure gateway for authenticated platform superadministrators."
        path="/superadmin/login"
        noIndex
      />

      <div className="min-h-screen bg-[#060814] flex flex-col items-center justify-center p-4 font-sans select-none relative overflow-hidden">
        {/* Futuristic Grid / Ambient Effects */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

        <div className="w-full max-w-md bg-slate-950/60 border border-slate-900 backdrop-blur-2xl p-8 rounded-2xl shadow-2xl z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
              <Shield className="h-6 w-6 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Platform Admin Gateway</h2>
            <p className="text-xs text-indigo-400 font-medium uppercase tracking-widest">Secure Administrative Console</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Administrator Email</Label>
              <Input
                type="email"
                placeholder="admin@platform.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900/50 border-slate-850 text-white placeholder-slate-600 focus-visible:ring-indigo-500 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Security Keyphrase (Password)</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-900/50 border-slate-850 text-white placeholder-slate-600 focus-visible:ring-indigo-500 text-sm"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 border border-indigo-500/30 transition-colors shadow-lg shadow-indigo-600/10"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Key className="h-4 w-4" />
              )}
              Authenticate Session
            </Button>
          </form>

          <div className="text-center">
            <span className="text-[10px] text-slate-600 font-mono tracking-wider">
              IP CHECK AND CREDENTIAL AUDITING ENGAGED
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
