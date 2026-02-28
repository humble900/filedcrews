import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, History, X, CircleDot } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, CircleMarker } from "react-leaflet";
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

interface HistoryPoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  created_at: string;
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
  const [historyStaff, setHistoryStaff] = useState<{ id: string; name: string } | null>(null);
  const [historyPoints, setHistoryPoints] = useState<HistoryPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const fetchLocations = useCallback(async () => {
    const { data } = await supabase
      .from("staff_locations")
      .select("*, staff_profiles(full_name, username)");
    if (data) setLocations(data as unknown as StaffLocation[]);
  }, []);

  const fetchHistory = useCallback(async (staffId: string) => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("staff_location_history")
      .select("*")
      .eq("staff_id", staffId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (data) setHistoryPoints(data as HistoryPoint[]);
    setLoadingHistory(false);
  }, []);

  const showHistory = (staffId: string, name: string) => {
    setHistoryStaff({ id: staffId, name });
    fetchHistory(staffId);
  };

  const closeHistory = () => {
    setHistoryStaff(null);
    setHistoryPoints([]);
  };

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

  // Fit history trail on map when loaded
  useEffect(() => {
    if (historyPoints.length > 1 && mapRef.current) {
      const bounds = L.latLngBounds(historyPoints.map((p) => [p.latitude, p.longitude]));
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [historyPoints]);

  const historyLine: [number, number][] = historyPoints.map((p) => [p.latitude, p.longitude]);

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
          {/* History trail */}
          {historyPoints.length > 1 && (
            <Polyline
              positions={historyLine}
              pathOptions={{ color: "hsl(220, 70%, 50%)", weight: 3, opacity: 0.6, dashArray: "8 4" }}
            />
          )}
          {historyPoints.map((pt, i) => (
            <CircleMarker
              key={pt.id}
              center={[pt.latitude, pt.longitude]}
              radius={i === historyPoints.length - 1 ? 7 : 4}
              pathOptions={{
                color: i === historyPoints.length - 1 ? "hsl(150, 70%, 40%)" : "hsl(220, 70%, 50%)",
                fillColor: i === historyPoints.length - 1 ? "hsl(150, 70%, 50%)" : "hsl(220, 70%, 60%)",
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12 }}>
                  <strong>{format(new Date(pt.created_at), "MMM d, HH:mm:ss")}</strong>
                  <br />
                  <span>{pt.latitude.toFixed(5)}, {pt.longitude.toFixed(5)}</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
          <FitBounds locations={locations} />
        </MapContainer>
      </div>
      <Card className="w-72 shrink-0 overflow-auto">
        <CardHeader className="pb-3">
          {historyStaff ? (
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                {historyStaff.name}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={closeHistory}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Staff ({locations.length})
            </CardTitle>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {historyStaff ? (
            loadingHistory ? (
              <p className="px-4 pb-4 text-xs text-muted-foreground">Loading history…</p>
            ) : !historyPoints.length ? (
              <p className="px-4 pb-4 text-xs text-muted-foreground">No history recorded.</p>
            ) : (
              <div className="divide-y divide-border">
                {[...historyPoints].reverse().map((pt, i) => (
                  <div
                    key={pt.id}
                    className="px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      mapRef.current?.flyTo([pt.latitude, pt.longitude], 16, { duration: 1.2 });
                    }}
                  >
                    <p className="text-xs font-medium flex items-center gap-1.5">
                      <CircleDot className={`h-3 w-3 ${i === 0 ? "text-green-500" : "text-primary"}`} />
                      {format(new Date(pt.created_at), "MMM d, HH:mm:ss")}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5 ml-[18px]">
                      {pt.latitude.toFixed(5)}, {pt.longitude.toFixed(5)}
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : !locations.length ? (
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
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{loc.staff_profiles?.full_name}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          showHistory(loc.staff_id, loc.staff_profiles?.full_name || "Unknown");
                        }}
                      >
                        <History className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
