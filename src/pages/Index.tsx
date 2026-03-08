import { useAuth } from "@/hooks/useAuth";
import AuthPage from "@/pages/AuthPage";
import CompanySetup from "@/pages/CompanySetup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import StaffManagement from "@/components/StaffManagement";
import LiveMap from "@/components/LiveMap";
import GeofenceManagement from "@/components/GeofenceManagement";
import TrackerDownload from "@/components/TrackerDownload";
import { LogOut, MapPin, Users, Circle, Smartphone, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { user, company, loading, signIn, signUp, signOut, createCompany } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [geofenceEditing, setGeofenceEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("map");
  const isMobile = useIsMobile();

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
    return <AuthPage onSignIn={signIn} onSignUp={signUp} />;
  }

  if (!company) {
    return <CompanySetup onCreate={createCompany} onSignOut={signOut} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-tight">Staff Tracker</h1>
            <p className="text-xs text-muted-foreground leading-tight">{company.name} · <span className="font-mono">{company.prefix}</span></p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} disabled={geofenceEditing}>
          <LogOut className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </header>
      <main className="p-3 md:p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="map" className="gap-1.5" disabled={geofenceEditing}>
              <MapPin className="h-4 w-4" />
              {!isMobile && "Live Map"}
            </TabsTrigger>
            <TabsTrigger value="geofences" className="gap-1.5" disabled={geofenceEditing && activeTab !== "geofences"}>
              <Circle className="h-4 w-4" />
              {!isMobile && "Geofences"}
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-1.5" disabled={geofenceEditing}>
              <Users className="h-4 w-4" />
              {!isMobile && "Staff"}
            </TabsTrigger>
            <TabsTrigger value="tracker" className="gap-1.5" disabled={geofenceEditing}>
              <Smartphone className="h-4 w-4" />
              {!isMobile && "Tracker"}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="map" className="mt-4">
            <LiveMap />
          </TabsContent>
          <TabsContent value="geofences" className="mt-4">
            {apiKey ? (
              <GeofenceManagement
                apiKey={apiKey}
                onEditModeChange={setGeofenceEditing}
                companyId={company.id}
              />
            ) : (
              <p className="text-muted-foreground">Loading map…</p>
            )}
          </TabsContent>
          <TabsContent value="staff" className="mt-4">
            <StaffManagement companyId={company.id} prefix={company.prefix} />
          </TabsContent>
          <TabsContent value="tracker" className="mt-4">
            <TrackerDownload />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
