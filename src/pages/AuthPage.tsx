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

import { useAuth } from "@/hooks/useAuth";

interface AuthPageProps {
  onSignIn: (email: string, password: string) => Promise<{ error: any }>;
  onSignUp: (email: string, password: string) => Promise<{ error: any }>;
}

type Mode = "signin" | "signup";
type ViewState = "auth" | "forgot" | "email-sent" | "signup-success";

const AuthPage = ({ onSignIn, onSignUp }: AuthPageProps) => {
  const { signInWithGoogle } = useAuth();
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
  const [signupPassword, setSignupPassword] = useState("");
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
    <Card className="border-sidebar-border/80 bg-[#14223c]/80 backdrop-blur-md shadow-2xl">
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
                className="pl-10 bg-[#0c121f]/40 border-sidebar-border/60 text-slate-100 focus-visible:ring-primary placeholder:text-slate-600"
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
    <Card className="border-sidebar-border/80 bg-[#14223c]/80 backdrop-blur-md shadow-2xl text-center">
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
        <div className="rounded-lg bg-[#0c121f]/40 border border-sidebar-border/60 p-4 text-sm text-slate-400 space-y-2 text-left">
          <p>• Click the link in the email to set a new password.</p>
          <p>• Check your spam folder if you do not receive it.</p>
          <p>• The link will expire in 1 hour.</p>
        </div>
        <Button
          variant="outline"
          className="w-full border-sidebar-border/60 text-slate-300 hover:bg-[#233558]/20 hover:text-slate-100"
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
    <Card className="border-sidebar-border/80 bg-[#14223c]/80 backdrop-blur-md shadow-2xl text-center">
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
        <div className="rounded-lg bg-[#0c121f]/40 border border-sidebar-border/60 p-4 text-sm text-slate-400 text-left">
          Please click the confirmation link inside the verification email to activate your account.
        </div>
        <Button
          variant="outline"
          className="w-full border-sidebar-border/60 text-slate-300 hover:bg-[#233558]/20 hover:text-slate-100"
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
    <div className="w-full animate-in fade-in zoom-in-95 duration-300">
      <div className="space-y-2 mb-10 text-center sm:text-left">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          {mode === "signin" ? "Welcome back 👋" : "Welcome to FiledCrew 👋"}
        </h2>
        <p className="text-slate-500 text-sm">
          {mode === "signin"
            ? "Log in to manage your field team."
            : "Managing a field team is complex. FiledCrew makes it easy."}
        </p>
      </div>
        <AnimatePresence mode="wait">
          {mode === "signin" ? (
            <motion.div
              key="signin"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      id="signin-email"
                      name="email"
                      type="text"
                      placeholder="Company email or username"
                      className="h-14 px-4 bg-white border-slate-300 text-slate-900 focus-visible:ring-indigo-600 focus-visible:border-indigo-600 placeholder:text-slate-500 rounded-lg shadow-sm text-base"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 ml-1 mt-1">For example 'you@companyname.com'</p>
                </div>
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      id="signin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="h-14 px-4 bg-white border-slate-300 text-slate-900 focus-visible:ring-indigo-600 focus-visible:border-indigo-600 placeholder:text-slate-500 rounded-lg shadow-sm text-base pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-2 h-10 w-10 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      className="text-xs font-semibold text-slate-900 hover:underline bg-transparent border-none p-0 cursor-pointer"
                      onClick={() => {
                        const form = document.getElementById("signin-email") as HTMLInputElement;
                        setForgotEmail(form?.value || "");
                        setView("forgot");
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
                <div className="flex justify-center pt-4">
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-8 h-11 w-auto shadow-md" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Log in"}
                  </Button>
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-500 font-semibold">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    setIsLoading(true);
                    const { error } = await signInWithGoogle();
                    if (error) {
                      toast.error(error.message || "Failed to sign in with Google");
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-300 shadow-sm h-12 flex items-center justify-center gap-3 rounded-xl transition-all"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Sign in with Google
                </Button>

                <div className="text-center text-sm text-slate-400 mt-4">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setShowPassword(false);
                    }}
                    className="text-emerald-700 font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
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
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="Company email"
                      className="h-14 px-4 bg-white border-slate-300 text-slate-900 focus-visible:ring-indigo-600 focus-visible:border-indigo-600 placeholder:text-slate-500 rounded-lg shadow-sm text-base"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 ml-1 mt-1">For example 'you@companyname.com'</p>
                </div>
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      id="signup-password"
                      name="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="Create password"
                      className="h-14 px-4 bg-white border-slate-300 text-slate-900 focus-visible:ring-indigo-600 focus-visible:border-indigo-600 placeholder:text-slate-500 rounded-lg shadow-sm text-base pr-10"
                      minLength={8}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-2 h-10 w-10 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                  {signupPassword && (
                    <div className="pt-3 grid grid-cols-2 gap-y-3 gap-x-4 text-xs ml-1">
                      <div className={`flex items-center gap-2 ${signupPassword.length >= 8 ? 'text-slate-900' : 'text-slate-400'}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${signupPassword.length >= 8 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                        8 characters minimum.
                      </div>
                      <div className={`flex items-center gap-2 ${/[A-Z]/.test(signupPassword) ? 'text-slate-900' : 'text-slate-400'}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${/[A-Z]/.test(signupPassword) ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                        Uppercase characters.
                      </div>
                      <div className={`flex items-center gap-2 ${/[a-z]/.test(signupPassword) ? 'text-slate-900' : 'text-slate-400'}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${/[a-z]/.test(signupPassword) ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                        Lowercase characters.
                      </div>
                      <div className={`flex items-center gap-2 ${/[0-9]/.test(signupPassword) ? 'text-slate-900' : 'text-slate-400'}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${/[0-9]/.test(signupPassword) ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                        Numbers.
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-center pt-4">
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-8 h-11 w-auto shadow-md" disabled={isLoading || signupPassword.length < 8 || !/[A-Z]/.test(signupPassword) || !/[0-9]/.test(signupPassword)}>
                    {isLoading ? "Creating Account..." : "Sign up for free"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden">
      
      {/* Right side swooping curve background */}
      <div className="absolute bottom-0 right-0 w-[80%] h-[40%] bg-white rounded-tl-[100%] pointer-events-none z-0" />


      {/* Core Body Container */}
      {(view === "signup-success" || view === "email-sent") ? (
        <div className="flex-1 flex items-center justify-center relative z-10 w-full h-full p-4">
          <div className="z-10 w-full max-w-md">
            {view === "signup-success" ? renderSignupSuccess() : renderEmailSent()}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row z-10">
        {/* Left side - Remote-Style Premium Sidebar */}
        <div className="hidden lg:flex lg:w-[400px] xl:w-[460px] flex-col justify-between p-10 bg-sidebar text-sidebar-foreground border-r border-sidebar-border relative overflow-hidden shrink-0 select-none">
          
          <div className="relative z-10 w-full mx-auto flex flex-col h-full justify-between">
            {/* Header Section */}
            <div>
              {/* Top Logo */}
              <div className="flex items-center gap-3 mb-8">
                <img src="/favicon.png" alt="FiledCrew Logo" className="h-8 w-8 rounded-lg shadow-sm" />
                <span className="text-xl font-black text-white tracking-tight">FiledCrew</span>
              </div>

              {/* Hero Copy */}
              <div className="space-y-2 mb-10">
                <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Sign up and come on in.
                </h1>
                <p className="text-xs text-sidebar-foreground/75 font-medium leading-relaxed max-w-[300px]">
                  Sign up is simple, free and fast. One place to manage everything, and everyone.
                </p>
              </div>
            </div>

            {/* Overlapping Floating UI Cards & Feature Callouts strictly matching Remote 3 */}
            <div className="relative w-full h-[400px] pointer-events-none my-auto">
              
              {/* Feature 1 Header (Top Right) */}
              <div className="absolute right-0 top-0 text-left z-0 translate-x-1 -translate-y-6">
                <p className="font-bold text-[11px] text-white">Manage field crews</p>
                <p className="text-[9.5px] text-slate-400 font-medium">Technicians to contractors</p>
              </div>



              {/* Card 2: Job Cost Calculator (Bottom Left Floating Card) */}
              <div className="absolute left-0 bottom-12 w-[230px] bg-white text-slate-900 rounded-2xl shadow-2xl p-4 z-30 -translate-x-3 border border-slate-100">
                <div className="inline-block border border-slate-200 text-[8px] font-bold text-slate-400 px-2 py-0.5 rounded-full mb-3 uppercase tracking-wider">
                  PER DISPATCH
                </div>

                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Tech labor rate</span>
                    <span className="font-bold text-slate-900">$1,250.00</span>
                  </div>
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Parts & materials</span>
                    <span className="font-bold text-slate-900">$850.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-xs">
                    <span className="font-black text-slate-900">Total Estimate</span>
                    <span className="font-black text-slate-900">$2,100.00</span>
                  </div>
                </div>
              </div>

              {/* Feature 2 Header (Bottom Left) */}
              <div className="absolute left-0 bottom-0 text-left z-10 translate-y-2">
                <p className="font-bold text-[11px] text-white">Calculate dispatch cost</p>
                <p className="text-[9.5px] text-slate-400 font-medium">Total cost of job & materials</p>
              </div>
            </div>

            {/* Subtle background ambient gradient glow */}
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
          </div>
        </div>

          <div className="flex-1 flex flex-col items-center p-6 lg:p-12 relative z-10">
            {/* Top Right Toggle & Mobile Brand Header */}
            <div className="w-full flex items-center justify-between lg:justify-end text-sm text-slate-600 font-medium mb-10 lg:mb-16 pr-4">
              <div className="flex items-center gap-2.5 lg:hidden">
                <img src="/favicon.png" alt="FiledCrew Logo" className="h-7 w-7 rounded-lg shadow-sm" />
                <span className="text-base font-black text-slate-900 tracking-tight">FiledCrew</span>
              </div>
              {mode === "signin" ? (
                 <span>Don't have an account? <button onClick={() => setMode("signup")} className="text-emerald-700 font-bold hover:underline cursor-pointer bg-transparent border-none">Sign up</button></span>
              ) : (
                 <span>Already have an account? <button onClick={() => setMode("signin")} className="text-emerald-700 font-bold hover:underline cursor-pointer bg-transparent border-none">Log in</button></span>
              )}
            </div>

            <div className="w-full max-w-[460px] mx-auto mt-10">
              {view === "auth" && renderAuthCard()}
              {view === "forgot" && renderForgotPassword()}
            </div>
            
            {/* Privacy Links below form */}
            {view === "auth" && (
              <div className="mt-16 text-center text-[13px] text-blue-600 font-medium">
                <Link to="/privacy" className="hover:underline">Privacy Policy ↗</Link>
                <span className="text-slate-400 mx-2">and</span>
                <Link to="/terms" className="hover:underline">Terms and Conditions ↗</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
