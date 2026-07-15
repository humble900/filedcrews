import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, ArrowLeft, CheckCircle2, Lock, Shield, User, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface AuthPageProps {
  onSignIn: (email: string, password: string) => Promise<{ error: any }>;
  onSignUp: (email: string, password: string) => Promise<{ error: any }>;
}

type Mode = "signin" | "signup";
type ViewState = "auth" | "forgot" | "email-sent" | "signup-success";

const AuthPage = ({ onSignIn, onSignUp }: AuthPageProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(
    searchParams.get("tab") === "signup" ? "signup" : "signin"
  );

  useEffect(() => {
    if (mode === "signup") {
      navigate("/wizard");
    }
  }, [mode, navigate]);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<ViewState>("auth");
  const [forgotEmail, setForgotEmail] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const rawEmailOrUsername = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Automatically convert plain usernames or @usernames to staff emails
    let formattedEmail = rawEmailOrUsername.trim();
    if (formattedEmail.toLowerCase().endsWith("@internal.local")) {
      const usernamePart = formattedEmail.split("@")[0];
      formattedEmail = `${usernamePart.toUpperCase()}@internal.local`;
    } else if (!formattedEmail.includes("@")) {
      formattedEmail = `${formattedEmail.toUpperCase()}@internal.local`;
    } else if (formattedEmail.startsWith("@")) {
      formattedEmail = `${formattedEmail.slice(1).toUpperCase()}@internal.local`;
    }

    const { error } = await onSignIn(formattedEmail, password);
    if (error) {
      let friendlyMessage = error.message;
      if (error.message === "Invalid login credentials") {
        friendlyMessage = "Invalid username/email or password. Please try again.";
      }
      toast.error(friendlyMessage || "Authentication failed");
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const { error } = await onSignUp(email, password);
    if (error) {
      toast.error(error.message || "Sign up failed");
    } else {
      setSignupEmail(email);
      setView("signup-success");
    }
    setIsLoading(false);
  };

  const startResendCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
    <Card className="border-[#233558]/80 bg-[#14223c]/80 backdrop-blur-md shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Reset Password
        </CardTitle>
        <CardDescription className="text-slate-400">
          Enter your email to receive a password reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email" className="text-slate-300">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="forgot-email"
                type="email"
                placeholder="name@company.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="pl-10 bg-[#0c121f]/40 border-[#233558]/60 text-slate-100 focus-visible:ring-primary placeholder:text-slate-600"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium" disabled={resetLoading}>
            {resetLoading ? "Sending Link..." : "Send Reset Link"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
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
    <Card className="border-[#233558]/80 bg-[#14223c]/80 backdrop-blur-md shadow-2xl text-center">
      <CardHeader className="space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary animate-bounce" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-100">Check Your Email</CardTitle>
        <CardDescription className="text-slate-400">
          We've sent a password reset link to <span className="font-medium text-slate-200">{forgotEmail}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-[#0c121f]/40 border border-[#233558]/60 p-4 text-sm text-slate-400 space-y-2 text-left">
          <p>• Click the link in the email to set a new password.</p>
          <p>• Check your spam folder if you do not receive it.</p>
          <p>• The link will expire in 1 hour.</p>
        </div>
        <Button
          variant="outline"
          className="w-full border-[#233558]/60 text-slate-300 hover:bg-[#233558]/20 hover:text-slate-100"
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
          className="w-full text-xs text-slate-400 hover:text-slate-200"
          onClick={async () => {
            setResetLoading(true);
            const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
              redirectTo: `${window.location.origin}/reset-password`,
            });
            setResetLoading(false);
            if (error) {
              toast.error(error.message);
            } else {
              toast.success("Reset email sent again.");
              startResendCooldown();
            }
          }}
          disabled={resetLoading || resendCooldown > 0}
        >
          {resendCooldown > 0
            ? `Resend available in ${resendCooldown}s`
            : "Didn't receive it? Send again"}
        </Button>
      </CardContent>
    </Card>
  );

  const renderSignupSuccess = () => (
    <Card className="border-[#233558]/80 bg-[#14223c]/80 backdrop-blur-md shadow-2xl text-center">
      <CardHeader className="space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary animate-bounce" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-100">Check Your Email</CardTitle>
        <CardDescription className="text-slate-400">
          Verification link sent to <span className="font-medium text-slate-200">{signupEmail}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-[#0c121f]/40 border border-[#233558]/60 p-4 text-sm text-slate-400 text-left">
          Please click the confirmation link inside the verification email to activate your account.
        </div>
        <Button
          variant="outline"
          className="w-full border-[#233558]/60 text-slate-300 hover:bg-[#233558]/20 hover:text-slate-100"
          onClick={() => {
            setView("auth");
            setSignupEmail("");
            setMode("signin");
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sign In
        </Button>
      </CardContent>
    </Card>
  );

  const renderAuthCard = () => (
    <Card className="border-[#233558]/80 bg-[#14223c]/80 backdrop-blur-md shadow-2xl w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-slate-100">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </CardTitle>
        <CardDescription className="text-slate-400">
          {mode === "signin"
            ? "Access your field management dashboard"
            : "Register your company on OnSite Crew Manager"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {mode === "signin" ? (
            <motion.div
              key="signin"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-slate-300">Username or Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signin-email"
                      name="email"
                      type="text"
                      placeholder="Enter username or email"
                      className="pl-10 bg-[#0c121f]/40 border-[#233558]/60 text-slate-100 focus-visible:ring-primary placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="signin-password" className="text-slate-300">Password</Label>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline bg-transparent border-none p-0 cursor-pointer text-blue-400"
                      onClick={() => {
                        const form = document.getElementById("signin-email") as HTMLInputElement;
                        setForgotEmail(form?.value || "");
                        setView("forgot");
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-[#0c121f]/40 border-[#233558]/60 text-slate-100 focus-visible:ring-primary placeholder:text-slate-600"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-200 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold mt-2 shadow-lg shadow-indigo-500/10" disabled={isLoading}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
                <div className="text-center text-sm text-slate-400 mt-4">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setShowPassword(false);
                    }}
                    className="text-primary font-medium hover:underline bg-transparent border-none cursor-pointer p-0 text-blue-400"
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-300">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="name@company.com"
                      className="pl-10 bg-[#0c121f]/40 border-[#233558]/60 text-slate-100 focus-visible:ring-primary placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-slate-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-[#0c121f]/40 border-[#233558]/60 text-slate-100 focus-visible:ring-primary placeholder:text-slate-600"
                      minLength={6}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-200 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold mt-2 shadow-lg shadow-indigo-500/10" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
                <div className="text-center text-sm text-slate-400 mt-4">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setShowPassword(false);
                    }}
                    className="text-primary font-medium hover:underline bg-transparent border-none cursor-pointer p-0 text-blue-400"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#0c121f] flex flex-col font-sans relative overflow-hidden">
      {/* Background Glowing Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-[#0c121f]/80 backdrop-blur-sm z-10">
        <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-85 transition-opacity">
          <img src="/favicon.png" alt="Ocrem" className="h-8 w-8 rounded-lg shadow-md" />
          <span className="font-bold text-lg text-slate-100 tracking-tight">OnSite Crew Manager</span>
        </Link>
      </header>

      {/* Core Body Container */}
      <div className="flex-1 flex flex-col lg:flex-row z-10">
        {/* Left side - Platform branding and explanation */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 text-slate-100 bg-[#14274e] relative border-r border-[#233558]/40">
          {/* Subtle decoration for visual depth */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0c121f]/40 pointer-events-none" />
          <div className="max-w-md mx-auto space-y-8 relative z-10">
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl drop-shadow-sm">
                OnSite Crew Manager
              </h1>
              <p className="text-lg text-blue-100/90 leading-relaxed">
                Real-time location tracking and coordination for your field staff.
              </p>
            </div>

            <div className="space-y-6 pt-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white shadow-md shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">Staff Coordination</h3>
                  <p className="text-sm text-blue-100/80 mt-1 leading-relaxed">Manage directory records, certifications, and shift scheduling in one place.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white shadow-md shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">Geofence Boundaries</h3>
                  <p className="text-sm text-blue-100/80 mt-1 leading-relaxed">Set virtual boundaries to log shift presence and prevent ghost visits.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white shadow-md shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">Biometric Face Audits</h3>
                  <p className="text-sm text-blue-100/80 mt-1 leading-relaxed">Secure face-verified clock-in gates to eliminate buddy punching.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Forms */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-[440px]">
            {view === "auth" && renderAuthCard()}
            {view === "forgot" && renderForgotPassword()}
            {view === "email-sent" && renderEmailSent()}
            {view === "signup-success" && renderSignupSuccess()}
          </div>
        </div>
      </div>

      {/* Simplified Footer */}
      <footer className="py-4 border-t border-slate-950 bg-[#060a12]/50 text-center text-xs text-slate-500 z-10">
        <div className="flex items-center justify-center gap-6">
          <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          <Link to="/support" className="hover:text-slate-300 transition-colors">Support Portal</Link>
        </div>
      </footer>
    </div>
  );
};

export default AuthPage;
