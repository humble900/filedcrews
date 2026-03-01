import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLogin from "@/pages/AdminLogin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import StaffManagement from "@/components/StaffManagement";
import LiveMap from "@/components/LiveMap";
import GeofenceManagement from "@/components/GeofenceManagement";
import { LogOut, MapPin, Users, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { isAuthenticated, logout } = useAdminAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Fetch API key once at the top level so both LiveMap and Geofences share it
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

  if (!isAuthenticated) return <AdminLogin />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">StaffTracker</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4 mr-1" />
          Sign Out
        </Button>
      </header>
      <main className="p-6">
        <Tabs defaultValue="map">
          <TabsList>
            <TabsTrigger value="map" className="gap-1.5">
              <MapPin className="h-4 w-4" />
              Live Map
            </TabsTrigger>
            <TabsTrigger value="geofences" className="gap-1.5">
              <Circle className="h-4 w-4" />
              Geofences
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-1.5">
              <Users className="h-4 w-4" />
              Staff
            </TabsTrigger>
          </TabsList>
          <TabsContent value="map" className="mt-4">
            <LiveMap />
          </TabsContent>
          <TabsContent value="geofences" className="mt-4">
            {apiKey ? (
              <GeofenceManagement apiKey={apiKey} />
            ) : (
              <p className="text-muted-foreground">Loading map…</p>
            )}
          </TabsContent>
          <TabsContent value="staff" className="mt-4">
            <StaffManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
