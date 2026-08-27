import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import PageSkeleton from "./components/PageSkeleton";

// ─── Eagerly loaded (instant render, no loading fallbacks) ───────────
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";

// ─── Resilient Lazy Loader (handles new deployments & stale chunks) ───
function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem("filedcrews_chunk_reload") || "false"
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem("filedcrews_chunk_reload", "false");
      return component;
    } catch (error) {
      if (!pageHasBeenForceRefreshed) {
        console.warn("[LazyLoader] Stale bundle chunk detected. Forcing page refresh...", error);
        window.sessionStorage.setItem("filedcrews_chunk_reload", "true");
        window.location.reload();
        return { default: (() => null) as unknown as T };
      }
      throw error;
    }
  });
}

// ─── Lazy loaded (large secondary pages, loaded on demand) ─────────
const FaceVerification = lazyWithRetry(() => import("./pages/FaceVerification"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazyWithRetry(() => import("./pages/TermsOfService"));
const Support = lazyWithRetry(() => import("./pages/Support"));
const About = lazyWithRetry(() => import("./pages/About"));
const AccountDeletion = lazyWithRetry(() => import("./pages/AccountDeletion"));
const SuperadminDashboard = lazyWithRetry(() => import("./pages/SuperadminDashboard"));
const SuperadminLogin = lazyWithRetry(() => import("./pages/SuperadminLogin"));
const CRMPage = lazyWithRetry(() => import("./pages/CRMPage"));
const ProjectsPage = lazyWithRetry(() => import("./pages/ProjectsPage"));
const WorkOrdersPage = lazyWithRetry(() => import("./pages/WorkOrdersPage"));
const InvoicesPage = lazyWithRetry(() => import("./pages/InvoicesPage"));
const EstimatesPage = lazyWithRetry(() => import("./pages/EstimatesPage"));
const SafetyPage = lazyWithRetry(() => import("./pages/SafetyPage"));
const ChangeOrdersPage = lazyWithRetry(() => import("./pages/ChangeOrdersPage"));
const ReportsPage = lazyWithRetry(() => import("./pages/ReportsPage"));
const ProjectSetupWizard = lazyWithRetry(() => import("./pages/ProjectSetupWizard"));
const ProjectDetailWorkspace = lazyWithRetry(() => import("./pages/ProjectDetailWorkspace"));
const SettingsPage = lazyWithRetry(() => import("./pages/SettingsPage"));
const PublicApprovalPage = lazyWithRetry(() => import("./pages/PublicApprovalPage"));
const PublicPayPage = lazyWithRetry(() => import("./pages/PublicPayPage"));
const TimesheetsPage = lazyWithRetry(() => import("./pages/TimesheetsPage"));
const MembershipsPage = lazyWithRetry(() => import("./pages/MembershipsPage"));
const CompliancePage = lazyWithRetry(() => import("./pages/CompliancePage"));
const OnlineBookingPage = lazyWithRetry(() => import("./pages/OnlineBookingPage"));
const InventoryPage = lazyWithRetry(() => import("./pages/InventoryPage"));
const AffiliatePortal = lazyWithRetry(() => import("./pages/AffiliatePortal"));
const UseCasePage = lazyWithRetry(() => import("./pages/UseCasePage"));
const MarketplacePage = lazyWithRetry(() => import("./pages/MarketplacePage"));
const AIAgentProductPage = lazyWithRetry(() => import("./pages/AIAgentProductPage"));
const AIAgentPricingPage = lazyWithRetry(() => import("./pages/AIAgentPricingPage"));
const AITermsPage = lazyWithRetry(() => import("./pages/AITermsPage"));
const AIAgentPage = lazyWithRetry(() => import("./pages/AIAgentPage"));
const ActionInboxPage = lazyWithRetry(() => import("./pages/ActionInboxPage"));
const KnowledgeBasePage = lazyWithRetry(() => import("./pages/KnowledgeBasePage"));
const MobileWelcomePage = lazyWithRetry(() => import("./pages/MobileWelcomePage"));
const FeaturesPage = lazyWithRetry(() => import("./pages/FeaturesPage"));



const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds stale time
      refetchOnWindowFocus: false, // disable query triggers on focus
      retry: 1, // limit retry delays on flaky networks
    },
  },
});

