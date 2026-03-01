import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, History, X, CircleDot, Loader2, MapPinHouse } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

/* ── Address lookup via reverse geocoding ── */
const addressCache: Record<string, string> = {};

function AddressLookup({ lat, lng }: { lat: number; lng: number }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [address, setAddress] = useState("");
  const [visible, setVisible] = useState(false);

  const lookup = useCallback(() => {
    if (visible) {
      setVisible(false);
      return;
    }

    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    const cached = addressCache[key];
    if (cached) {
      setAddress(cached);
      setState("done");
      setVisible(true);
      return;
    }

    setState("loading");
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const formatted = results[0].formatted_address;
        addressCache[key] = formatted;
        setAddress(formatted);
        setState("done");
        setVisible(true);
      } else {
        setState("error");
        setAddress("Address not found");
        setVisible(true);
      }
    });
  }, [lat, lng, visible]);

  return (
    <div className="inline-flex flex-col">
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 ml-1 inline-flex"
        onClick={(e) => {
          e.stopPropagation();
          lookup();
        }}
        title="Show address"
      >
        {state === "loading" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <MapPinHouse className="h-3 w-3" />
        )}
      </Button>
      {visible && address && (
        <p className={`text-xs mt-0.5 ml-[18px] leading-tight ${state === "error" ? "text-destructive" : "text-foreground"}`}>
          {address}
        </p>
      )}
    </div>
  );
}
import {
  APIProvider,
  Map,
  MapControl,
  ControlPosition,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
  Pin,
} from "@vis.gl/react-google-maps";

/* ── Places search autocomplete ── */
function PlaceSearch() {
  const map = useMap();
  const places = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const ac = new places.Autocomplete(inputRef.current, {
      fields: ["geometry", "name", "formatted_address"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place.geometry?.location && map) {
        map.panTo(place.geometry.location);
        map.setZoom(15);
      }
    });

    autocompleteRef.current = ac;

    return () => {
      google.maps.event.clearInstanceListeners(ac);
    };
  }, [places, map]);

  return (
    <MapControl position={ControlPosition.TOP_LEFT}>
      <div style={{ padding: "10px" }}>
        <input
          ref={inputRef}
          placeholder="Search a place…"
          style={{
            width: "260px",
            padding: "8px 12px",
            fontSize: "14px",
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            outline: "none",
          }}
        />
      </div>
    </MapControl>
  );
}

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

/* ── History polyline drawn on the map via vanilla Maps API ── */
function HistoryOverlay({
  points,
  selectedPointId,
}: {
  points: HistoryPoint[];
  selectedPointId: string | null;
}) {
  const map = useMap();
  const polyRef = useRef<google.maps.Polyline | null>(null);
  const circlesRef = useRef<google.maps.Circle[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clean previous
    polyRef.current?.setMap(null);
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    if (points.length < 2) return;

    const path = points.map((p) => ({ lat: p.latitude, lng: p.longitude }));
    const poly = new google.maps.Polyline({
      path,
      strokeColor: "#3b71ca",
      strokeOpacity: 0.6,
      strokeWeight: 3,
      geodesic: true,
      map,
    });
    // dashed line via icons
    poly.setOptions({
      strokeOpacity: 0,
      icons: [
        {
          icon: { path: "M 0,-1 0,1", strokeOpacity: 0.6, strokeWeight: 3, scale: 3 },
          offset: "0",
          repeat: "16px",
        },
      ],
    });
    polyRef.current = poly;

    points.forEach((pt, i) => {
      const isSelected = pt.id === selectedPointId;
      const isLatest = i === points.length - 1;
      const circle = new google.maps.Circle({
        center: { lat: pt.latitude, lng: pt.longitude },
        radius: isSelected ? 18 : isLatest ? 12 : 7,
        fillColor: isSelected ? "#e53935" : isLatest ? "#43a047" : "#3b71ca",
        fillOpacity: isSelected ? 1 : 0.9,
        strokeColor: isSelected ? "#c62828" : isLatest ? "#2e7d32" : "#1e4b8f",
        strokeWeight: isSelected ? 3 : 2,
        map,
        clickable: false,
      });
      circlesRef.current.push(circle);
    });

    return () => {
      poly.setMap(null);
      circlesRef.current.forEach((c) => c.setMap(null));
    };
  }, [map, points, selectedPointId]);

  // Show a floating date/time label on the selected history point
  const selectedPoint = points.find((p) => p.id === selectedPointId);
  if (!selectedPoint) return null;

  return (
    <AdvancedMarker
      position={{ lat: selectedPoint.latitude, lng: selectedPoint.longitude }}
      zIndex={2000}
    >
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        pointerEvents: "none",
      }}>
        <div
          style={{
            background: "hsl(0, 70%, 45%)",
            color: "white",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "9px",
            fontWeight: 600,
            fontFamily: "'Space Grotesk', sans-serif",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            marginBottom: "6px",
          }}
        >
          {format(new Date(selectedPoint.created_at), "MMM d, HH:mm:ss")}
        </div>
      </div>
    </AdvancedMarker>
  );
}

