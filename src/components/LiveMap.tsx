import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface StaffLocation {
  staff_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updated_at: string;
  staff_profiles: {
    full_name: string;
    username: string;
  } | null;
}

const createStaffIcon = (name: string) => {
  return L.divIcon({
    className: "staff-marker",
    html: `
      <div style="background: hsl(220 70% 50%); color: white; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: 'Space Grotesk', sans-serif; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.25); text-align:center; transform: translate(-50%, -100%);">
        ${name}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

function FitBounds({ locations }: { locations: StaffLocation[] }) {
  const map = useMap();
  const hasFitted = useRef(false);
  useEffect(() => {
    if (hasFitted.current || locations.length === 0) return;
    const bounds = L.latLngBounds(locations.map((l) => [l.latitude, l.longitude]));
    map.fitBounds(bounds, { padding: [40, 40] });
    hasFitted.current = true;
  }, [locations, map]);
  return null;
}

function MapRefSetter({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
}

const LiveMap = () => {
  const [locations, setLocations] = useState<StaffLocation[]>([]);
  const mapRef = useRef<L.Map | null>(null);

  const fetchLocations = useCallback(async () => {
    const { data } = await supabase
      .from("staff_locations")
      .select("*, staff_profiles(full_name, username)");
    if (data) setLocations(data as unknown as StaffLocation[]);
  }, []);

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 8000);

    const channel = supabase
      .channel("staff_locations_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_locations" }, () => {
        fetchLocations();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchLocations]);

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      <div className="flex-1 rounded-xl overflow-hidden border border-border">
        <MapContainer
          center={[24.7136, 46.6753]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRefSetter mapRef={mapRef} />
          {locations.map((loc) => (
            <Marker
              key={loc.staff_id}
              position={[loc.latitude, loc.longitude]}
              icon={createStaffIcon(loc.staff_profiles?.full_name || "Unknown")}
            >
              <Popup>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  <strong>{loc.staff_profiles?.full_name}</strong>
                  <br />
                  <small>
                    {formatDistanceToNow(new Date(loc.updated_at), { addSuffix: true })}
                  </small>
                  <br />
                  <small>
                    {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                  </small>
                </div>
              </Popup>
            </Marker>
          ))}
          <FitBounds locations={locations} />
        </MapContainer>
      </div>
      <Card className="w-72 shrink-0 overflow-auto">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Staff ({locations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!locations.length ? (
            <p className="px-4 pb-4 text-xs text-muted-foreground">No locations yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {[...locations]
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                .map((loc) => (
                  <div
                    key={loc.staff_id}
                    className="px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      mapRef.current?.flyTo([loc.latitude, loc.longitude], 16, { duration: 1.2 });
                    }}
                  >
                    <p className="font-medium text-sm">{loc.staff_profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(loc.updated_at), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveMap;
