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

// ─── Eagerly loaded (instant render, no loading fallbacks) ───────────
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";

// ─── Lazy loaded (large secondary pages, loaded on demand) ─────────
const FaceVerification = lazy(() => import("./pages/FaceVerification"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Support = lazy(() => import("./pages/Support"));
const About = lazy(() => import("./pages/About"));
const AccountDeletion = lazy(() => import("./pages/AccountDeletion"));
const SuperadminDashboard = lazy(() => import("./pages/SuperadminDashboard"));
const SuperadminLogin = lazy(() => import("./pages/SuperadminLogin"));
const CRMPage = lazy(() => import("./pages/CRMPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const WorkOrdersPage = lazy(() => import("./pages/WorkOrdersPage"));
const InvoicesPage = lazy(() => import("./pages/InvoicesPage"));
const EstimatesPage = lazy(() => import("./pages/EstimatesPage"));
const SafetyPage = lazy(() => import("./pages/SafetyPage"));
const ChangeOrdersPage = lazy(() => import("./pages/ChangeOrdersPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const ProjectSetupWizard = lazy(() => import("./pages/ProjectSetupWizard"));
const ProjectDetailWorkspace = lazy(() => import("./pages/ProjectDetailWorkspace"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const PublicApprovalPage = lazy(() => import("./pages/PublicApprovalPage"));
const PublicPayPage = lazy(() => import("./pages/PublicPayPage"));
const TimesheetsPage = lazy(() => import("./pages/TimesheetsPage"));
const MembershipsPage = lazy(() => import("./pages/MembershipsPage"));
const CompliancePage = lazy(() => import("./pages/CompliancePage"));
const OnlineBookingPage = lazy(() => import("./pages/OnlineBookingPage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const AffiliatePortal = lazy(() => import("./pages/AffiliatePortal"));
const UseCasePage = lazy(() => import("./pages/UseCasePage"));
const MarketplacePage = lazy(() => import("./pages/MarketplacePage"));
const AIAgentProductPage = lazy(() => import("./pages/AIAgentProductPage"));
const AIAgentPricingPage = lazy(() => import("./pages/AIAgentPricingPage"));
const AITermsPage = lazy(() => import("./pages/AITermsPage"));
const AIAgentPage = lazy(() => import("./pages/AIAgentPage"));
const ActionInboxPage = lazy(() => import("./pages/ActionInboxPage"));
const KnowledgeBasePage = lazy(() => import("./pages/KnowledgeBasePage"));

// ─── Page loading fallback ─────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
      <img src="/favicon.png" alt="FiledCrews" className="h-10 w-10 animate-pulse rounded-lg shadow-sm" />
      <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
        <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
        <span>Loading...</span>
      </div>
    </div>
  );
}

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
                <ProtectedRoute>
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
              <Route path="/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
              <Route path="/ai-agents" element={<ProtectedRoute><AIAgentPage /></ProtectedRoute>} />
              <Route path="/knowledge-base" element={<ProtectedRoute><KnowledgeBasePage /></ProtectedRoute>} />
              
              {/* Product/Marketing Pages */}
              <Route path="/use-cases/:industry" element={<UseCasePage />} />

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