/* ── Fit bounds helper ── */
function useFitBounds() {
  const map = useMap();
  return useCallback(
    (coords: { lat: number; lng: number }[]) => {
      if (!map || coords.length === 0) return;
      const bounds = new google.maps.LatLngBounds();
      coords.forEach((c) => bounds.extend(c));
      map.fitBounds(bounds, 40);
    },
    [map]
  );
}

function FitOnce({ locations }: { locations: StaffLocation[] }) {
  const fitBounds = useFitBounds();
  const hasFitted = useRef(false);
  useEffect(() => {
    if (hasFitted.current || locations.length === 0) return;
    fitBounds(locations.map((l) => ({ lat: l.latitude, lng: l.longitude })));
    hasFitted.current = true;
  }, [locations, fitBounds]);
  return null;
}

function FitHistory({ points }: { points: HistoryPoint[] }) {
  const fitBounds = useFitBounds();
  const prevLen = useRef(0);
  useEffect(() => {
    if (points.length > 1 && points.length !== prevLen.current) {
      fitBounds(points.map((p) => ({ lat: p.latitude, lng: p.longitude })));
      prevLen.current = points.length;
    }
  }, [points, fitBounds]);
  return null;
}

/* ── Zoom-aware label scaling ── */
function useZoomLevel() {
  const map = useMap();
  const [zoom, setZoom] = useState(6);
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("zoom_changed", () => {
      setZoom(map.getZoom() ?? 6);
    });
    return () => google.maps.event.removeListener(listener);
  }, [map]);
  return zoom;
}

/** Returns a font-size (px) for the name label that grows as zoom decreases */
function getLabelSize(zoom: number): number {
  const base = 10;
  const scale = Math.max(1, 1 + (14 - zoom) * 0.06);
  return Math.round(base * scale * 10) / 10;
}

/* ── Staff color palette ── */
const STAFF_COLORS = [
  { bg: "hsl(220, 70%, 50%)", ring: "hsl(220, 70%, 50%)" },   // blue
  { bg: "hsl(340, 75%, 50%)", ring: "hsl(340, 75%, 50%)" },   // rose
  { bg: "hsl(160, 65%, 40%)", ring: "hsl(160, 65%, 40%)" },   // teal
  { bg: "hsl(30, 85%, 50%)",  ring: "hsl(30, 85%, 50%)" },    // orange
  { bg: "hsl(270, 60%, 55%)", ring: "hsl(270, 60%, 55%)" },   // purple
  { bg: "hsl(50, 80%, 45%)",  ring: "hsl(50, 80%, 45%)" },    // gold
  { bg: "hsl(190, 70%, 45%)", ring: "hsl(190, 70%, 45%)" },   // cyan
  { bg: "hsl(0, 70%, 50%)",   ring: "hsl(0, 70%, 50%)" },     // red
];

