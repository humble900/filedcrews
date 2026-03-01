import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLogin from "@/pages/AdminLogin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import StaffManagement from "@/components/StaffManagement";
import LiveMap from "@/components/LiveMap";
import GeofenceManagement from "@/components/GeofenceManagement";
import TrackerDownload from "@/components/TrackerDownload";
import { LogOut, MapPin, Users, Circle, Smartphone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { isAuthenticated, logout } = useAdminAuth();
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

  if (!isAuthenticated) return <AdminLogin />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">Staff Tracker</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} disabled={geofenceEditing}>
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
              />
            ) : (
              <p className="text-muted-foreground">Loading map…</p>
            )}
          </TabsContent>
          <TabsContent value="staff" className="mt-4">
            <StaffManagement />
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
