import { useAuth } from "@/hooks/useAuth";
import AuthPage from "@/pages/AuthPage";
import CompanySetup from "@/pages/CompanySetup";
import StaffManagement from "@/components/StaffManagement";
import LiveMap from "@/components/LiveMap";
import GeofenceManagement from "@/components/GeofenceManagement";
import TrackerDownload from "@/components/TrackerDownload";
import DashboardLayout from "@/components/DashboardLayout";
import SEO from "@/components/SEO";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, company, loading, signIn, signUp, signOut, createCompany } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [geofenceEditing, setGeofenceEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("map");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("get-maps-key");
        if (data?.key) setApiKey(data.key);
      } catch (e) {
        console.error("Error fetching maps key", e);
      }
    })();
  }, []);

  const handleTabChange = useCallback(
    (value: string) => {
      if (geofenceEditing) return;
      setActiveTab(value);
    },
    [geofenceEditing]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <SEO
          title="Staff Tracker — Real-Time Staff Location Dashboard"
          description="Track your team's location in real time. Manage staff, set geofences, and monitor movement from one simple dashboard."
          path="/"
        />
        <AuthPage onSignIn={signIn} onSignUp={signUp} />
      </>
    );
  }

  if (!company) {
    return <CompanySetup onCreate={createCompany} onSignOut={signOut} />;
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
      geofenceEditing={geofenceEditing}
    >
      <div className="p-4 md:p-8">
        {activeTab === "map" && <LiveMap />}
        {activeTab === "geofences" && (
          apiKey ? (
            <GeofenceManagement
              apiKey={apiKey}
              onEditModeChange={setGeofenceEditing}
              companyId={company.id}
            />
          ) : (
            <p className="text-muted-foreground">Loading map…</p>
          )
        )}
        {activeTab === "staff" && (
          <StaffManagement companyId={company.id} prefix={company.prefix} />
        )}
        {activeTab === "tracker" && <TrackerDownload />}
      </div>
    </DashboardLayout>
  );
};

export default Index;