/* ── Staff markers (zoom-aware) ── */
function StaffMarkers({
  locations,
  selectedStaffId,
  onSelect,
}: {
  locations: StaffLocation[];
  selectedStaffId: string | null;
  onSelect: (staffId: string, lat: number, lng: number) => void;
}) {
  const zoom = useZoomLevel();

  return (
    <>
      {locations.map((loc, idx) => {
        const color = getStaffColor(idx);
        const isSelected = loc.staff_id === selectedStaffId;
        const labelSize = getLabelSize(zoom);
        return (
          <AdvancedMarker
            key={loc.staff_id}
            position={{ lat: loc.latitude, lng: loc.longitude }}
            title={loc.staff_profiles?.full_name || "Unknown"}
            zIndex={isSelected ? 1000 : 1}
            onClick={() => onSelect(loc.staff_id, loc.latitude, loc.longitude)}
          >
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              filter: isSelected ? "drop-shadow(0 0 8px rgba(255,255,255,0.6))" : "none",
            }}>
              {/* Name label – grows as zoom decreases */}
              <div
                style={{
                  background: color.bg,
                  color: "white",
                  padding: `${Math.max(2, labelSize * 0.2)}px ${Math.max(6, labelSize * 0.7)}px`,
                  borderRadius: "6px",
                  fontSize: `${labelSize}px`,
                  fontWeight: 600,
                  fontFamily: "'Space Grotesk', sans-serif",
                  whiteSpace: "nowrap",
                  boxShadow: isSelected
                    ? `0 0 12px ${color.bg}, 0 2px 6px rgba(0,0,0,0.25)`
                    : "0 2px 6px rgba(0,0,0,0.25)",
                  marginBottom: "4px",
                  transition: "font-size 0.15s ease",
                }}
              >
                {loc.staff_profiles?.full_name || "Unknown"}
              </div>
              {/* GPS dot – shrinks when zooming out to stay geographically accurate */}
              <div
                style={{
                  width: `${Math.max(4, Math.round(12 * Math.min(1, zoom / 14)))}px`,
                  height: `${Math.max(4, Math.round(12 * Math.min(1, zoom / 14)))}px`,
                  borderRadius: "50%",
                  background: color.bg,
                  border: `${Math.max(1, Math.round(2 * Math.min(1, zoom / 14)))}px solid white`,
                  boxShadow: `0 0 0 1px ${color.ring}, 0 1px 4px rgba(0,0,0,0.3)`,
                  transition: "width 0.15s, height 0.15s",
                }}
              />
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
}
function getStaffColor(index: number) {
  return STAFF_COLORS[index % STAFF_COLORS.length];
}

/* ── Main component ── */
const LiveMap = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState(true);
  const [locations, setLocations] = useState<StaffLocation[]>([]);
  const [historyStaff, setHistoryStaff] = useState<{ id: string; name: string } | null>(null);
  const [historyPoints, setHistoryPoints] = useState<HistoryPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Fetch Google Maps API key
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-maps-key");
        if (data?.key) setApiKey(data.key);
        else console.error("Failed to load maps key", error);
      } catch (e) {
        console.error("Error fetching maps key", e);
      } finally {
        setLoadingKey(false);
      }
    })();
  }, []);

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
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setHistoryPoints(data.reverse() as HistoryPoint[]);
    setLoadingHistory(false);
  }, []);

  const showHistory = (staffId: string, name: string) => {
    setHistoryStaff({ id: staffId, name });
    setSelectedStaffId(staffId);
    fetchHistory(staffId);
  };

  const closeHistory = () => {
    setHistoryStaff(null);
    setHistoryPoints([]);
    setSelectedPointId(null);
    setSelectedStaffId(null);
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

  const flyTo = (lat: number, lng: number) => {
    mapInstanceRef.current?.panTo({ lat, lng });
    mapInstanceRef.current?.setZoom(16);
  };

  if (loadingKey) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <p className="text-muted-foreground">Failed to load Google Maps API key.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      <div className="flex-1 rounded-xl overflow-hidden border border-border">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={{ lat: 24.7136, lng: 46.6753 }}
            defaultZoom={6}
            mapId="staff-tracker-map"
            style={{ width: "100%", height: "100%" }}
            gestureHandling="greedy"
            disableDefaultUI={true}
            zoomControl={true}
            fullscreenControl={true}
            mapTypeControl={false}
            streetViewControl={false}
            onIdle={(e) => {
              // Store map instance reference
              if (e.map && !mapInstanceRef.current) {
                mapInstanceRef.current = e.map;
              }
            }}
          >
            <FitOnce locations={locations} />
            <FitHistory points={historyPoints} />
            <PlaceSearch />
            <HistoryOverlay points={historyPoints} selectedPointId={selectedPointId} />

            <StaffMarkers
              locations={locations}
              selectedStaffId={selectedStaffId}
              onSelect={(staffId, lat, lng) => {
                setSelectedStaffId(staffId);
                flyTo(lat, lng);
              }}
            />
          </Map>
        </APIProvider>
      </div>

      {/* Sidebar */}
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
                {[...historyPoints].reverse().map((pt, i) => {
                  const isSelected = pt.id === selectedPointId;
                  return (
                    <div
                      key={pt.id}
                      className={`px-4 py-2.5 cursor-pointer transition-colors border-l-2 ${
                        isSelected
                          ? "bg-primary/10 border-l-primary"
                          : "hover:bg-muted/50 border-l-transparent"
                      }`}
                      onClick={() => {
                        setSelectedPointId(pt.id);
                        flyTo(pt.latitude, pt.longitude);
                      }}
                    >
                      <p className={`text-xs font-medium flex items-center gap-1.5 ${isSelected ? "text-primary" : ""}`}>
                        <CircleDot className={`h-3 w-3 ${isSelected ? "text-destructive" : i === 0 ? "text-green-500" : "text-primary"}`} />
                        {format(new Date(pt.created_at), "MMM d, HH:mm:ss")}
                      </p>
                      <div className="flex items-center mt-0.5 ml-[18px]">
                        <p className="text-xs text-muted-foreground font-mono">
                          {pt.latitude.toFixed(5)}, {pt.longitude.toFixed(5)}
                        </p>
                        <AddressLookup lat={pt.latitude} lng={pt.longitude} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : !locations.length ? (
            <p className="px-4 pb-4 text-xs text-muted-foreground">No locations yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {[...locations]
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                .map((loc, i) => {
                  const isSelected = loc.staff_id === selectedStaffId;
                  const color = getStaffColor(locations.indexOf(loc));
                  return (
                    <div
                      key={loc.staff_id}
                      className={`px-4 py-3 cursor-pointer transition-colors border-l-2 ${
                        isSelected
                          ? "bg-primary/10 border-l-primary"
                          : "hover:bg-muted/50 border-l-transparent"
                      }`}
                      onClick={() => {
                        setSelectedStaffId(loc.staff_id);
                        flyTo(loc.latitude, loc.longitude);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: color.bg }}
                          />
                          <p className={`font-medium text-sm ${isSelected ? "text-primary" : ""}`}>
                            {loc.staff_profiles?.full_name}
                          </p>
                        </div>
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
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 ml-[18px]">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(loc.updated_at), { addSuffix: true })}
                      </p>
                      <div className="flex items-center mt-0.5 ml-[18px]">
                        <p className="text-xs text-muted-foreground font-mono">
                          {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                        </p>
                        <AddressLookup lat={loc.latitude} lng={loc.longitude} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveMap;
