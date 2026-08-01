import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import AuthPage from "@/pages/AuthPage";
import SEO from "@/components/SEO";

const Index = () => {
  const { user, signIn, signUp } = useAuth();

  // Authenticated users should not stay on /auth — redirect to homepage
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <SEO
        title="OnSite Crew Manager — Sign In or Create Account"
        description="Sign in to your OnSite Crew Manager dashboard or create a new account."
        path="/auth"
      />
      <AuthPage onSignIn={signIn} onSignUp={signUp} />
    </>
  );
};

export default Index;
