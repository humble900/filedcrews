import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";

const RECOVERY_TIMEOUT_MS = 15000;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsRecovery(true);
        setIsExpired(false);
      }
    });

    // Start timeout — if recovery event never fires, show error
    timerRef.current = setTimeout(() => {
      setIsExpired((prev) => {
        // Only expire if recovery hasn't already succeeded
        if (!isRecovery) return true;
        return prev;
      });
    }, RECOVERY_TIMEOUT_MS);

    return () => {
      subscription.unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message || "Failed to reset password");
      setIsLoading(false);
    } else {
      toast.success("Password updated successfully!");
      // Small delay so the user sees the success toast
      setTimeout(() => navigate("/"), 1500);
    }
  };

  // Expired / invalid link state
  if (!isRecovery && isExpired) {
    return (
      <>
        <SEO title="Reset Password" description="Reset your Staff Tracker password." path="/reset-password" noIndex />
        <div className="min-h-screen flex items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-primary">Staff Tracker</h1>
              </div>
              <CardTitle>Link Invalid or Expired</CardTitle>
              <CardDescription>We couldn't verify your password reset link.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This password reset link is invalid or has expired. Please request a new one.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link to="/auth">Request a New Reset Email</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth">Back to Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Verifying state (waiting for recovery event)
  if (!isRecovery) {
    return (
      <>
        <SEO title="Reset Password" description="Reset your Staff Tracker password." path="/reset-password" noIndex />
        <div className="min-h-screen flex items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-primary">Staff Tracker</h1>
              </div>
              <CardTitle>Verifying...</CardTitle>
              <CardDescription>Please wait while we verify your reset link.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Reset Password" description="Reset your Staff Tracker password." path="/reset-password" noIndex />
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="w-full max-w-md card-shadow-lg border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">Staff Tracker</h1>
            </div>
            <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ResetPassword;
