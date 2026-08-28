import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import AuthPage from "@/pages/AuthPage";
import SEO from "@/components/SEO";

const Index = () => {
  const { user, loading, signIn, signUp } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  // Authenticated users should not stay on /auth — redirect to homepage
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <SEO
        title="Sign In or Create Account"
        description="Sign in to your FiledCrews dashboard or create a new account."
        path="/auth"
      />
      <AuthPage onSignIn={signIn} onSignUp={signUp} />
    </>
  );
};

export default Index;