function ReferralTracker() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("aff") || params.get("ref") || params.get("promo");
  if (code) {
    localStorage.setItem("filedcrews_affiliate_code", code.trim());
  }
  return null;
}

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ReferralTracker />
          <AuthProvider>
            <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/auth" element={<Index />} />
              <Route path="/wizard" element={<ProjectSetupWizard />} />
              <Route path="/inbox" element={
                <ProtectedRoute feature="overview">
                  <ActionInboxPage />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/wizard" element={<ProjectSetupWizard />} />
              <Route path="/face-verify" element={<FaceVerification />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/support" element={<Support />} />
              <Route path="/about" element={<About />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/account-deletion" element={<AccountDeletion />} />
              <Route path="/superadmin/login" element={<SuperadminLogin />} />
              <Route path="/superadmin" element={<SuperadminDashboard />} />
              
              {/* Protected Dashboard Routes */}
              <Route path="/crm" element={
                <ProtectedRoute feature="crm">
                  <CRMPage />
                </ProtectedRoute>
              } />
              <Route path="/projects" element={
                <ProtectedRoute feature="projects">
                  <ProjectsPage />
                </ProtectedRoute>
              } />
              <Route path="/projects/:id" element={
                <ProtectedRoute feature="projects">
                  <ProjectDetailWorkspace />
                </ProtectedRoute>
              } />
              <Route path="/work-orders" element={
                <ProtectedRoute feature="jobs">
                  <WorkOrdersPage />
                </ProtectedRoute>
              } />
              <Route path="/jobs" element={<Navigate to="/work-orders" replace />} />
              <Route path="/invoices" element={
                <ProtectedRoute feature="invoices">
                  <InvoicesPage />
                </ProtectedRoute>
              } />
              <Route path="/estimates" element={
                <ProtectedRoute feature="estimates">
                  <EstimatesPage />
                </ProtectedRoute>
              } />
              <Route path="/safety" element={
                <ProtectedRoute feature="safety">
                  <SafetyPage />
                </ProtectedRoute>
              } />
              <Route path="/change-orders" element={
                <ProtectedRoute feature="change-orders">
                  <ChangeOrdersPage />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute feature="reports">
                  <ReportsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute feature="settings">
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/billing" element={<Navigate to="/settings?tab=billing" replace />} />
              <Route path="/timesheets" element={
                <ProtectedRoute feature="timesheets">
                  <TimesheetsPage />
                </ProtectedRoute>
              } />
              <Route path="/memberships" element={
                <ProtectedRoute feature="memberships">
                  <MembershipsPage />
                </ProtectedRoute>
              } />
              <Route path="/compliance" element={
                <ProtectedRoute feature="compliance">
                  <CompliancePage />
                </ProtectedRoute>
              } />
              <Route path="/inventory" element={
                <ProtectedRoute feature="inventory">
                  <InventoryPage />
                </ProtectedRoute>
              } />
              
              <Route path="/marketplace" element={
                <ProtectedRoute feature="marketplace">
                  <MarketplacePage />
                </ProtectedRoute>
              } />
              <Route path="/marketplace/ai-agent" element={
                <ProtectedRoute feature="marketplace">
                  <AIAgentProductPage />
                </ProtectedRoute>
              } />
              <Route path="/marketplace/ai-agent/pricing" element={
                <ProtectedRoute feature="marketplace">
                  <AIAgentPricingPage />
                </ProtectedRoute>
              } />
              <Route path="/marketplace/ai-agent/terms" element={
                <ProtectedRoute feature="marketplace">
                  <AITermsPage />
                </ProtectedRoute>
              } />
              <Route path="/ai-agents" element={
                <ProtectedRoute feature="marketplace">
                  <AIAgentPage />
                </ProtectedRoute>
              } />
              <Route path="/knowledge-base" element={
                <ProtectedRoute feature="settings">
                  <KnowledgeBasePage />
                </ProtectedRoute>
              } />
              
              {/* Product/Marketing Pages */}
              <Route path="/use-cases/:industry" element={<UseCasePage />} />
              <Route path="/mobile-welcome" element={<MobileWelcomePage />} />
              <Route path="/mobile-guide" element={<MobileWelcomePage />} />

              <Route path="/book/:prefix" element={<OnlineBookingPage />} />
              <Route path="/affiliates" element={<AffiliatePortal />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
  </ErrorBoundary>
);

export default App;
