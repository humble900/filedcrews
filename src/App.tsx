import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Skeleton } from "@/components/ui/skeleton";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";

// ─── Eagerly loaded (small, always-needed) ─────────────────────────
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// ─── Lazy loaded (large pages, loaded on demand) ───────────────────
const HomePage = lazy(() => import("./pages/HomePage"));
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
const LandingPage = lazy(() => import("./pages/LandingPage"));
const PublicApprovalPage = lazy(() => import("./pages/PublicApprovalPage"));
const PublicPayPage = lazy(() => import("./pages/PublicPayPage"));
const TimesheetsPage = lazy(() => import("./pages/TimesheetsPage"));
const MembershipsPage = lazy(() => import("./pages/MembershipsPage"));
const CompliancePage = lazy(() => import("./pages/CompliancePage"));
const PortalPage = lazy(() => import("./pages/PortalPage"));
const OnlineBookingPage = lazy(() => import("./pages/OnlineBookingPage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));

// ─── Page loading skeleton ─────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-border/40 rounded-xl p-4 space-y-3 bg-card/50">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-7 w-28 rounded-md" />
            <Skeleton className="h-2 w-16 rounded" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="border border-border/40 rounded-xl overflow-hidden bg-card/50">
        <div className="p-4 border-b border-border/30">
          <Skeleton className="h-5 w-40 rounded-md" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border/20 last:border-b-0">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1 max-w-48 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        ))}
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

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<Index />} />
              <Route path="/wizard" element={<ProjectSetupWizard />} />
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
              
              <Route path="/approve/:token" element={<PublicApprovalPage />} />
              <Route path="/pay/:invoiceId" element={<PublicPayPage />} />
              <Route path="/portal" element={<PortalPage />} />
              <Route path="/book/:prefix" element={<OnlineBookingPage />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
