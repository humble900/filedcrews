import { useAuth } from "@/hooks/useAuth";
import LandingPage from "./LandingPage";
import CompanySetup from "./CompanySetup";
import StaffManagement from "@/components/StaffManagement";
import LiveMap from "@/components/LiveMap";
import GeofenceManagement from "@/components/GeofenceManagement";
import DashboardLayout from "@/components/DashboardLayout";
import TrackerDownload from "@/components/TrackerDownload";
import SEO from "@/components/SEO";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const HomePage = () => {
  const { user, company, loading, signOut, createCompany } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [geofenceEditing, setGeofenceEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("map");

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in → show landing page
  if (!user) {
    return <LandingPage />;
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
    </>
  );
};

export default HomePage;
