import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Users, Circle, Eye, EyeOff, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AuthPageProps {
  onSignIn: (email: string, password: string) => Promise<{ error: any }>;
  onSignUp: (email: string, password: string) => Promise<{ error: any }>;
}

type ViewState = "auth" | "forgot" | "email-sent";

const AuthPage = ({ onSignIn, onSignUp }: AuthPageProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [view, setView] = useState<ViewState>("auth");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const { error } = await onSignIn(email, password);
    if (error) toast.error(error.message || "Authentication failed");
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const { error } = await onSignUp(email, password);
    if (error) toast.error(error.message || "Sign up failed");
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your email address");
      return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setView("email-sent");
    }
  };

  const renderForgotPassword = () => (
    <Card className="card-shadow-lg border-border/50">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>
          Enter your email and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="you@company.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={resetLoading}>
            {resetLoading ? (
              <>
                <Mail className="mr-2 h-4 w-4 animate-pulse" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Reset Link
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm text-muted-foreground"
            onClick={() => setView("auth")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderEmailSent = () => (
    <Card className="card-shadow-lg border-border/50">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
        <CardDescription className="text-base">
          We've sent a password reset link to <span className="font-medium text-foreground">{forgotEmail}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
          <p>Click the link in the email to set a new password.</p>
          <p>If you don't see it, check your spam folder.</p>
          <p>The link expires in 1 hour.</p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setView("auth");
            setForgotEmail("");
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sign In
        </Button>
        <Button
          variant="ghost"
          className="w-full text-sm text-muted-foreground"
          onClick={async () => {
            setResetLoading(true);
            const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
              redirectTo: `${window.location.origin}/reset-password`,
            });
            setResetLoading(false);
            if (error) toast.error(error.message);
            else toast.success("Reset email sent again. Check your inbox.");
          }}
          disabled={resetLoading}
        >
          {resetLoading ? "Sending..." : "Didn't receive it? Send again"}
        </Button>
      </CardContent>
    </Card>
  );

  const renderAuthCard = () => (
    <Card className="card-shadow-lg border-border/50">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Get Started</CardTitle>
        <CardDescription>
          Sign in to your account or create a new one
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" name="email" type="email" placeholder="you@company.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Input id="signin-password" name="password" type={showSignInPassword ? "text" : "password"} placeholder="••••••••" required />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowSignInPassword(!showSignInPassword)}>
                    {showSignInPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full text-sm text-muted-foreground"
                onClick={() => {
                  const form = document.getElementById("signin-email") as HTMLInputElement;
                  setForgotEmail(form?.value || "");
                  setView("forgot");
                }}
              >
                Forgot password?
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" name="email" type="email" placeholder="you@company.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input id="signup-password" name="password" type={showSignUpPassword ? "text" : "password"} placeholder="••••••••" minLength={6} required />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowSignUpPassword(!showSignUpPassword)}>
                    {showSignUpPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="w-full flex items-center justify-between px-6 py-3 border-b border-border/40 bg-background/80 backdrop-blur-sm z-10">
        <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <MapPin className="h-5 w-5" />
          <span className="font-bold text-lg">Staff Tracker</span>
        </Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Home
        </Link>
      </header>

      <div className="flex-1 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-center items-center p-12 text-primary-foreground">
        <div className="max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <MapPin className="h-12 w-12" />
            <h1 className="text-3xl font-bold">Staff Tracker</h1>
          </div>
          <p className="text-xl opacity-90">Real-time location tracking for your field staff</p>
          <div className="space-y-4 pt-8">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 opacity-80" />
              <div>
                <h3 className="font-semibold">Manage Your Team</h3>
                <p className="text-sm opacity-80">Add and organise your staff members</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Circle className="h-8 w-8 opacity-80" />
              <div>
                <h3 className="font-semibold">Geofence Zones</h3>
                <p className="text-sm opacity-80">Set up location boundaries and get alerts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <MapPin className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Staff Tracker</h1>
          </div>

          {view === "auth" && renderAuthCard()}
          {view === "forgot" && renderForgotPassword()}
          {view === "email-sent" && renderEmailSent()}
        </div>
      </div>

      {/* Legal/help footer */}
      <footer className="py-4 px-6 text-center text-sm text-muted-foreground border-t border-border/40">
        <nav className="flex items-center justify-center gap-x-6">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/account-deletion" className="hover:text-foreground transition-colors">Account Deletion</Link>
        </nav>
      </footer>
      </div>
    </div>
  );
};

export default AuthPage;
