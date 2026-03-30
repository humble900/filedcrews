import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import AuthPage from "@/pages/AuthPage";
import SEO from "@/components/SEO";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading, signIn, signUp } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Authenticated users should not stay on /auth — redirect to homepage
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <SEO
        title="Staff Tracker — Sign In or Create Account"
        description="Sign in to your Staff Tracker dashboard or create a new account."
        path="/auth"
      />
      <AuthPage onSignIn={signIn} onSignUp={signUp} />
    </>
  );
};

export default Index;
