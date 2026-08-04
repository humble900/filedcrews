import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import StaffManagement from "@/components/StaffManagement";
import LiveMap from "@/components/LiveMap";
import DashboardLayout from "@/components/DashboardLayout";
import TrackerDownload from "@/components/TrackerDownload";
import DashboardOverview from "@/components/DashboardOverview";
import StaffPortal from "@/components/StaffPortal";
import CrewManagement from "@/components/CrewManagement";
import { useTerminology } from "@/hooks/useTerminology";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEO from "@/components/SEO";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState, Suspense, lazy } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, Navigate } from "react-router-dom";
import { APIProvider } from "@vis.gl/react-google-maps";

import LandingPage from "./LandingPage";

const HomePage = () => {
  const { user, company, staffProfile, loading, signOut } = useAuth();
  const { t } = useTerminology();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [geofenceEditing, setGeofenceEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const location = useLocation();

  // Check if current user is listed in platform_admins
  const { data: isSuperadmin = false, isLoading: loadingAdmin } = useQuery({
    queryKey: ["is_superadmin_home", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from("platform_admins")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user?.id
  });

  // Check if company has any projects (for post-activation onboarding)
  const { data: projectCount = 0, isLoading: loadingProjects } = useQuery({
    queryKey: ["has_projects", company?.id],
    queryFn: async () => {
      if (!company?.id) return 0;
      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!company?.id
  });

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("get-maps-key");
        if (data?.key) setApiKey(data.key);
      } catch (e) {
        console.error("Error fetching maps key", e);
      }
    })();
  }, [user]);

  const handleTabChange = useCallback(
    (value: string) => {
      if (geofenceEditing) return;
      setActiveTab(value);
    },
    [geofenceEditing]
  );

  // Check if there is any Supabase session in localStorage
  const hasStoredSession = typeof window !== 'undefined' && Object.keys(localStorage).some(key => key.includes("sb-") && key.includes("-auth-token"));

  // Not logged in (or no stored session) → render LandingPage instantly without any loading screen delay
  if (!user && !hasStoredSession) {
    return <LandingPage />;
  }

  if (!user && !loading) {
    return <LandingPage />;
  }

  if (loading || (user && loadingAdmin)) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <img src="/favicon.png" alt="FiledCrews" className="h-10 w-10 animate-pulse rounded-lg shadow-sm" />
        <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  // Logged in as staff member
  if (staffProfile) {
    // Staff with elevated roles see the admin dashboard (filtered by permissions)
    const elevatedRoles = ['Admin', 'Finance', 'Dispatcher'];
    if (elevatedRoles.includes(staffProfile.global_role)) {
      // Fall through to the dashboard render below — they'll see the filtered sidebar
    } else {
      // Default Field Crew role → StaffPortal only
      return (
        <>
          <SEO
            title="Staff Portal"
            description="Download the FiledCrews mobile application to check in and record shift updates."
            path="/"
            noIndex
          />
          <StaffPortal
            staffProfile={staffProfile}
            company={company}
            onSignOut={signOut}
          />
        </>
      );
    }
  }

  if (isSuperadmin) {
    return <Navigate to="/superadmin" replace />;
  }

  if (!company || company.subscription_status === 'pending_approval') {
    return <Navigate to="/wizard" replace />;
  }

  // Force the account owner to complete the client & project setup if they haven't yet
  if (projectCount === 0 && !loadingProjects && user?.id === company.auth_user_id) {
    return <Navigate to="/wizard" replace />;
  }

  return (
    <>
      <SEO
        title="Dashboard"
        description="Admin dashboard for staff tracking and geofence management."
        path="/"
        noIndex
      />
      <DashboardLayout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        companyName={company.name}
        companyPrefix={company.prefix}
        companyId={company.id}
        geofenceEditing={geofenceEditing}
      >
        <div className={activeTab === "overview" ? "p-0" : "p-3 sm:p-4 md:p-8"}>
          {activeTab === "overview" && <DashboardOverview companyId={company.id} />}
          {activeTab === "map" && (
            apiKey ? (
              <APIProvider apiKey={apiKey} libraries={["places"]}>
                <LiveMap
                  apiKey={apiKey}
                  onEditModeChange={setGeofenceEditing}
                  companyId={company.id}
                />
              </APIProvider>
            ) : (
              <p className="text-muted-foreground">Loading map…</p>
            )
          )}

          {activeTab === "staff" && (
            <Tabs defaultValue="profiles" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                <TabsTrigger value="profiles">
                  {t("CrewMembers").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} Profiles
                </TabsTrigger>
                <TabsTrigger value="groups">
                  {t("Crew").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} Groups
                </TabsTrigger>
              </TabsList>
              <TabsContent value="profiles" className="space-y-4">
                <StaffManagement companyId={company.id} prefix={company.prefix} />
              </TabsContent>
              <TabsContent value="groups" className="space-y-4">
                <CrewManagement companyId={company.id} />
              </TabsContent>
            </Tabs>
          )}
          {activeTab === "tracker" && <TrackerDownload />}
        </div>
      </DashboardLayout>
    </>
  );
};

export default HomePage;
