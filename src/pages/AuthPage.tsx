import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Users, Circle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AuthPageProps {
  onSignIn: (email: string, password: string) => Promise<{ error: any }>;
  onSignUp: (email: string, password: string) => Promise<{ error: any }>;
}

const AuthPage = ({ onSignIn, onSignUp }: AuthPageProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

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
                      onClick={async () => {
                        const form = document.getElementById("signin-email") as HTMLInputElement;
                        const email = form?.value;
                        if (!email) {
                          toast.error("Enter your email first");
                          return;
                        }
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        if (error) toast.error(error.message);
                        else toast.success("Password reset email sent! Check your inbox.");
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
        </div>
      </div>

      {/* Legal/help footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-4 px-6 text-center text-xs text-muted-foreground border-t border-border/40 bg-background/80 backdrop-blur-sm">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <span className="hidden sm:inline text-border">·</span>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <span className="hidden sm:inline text-border">·</span>
          <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
          <span className="hidden sm:inline text-border">·</span>
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <span className="hidden sm:inline text-border">·</span>
          <Link to="/account-deletion" className="hover:text-foreground transition-colors">Account Deletion</Link>
        </nav>
      </footer>
      </div>
    </div>
  );
};

export default AuthPage;
