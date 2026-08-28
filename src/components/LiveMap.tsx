import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { MapPin, Clock, History, X, CircleDot, Loader2, MapPinHouse, EyeOff, Eye, Users, ArrowRightLeft, CalendarIcon, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Zap } from "lucide-react";
import { formatDistanceToNow, format, startOfDay, endOfDay, addDays, subDays, isToday } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import StaffAvatar from "./StaffAvatar";
import StaffShiftManager from "./StaffShiftManager";

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
  const markerRef = useRef<google.maps.Marker | null>(null);
  const closeRef = useRef<google.maps.OverlayView | null>(null);

  const clearPin = useCallback(() => {
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = null;
    if (closeRef.current) closeRef.current.setMap(null);
    closeRef.current = null;
  }, []);

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const ac = new places.Autocomplete(inputRef.current, {
      fields: ["geometry", "name", "formatted_address"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place.geometry?.location && map) {
        const pos = place.geometry.location;
        map.panTo(pos);
        map.setZoom(15);

        clearPin();

        // Drop a pin
        const marker = new google.maps.Marker({
          map,
          position: pos,
          title: place.name || place.formatted_address || "Search result",
          animation: google.maps.Animation.DROP,
        });
        markerRef.current = marker;

        // Close button overlay
        class CloseOverlay extends google.maps.OverlayView {
          private div: HTMLDivElement | null = null;
          private position: google.maps.LatLng;
          private onClose: () => void;
          constructor(position: google.maps.LatLng, map: google.maps.Map, onClose: () => void) {
            super();
            this.position = position;
            this.onClose = onClose;
            this.setMap(map);
          }
          onAdd() {
            this.div = document.createElement("div");
            this.div.style.cssText = "position:absolute;cursor:pointer;width:18px;height:18px;border-radius:50%;background:hsl(0,0%,15%);display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.3);";
            this.div.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
            this.div.addEventListener("click", (e) => { e.stopPropagation(); this.onClose(); });
            this.getPanes()?.overlayMouseTarget.appendChild(this.div);
          }
          draw() {
            if (!this.div) return;
            const proj = this.getProjection();
            const point = proj.fromLatLngToDivPixel(this.position);
            if (point) {
              this.div.style.left = (point.x + 6) + "px";
              this.div.style.top = (point.y - 42) + "px";
            }
          }
          onRemove() { this.div?.remove(); this.div = null; }
        }

        closeRef.current = new CloseOverlay(pos, map, clearPin);
      }
    });

    autocompleteRef.current = ac;

    return () => {
      google.maps.event.clearInstanceListeners(ac);
      clearPin();
    };
  }, [places, map, clearPin]);

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
    photo_url: string | null;
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
  staffId,
}: {
  points: HistoryPoint[];
  selectedPointId: string | null;
  staffId: string;
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

    const color = getStaffColor(staffId);
    const path = points.map((p) => ({ lat: p.latitude, lng: p.longitude }));
    const poly = new google.maps.Polyline({
      path,
      strokeColor: color.ring,
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
        fillColor: isSelected ? "#e53935" : isLatest ? "#43a047" : color.bg,
        fillOpacity: isSelected ? 1 : 0.9,
        strokeColor: isSelected ? "#c62828" : isLatest ? "#2e7d32" : color.ring,
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
  }, [map, points, selectedPointId, staffId]);

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
      // Cap zoom so it doesn't zoom in too much (e.g. single marker)
      google.maps.event.addListenerOnce(map, "idle", () => {
        const z = map.getZoom();
        if (z && z > 15) map.setZoom(15);
      });
    },
    [map]
  );
}

function FitOnce({
  locations,
  geofences,
  suppressAutoFitOnMount,
}: {
  locations: StaffLocation[];
  geofences: SimpleGeofence[];
  suppressAutoFitOnMount: boolean;
}) {
  const fitBounds = useFitBounds();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (suppressAutoFitOnMount) {
      hasFitted.current = true;
      return;
    }
    if (hasFitted.current) return;

    const coords: { lat: number; lng: number }[] = [];
    locations.forEach((l) => coords.push({ lat: l.latitude, lng: l.longitude }));
    geofences.forEach((g) => coords.push({ lat: g.latitude, lng: g.longitude }));

    if (coords.length === 0) return;
    fitBounds(coords);
    hasFitted.current = true;
  }, [locations, geofences, fitBounds, suppressAutoFitOnMount]);

  return null;
}

function FitHistory({
  points,
  suppressAutoFitOnMount,
}: {
  points: HistoryPoint[];
  suppressAutoFitOnMount: boolean;
}) {
  const fitBounds = useFitBounds();
  const prevLen = useRef(0);

  useEffect(() => {
    if (suppressAutoFitOnMount) {
      prevLen.current = points.length;
      return;
    }
    if (points.length > 1 && points.length !== prevLen.current) {
      fitBounds(points.map((p) => ({ lat: p.latitude, lng: p.longitude })));
      prevLen.current = points.length;
    }
  }, [points, fitBounds, suppressAutoFitOnMount]);

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

/* ── Group nearby consecutive history points ── */
interface HistoryGroup {
  id: string; // first point id (used for selection)
  latitude: number;
  longitude: number;
  accuracy: number | null;
  startTime: string;
  endTime: string;
  pointCount: number;
  pointIds: string[];
}

const PROXIMITY_THRESHOLD = 0.0003; // ~30 meters

function groupHistoryPoints(points: HistoryPoint[]): HistoryGroup[] {
  if (!points.length) return [];
  const groups: HistoryGroup[] = [];
  let current: HistoryGroup = {
    id: points[0].id,
    latitude: points[0].latitude,
    longitude: points[0].longitude,
    accuracy: points[0].accuracy,
    startTime: points[0].created_at,
    endTime: points[0].created_at,
    pointCount: 1,
    pointIds: [points[0].id],
  };

  for (let i = 1; i < points.length; i++) {
    const pt = points[i];
    const dLat = Math.abs(pt.latitude - current.latitude);
    const dLng = Math.abs(pt.longitude - current.longitude);
    if (dLat < PROXIMITY_THRESHOLD && dLng < PROXIMITY_THRESHOLD) {
      current.endTime = pt.created_at;
      current.pointCount++;
      current.pointIds.push(pt.id);
    } else {
      groups.push(current);
      current = {
        id: pt.id,
        latitude: pt.latitude,
        longitude: pt.longitude,
        accuracy: pt.accuracy,
        startTime: pt.created_at,
        endTime: pt.created_at,
        pointCount: 1,
        pointIds: [pt.id],
      };
    }
  }
  groups.push(current);
  return groups;
}

function formatGroupTime(group: HistoryGroup): string {
  const start = new Date(group.startTime);
  const end = new Date(group.endTime);
  const sameDay = format(start, "MMM d") === format(end, "MMM d");
  if (group.startTime === group.endTime) {
    return format(start, "MMM d, HH:mm:ss");
  }
  if (sameDay) {
    return `${format(start, "MMM d, HH:mm")} – ${format(end, "HH:mm")}`;
  }
  return `${format(start, "MMM d, HH:mm")} – ${format(end, "MMM d, HH:mm")}`;
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

/* ── Haversine distance in meters ── */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface SimpleGeofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  ask_for_face_id?: boolean;
}

/* ── Custom Avatar Map Pins with Status Halos ── */
function StaffMarkers({
  locations,
  selectedStaffId,
  onSelect,
  staffGeofenceNames,
}: {
  locations: StaffLocation[];
  selectedStaffId: string | null;
  onSelect: (staffId: string, lat: number, lng: number) => void;
  staffGeofenceNames: Record<string, string>;
}) {
  return (
    <>
      {locations.map((loc) => {
        const isSelected = loc.staff_id === selectedStaffId;
        const isOnline = new Date().getTime() - new Date(loc.updated_at).getTime() < 15 * 60 * 1000;
        const hasPhoto = !!loc.staff_profiles?.photo_url;
        const color = getStaffColor(loc.staff_id);

        return (
          <AdvancedMarker
            key={loc.staff_id}
            position={{ lat: loc.latitude, lng: loc.longitude }}
            title={loc.staff_profiles?.full_name || "Unknown"}
            zIndex={isSelected ? 9999 : 1}
            onClick={() => onSelect(loc.staff_id, loc.latitude, loc.longitude)}
          >
            <div className="relative flex items-center justify-center cursor-pointer group">
              {/* Pulsing Active Ring */}
              {isOnline && (
                <span
                  className="absolute h-10 w-10 rounded-full animate-ping pointer-events-none"
                  style={{ backgroundColor: color.bg, opacity: 0.2 }}
                />
              )}
              
              {/* Circle Avatar */}
              <div
                className="h-9 w-9 rounded-full border-2 bg-slate-950 overflow-hidden flex items-center justify-center z-10 transition-all duration-200 group-hover:scale-105"
                style={{
                  borderColor: color.ring,
                  boxShadow: isOnline 
                    ? `0 0 12px ${color.ring}` 
                    : `0 0 6px ${color.ring}55`,
                }}
              >
                {hasPhoto ? (
                  <img
                    src={loc.staff_profiles!.photo_url!}
                    alt={loc.staff_profiles?.full_name || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-slate-300 uppercase">
                    {(loc.staff_profiles?.full_name || "?").slice(0, 2)}
                  </span>
                )}
              </div>

              {/* Status Dot */}
              <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-slate-950 z-20 ${isOnline ? "bg-emerald-400" : "bg-slate-400"}`} />

              {/* Floating Glassmorphic Label next to pin */}
              <div className="absolute left-full ml-2 py-1 px-2.5 rounded-md bg-slate-950/90 border border-[#233558]/60 shadow-lg backdrop-blur-sm pointer-events-none transition-all duration-200 opacity-90 group-hover:opacity-100">
                <span className="text-[10px] font-bold text-slate-100 whitespace-nowrap block leading-tight">
                  {loc.staff_profiles?.full_name}
                </span>
                {staffGeofenceNames[loc.staff_id] && (
                  <span className="text-[8px] font-semibold text-emerald-400 block mt-0.5 leading-none">
                    📍 {staffGeofenceNames[loc.staff_id]}
                  </span>
                )}
              </div>
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
}
function getStaffColor(staffId: string) {
  if (!staffId) return STAFF_COLORS[0];
  let hash = 0;
  for (let i = 0; i < staffId.length; i++) {
    hash = staffId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % STAFF_COLORS.length;
  return STAFF_COLORS[index];
}

/* ── Geofence circle overlays ── */
function GeofenceCircles({
  geofences,
  selectedId,
  onSelect,
}: {
  geofences: SimpleGeofence[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();
  const circlesRef = useRef<google.maps.Circle[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clear previous circles
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    geofences.forEach((gf) => {
      const isSelected = gf.id === selectedId;
      const circle = new google.maps.Circle({
        center: { lat: gf.latitude, lng: gf.longitude },
        radius: gf.radius_meters,
        fillColor: gf.is_active ? "#10b981" : "#94a3b8",
        fillOpacity: isSelected ? 0.18 : 0.12,
        strokeColor: gf.is_active ? "#10b981" : "#64748b",
        strokeWeight: isSelected ? 2.5 : 1.5,
        map,
        clickable: true,
      });

      circle.addListener("click", () => onSelect(gf.id));
      circlesRef.current.push(circle);
    });

    return () => {
      circlesRef.current.forEach((c) => c.setMap(null));
    };
  }, [map, geofences, selectedId, onSelect]);

  return null;
}

/* ── Editable circle for placement/editing ── */
function EditableCircle({
  center,
  radius,
  onCenterChange,
}: {
  center: { lat: number; lng: number };
  radius: number;
  onCenterChange: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    const marker = new google.maps.Marker({
      map,
      position: center,
      draggable: true,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#3b71ca",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
      zIndex: 9999,
      title: "Drag to move worksite",
    });

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) onCenterChange(pos.lat(), pos.lng());
    });

    const circle = new google.maps.Circle({
      center,
      radius,
      fillColor: "#3b71ca",
      fillOpacity: 0.25,
      strokeColor: "#1e4b8f",
      strokeWeight: 2,
      map,
      clickable: false,
    });

    markerRef.current = marker;
    circleRef.current = circle;

    return () => {
      marker.setMap(null);
      circle.setMap(null);
    };
  }, [map]);

  useEffect(() => {
    if (markerRef.current) markerRef.current.setPosition(center);
    if (circleRef.current) circleRef.current.setCenter(center);
  }, [center]);

  useEffect(() => {
    if (circleRef.current) circleRef.current.setRadius(radius);
  }, [radius]);

  return null;
}

/* ── Placement Mode click handler ── */
function PlacementMode({
  onPlace,
}: {
  onPlace: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.setOptions({ draggableCursor: "crosshair" });
    const listener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onPlace(e.latLng.lat(), e.latLng.lng());
      }
    });
    return () => {
      google.maps.event.removeListener(listener);
      map.setOptions({ draggableCursor: undefined });
    };
  }, [map, onPlace]);

  return null;
}

/* ── Main component ── */
const NORMAL_MAP_ID = "f3ab175d00da0a6b2246ec75";
const CLEAN_MAP_ID = "f3ab175d00da0a6b6e36641d";

interface LiveMapProps {
  apiKey: string;
  onEditModeChange?: (editing: boolean) => void;
  companyId: string;
  projectId?: string;
  projectLatitude?: number;
  projectLongitude?: number;
}

const LiveMap = ({ apiKey, onEditModeChange, companyId, projectId, projectLatitude, projectLongitude }: LiveMapProps) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [locations, setLocations] = useState<StaffLocation[]>([]);
  const [geofences, setGeofences] = useState<SimpleGeofence[]>([]);
  const [selectedGeofenceId, setSelectedGeofenceId] = useState<string | null>(null);
  
  // Geofence placing / editing state variables
  const [isPlacingGeofence, setIsPlacingGeofence] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<SimpleGeofence | null>(null);
  const [newGeofenceName, setNewGeofenceName] = useState("");
  const [newGeofenceRadius, setNewGeofenceRadius] = useState<number>(150);
  const [newGeofenceFaceId, setNewGeofenceFaceId] = useState(false);
  const [newGeofenceCoords, setNewGeofenceCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [newGeofenceActive, setNewGeofenceActive] = useState(true);

  // Map layers states
  const [showStaffLayer, setShowStaffLayer] = useState(true);
  const [showGeofencesLayer, setShowGeofencesLayer] = useState(true);
  const [historyStaff, setHistoryStaff] = useState<{ id: string; name: string } | null>(null);
  const [historyPoints, setHistoryPoints] = useState<HistoryPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [crossings, setCrossings] = useState<{ id: string; event_type: string; created_at: string; geofence_name: string; geofence_id: string }[]>([]);
  const [loadingCrossings, setLoadingCrossings] = useState(false);
  const [staffShifts, setStaffShifts] = useState<{ geofence_id: string; check_in_time: string; check_out_time: string | null }[]>([]);
  const [shiftStaff, setShiftStaff] = useState<{ id: string; name: string } | null>(null);
  const [crossingsDate, setCrossingsDate] = useState<Date>(new Date());
  const [crewJobs, setCrewJobs] = useState<any[]>([]);
  const [loadingCrewJobs, setLoadingCrewJobs] = useState(false);
  const [optimizingRouteState, setOptimizingRouteState] = useState(false);
  
  // Segmented crew status filters and detailed overlay states
  const [crewStatusFilter, setCrewStatusFilter] = useState<"all" | "active" | "offline">("all");
  const [selectedCrewDetails, setSelectedCrewDetails] = useState<StaffLocation | null>(null);

  const filteredCrewLocations = useMemo(() => {
    return locations.filter((loc) => {
      const isOnline = new Date().getTime() - new Date(loc.updated_at).getTime() < 15 * 60 * 1000;
      if (crewStatusFilter === "active") return isOnline;
      if (crewStatusFilter === "offline") return !isOnline;
      return true;
    });
  }, [locations, crewStatusFilter]);

  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Autocomplete ref and states for geofence placement
  const geofenceNameInputRef = useRef<HTMLInputElement>(null);
  const [geofenceAutocomplete, setGeofenceAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const placesLib = useMapsLibrary("places");

  useEffect(() => {
    if (!placesLib || !geofenceNameInputRef.current) return;

    const ac = new placesLib.Autocomplete(geofenceNameInputRef.current, {
      fields: ["geometry", "formatted_address"],
    });
    setGeofenceAutocomplete(ac);
  }, [placesLib, isPlacingGeofence]);

  useEffect(() => {
    if (!geofenceAutocomplete) return;

    const listener = geofenceAutocomplete.addListener("place_changed", () => {
      const place = geofenceAutocomplete.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newCoords = { lat, lng };
        setNewGeofenceCoords(newCoords);
        if (place.formatted_address) {
          setNewGeofenceName(place.formatted_address);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(newCoords);
          mapInstanceRef.current.setZoom(15);
        }
      }
    });

    return () => {
      listener.remove();
    };
  }, [geofenceAutocomplete]);

  // Map style selector (normal = full detail, clean = simplified)
  const [mapStyle, setMapStyle] = useState<"normal" | "clean">("normal");
  const activeMapId = mapStyle === "normal" ? NORMAL_MAP_ID : CLEAN_MAP_ID;

  // Persist zoom/center across style switches
  const savedViewRef = useRef<{ center: { lat: number; lng: number }; zoom: number } | null>(null);
  const [suppressAutoFitOnMount, setSuppressAutoFitOnMount] = useState(false);

  const switchStyle = useCallback((style: "normal" | "clean") => {
    if (style === mapStyle) return;

    const m = mapInstanceRef.current;
    if (m) {
      const center = m.getCenter();
      const zoom = m.getZoom();
      if (center && zoom != null) {
        savedViewRef.current = { center: center.toJSON(), zoom };
        setSuppressAutoFitOnMount(true);
      }
    }

    mapInstanceRef.current = null;
    setMapStyle(style);
  }, [mapStyle]);

  // Hidden staff (persisted in localStorage)
  const [hiddenStaffIds, setHiddenStaffIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("hiddenStaffIds");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const toggleStaffVisibility = useCallback((staffId: string) => {
    setHiddenStaffIds(prev => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      localStorage.setItem("hiddenStaffIds", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const visibleLocations = useMemo(
    () => locations.filter(loc => !hiddenStaffIds.has(loc.staff_id)),
    [locations, hiddenStaffIds]
  );

  const fetchGeofences = useCallback(async () => {
    let query = supabase
      .from("geofences")
      .select("id, name, latitude, longitude, radius_meters, is_active, ask_for_face_id")
      .eq("company_id", companyId);
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    const { data } = await query.order("created_at", { ascending: false });
    if (data) setGeofences(data as SimpleGeofence[]);
  }, [companyId, projectId]);

  // Cancel geofence creation or edit mode
  const cancelGeofenceEdit = useCallback(() => {
    setIsPlacingGeofence(false);
    setEditingGeofence(null);
    setNewGeofenceName("");
    setNewGeofenceRadius(150);
    setNewGeofenceFaceId(false);
    setNewGeofenceCoords(null);
    setNewGeofenceActive(true);
    onEditModeChange?.(false);
  }, [onEditModeChange]);

  // Activate placement/add mode
  const startAddGeofence = () => {
    setIsPlacingGeofence(true);
    setEditingGeofence(null);
    setNewGeofenceName("");
    setNewGeofenceRadius(150);
    setNewGeofenceFaceId(false);
    setNewGeofenceCoords(null);
    setNewGeofenceActive(true);
    onEditModeChange?.(true);
    toast.info("Click anywhere on the map to define the worksite center.");
  };

  // Activate edit mode for an existing geofence
  const startEditGeofence = (gf: SimpleGeofence) => {
    setIsPlacingGeofence(true);
    setEditingGeofence(gf);
    setNewGeofenceName(gf.name);
    setNewGeofenceRadius(gf.radius_meters);
    setNewGeofenceFaceId(!!gf.ask_for_face_id);
    setNewGeofenceCoords({ lat: gf.latitude, lng: gf.longitude });
    setNewGeofenceActive(gf.is_active);
    onEditModeChange?.(true);
    flyTo(gf.latitude, gf.longitude);
  };

  // Save new or updated geofence to the database
  const saveGeofence = async () => {
    if (!newGeofenceName.trim() || !newGeofenceCoords) return;

    try {
      const payload: Record<string, any> = {
        name: newGeofenceName.trim(),
        radius_meters: newGeofenceRadius,
        latitude: newGeofenceCoords.lat,
        longitude: newGeofenceCoords.lng,
        ask_for_face_id: newGeofenceFaceId,
        is_active: newGeofenceActive,
        company_id: companyId,
      };
      // Link geofence to project when creating from project workspace
      if (projectId) {
        payload.project_id = projectId;
      }

      if (editingGeofence) {
        const { error } = await supabase
          .from("geofences")
          .update(payload)
          .eq("id", editingGeofence.id)
          .eq("company_id", companyId);
        if (error) throw error;
        toast.success(`Geofence "${newGeofenceName}" updated successfully.`);
      } else {
        const { error } = await supabase
          .from("geofences")
          .insert(payload);
        if (error) throw error;
        toast.success(`Geofence "${newGeofenceName}" created successfully.`);
      }

      await fetchGeofences();
      cancelGeofenceEdit();
    } catch (err: any) {
      console.error("Error saving geofence:", err);
      toast.error(`Failed to save geofence: ${err.message}`);
    }
  };

  // Delete a geofence
  const deleteGeofence = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete geofence "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from("geofences")
        .delete()
        .eq("id", id)
        .eq("company_id", companyId);
      if (error) throw error;

      toast.success(`Geofence "${name}" deleted.`);
      if (selectedGeofenceId === id) {
        setSelectedGeofenceId(null);
      }
      await fetchGeofences();
    } catch (err: any) {
      console.error("Error deleting geofence:", err);
      toast.error(`Failed to delete geofence: ${err.message}`);
    }
  };

  // Fast toggle geofence active status in the list
  const toggleGeofenceActive = async (id: string, currentStatus: boolean, name: string) => {
    try {
      const { error } = await supabase
        .from("geofences")
        .update({ is_active: !currentStatus })
        .eq("id", id)
        .eq("company_id", companyId);
      if (error) throw error;

      toast.success(`Geofence "${name}" is now ${!currentStatus ? "Active" : "Inactive"}.`);
      await fetchGeofences();
    } catch (err: any) {
      console.error("Error toggling geofence:", err);
      toast.error(`Failed to toggle geofence: ${err.message}`);
    }
  };

  const staffGeofenceNames = useMemo(() => {
    const result: Record<string, string> = {};
    const activeGeos = geofences.filter(g => g.is_active);
    for (const loc of locations) {
      for (const gf of activeGeos) {
        const dist = haversineMeters(loc.latitude, loc.longitude, gf.latitude, gf.longitude);
        if (dist <= gf.radius_meters) {
          result[loc.staff_id] = gf.name;
          break;
        }
      }
    }
    return result;
  }, [locations, geofences]);


  // Fetch project-assigned staff IDs for filtering (only when in project mode)
  const [projectStaffIds, setProjectStaffIds] = useState<Set<string>>(new Set());

  const fetchProjectStaff = useCallback(async () => {
    if (!projectId) return;
    const { data } = await supabase
      .from("project_assignments")
      .select("staff_id")
      .eq("project_id", projectId);
    if (data) setProjectStaffIds(new Set(data.map((d: any) => d.staff_id)));
  }, [projectId]);

  const fetchLocations = useCallback(async () => {
    const { data } = await supabase
      .from("staff_locations")
      .select("*, staff_profiles!inner(full_name, username, is_active, photo_url, company_id)")
      .eq("staff_profiles.is_active", true)
      .eq("staff_profiles.company_id", companyId);
    if (data) {
      let locs = data as unknown as StaffLocation[];
      // In project mode, only show crew assigned to this project
      if (projectId && projectStaffIds.size > 0) {
        locs = locs.filter(loc => projectStaffIds.has(loc.staff_id));
      }
      setLocations(locs);
    }
  }, [companyId, projectId, projectStaffIds]);

  const fetchHistory = useCallback(async (staffId: string) => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("staff_location_history")
      .select("*, staff_profiles!inner(company_id)")
      .eq("staff_id", staffId)
      .eq("staff_profiles.company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setHistoryPoints(data.reverse() as HistoryPoint[]);
    setLoadingHistory(false);
  }, [companyId]);

  const fetchCrossings = useCallback(async (staffId: string) => {
    setLoadingCrossings(true);
    const { data } = await supabase
      .from("geofence_events")
      .select("id, event_type, created_at, geofence_id, geofences!inner(name, company_id, project_id)")
      .eq("staff_id", staffId)
      .eq("geofences.company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) {
      let mapped = (data as any[]).map((e) => ({
        id: e.id,
        event_type: e.event_type,
        created_at: e.created_at,
        geofence_id: e.geofence_id,
        geofence_name: e.geofences?.name ?? "Unknown",
        geofence_project_id: e.geofences?.project_id ?? null,
      }));
      // In project mode, only show crossings for this project's geofences
      if (projectId) {
        mapped = mapped.filter((c) => c.geofence_project_id === projectId);
      }
      setCrossings(mapped);
    }
    setLoadingCrossings(false);
  }, [companyId, projectId]);

  const fetchStaffShifts = useCallback(async (staffId: string) => {
    const { data } = await supabase
      .from("staff_shifts")
      .select("geofence_id, check_in_time, check_out_time, staff_profiles!inner(company_id), geofences(project_id)")
      .eq("staff_id", staffId)
      .eq("staff_profiles.company_id", companyId)
      .eq("is_active", true);
    if (data) {
      let shifts = data as any[];
      // In project mode, only show shifts at this project's geofences
      if (projectId) {
        shifts = shifts.filter((s) => s.geofences?.project_id === projectId);
      }
      setStaffShifts(shifts);
    }
    else setStaffShifts([]);
  }, [companyId, projectId]);

  const fetchCrewJobs = useCallback(async (staffId: string) => {
    setLoadingCrewJobs(true);
    const startOfCurrentDay = startOfDay(crossingsDate).toISOString();
    const endOfCurrentDay = endOfDay(crossingsDate).toISOString();

    const { data } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        status,
        scheduled_start,
        scheduled_end,
        project_id,
        project:projects(
          id,
          name,
          geofences(latitude, longitude, name)
        )
      `)
      .eq("assigned_staff_id", staffId)
      .gte("scheduled_start", startOfCurrentDay)
      .lte("scheduled_start", endOfCurrentDay)
      .order("scheduled_start", { ascending: true });

    if (data) {
      setCrewJobs(data);
    } else {
      setCrewJobs([]);
    }
    setLoadingCrewJobs(false);
  }, [crossingsDate]);

  const handleOptimizeRoute = async () => {
    if (!historyStaff?.id || crewJobs.length <= 1) return;

    setOptimizingRouteState(true);
    try {
      // 1. Map jobs to stops with coordinates
      const stops = crewJobs
        .map((job) => {
          const geofence = job.project?.geofences?.[0];
          if (!geofence) return null;
          return {
            id: job.id,
            latitude: geofence.latitude,
            longitude: geofence.longitude,
            scheduled_start: job.scheduled_start,
            scheduled_end: job.scheduled_end,
          };
        })
        .filter(Boolean) as any[];

      if (stops.length <= 1) {
        toast.error("Not enough jobs with valid coordinates to optimize.");
        setOptimizingRouteState(false);
        return;
      }

      // 2. Solve TSP Route Optimization sequence using our routeSolver algorithm
      const { optimizeRoute: runSolver } = await import("@/lib/routeSolver");
      const optimizedSequence = runSolver(stops);

      // 3. Assign optimized sequential times starting from 9:00 AM on crossingsDate
      const baseDate = new Date(crossingsDate);
      baseDate.setHours(9, 0, 0, 0); // start at 9:00 AM

      let currentHour = baseDate;

      // Update each job in sequence in Supabase
      for (let i = 0; i < optimizedSequence.length; i++) {
        const stop = optimizedSequence[i];
        const job = crewJobs.find((j) => j.id === stop.id);
        if (!job) continue;

        // Keep original duration or default to 1.5 hours
        const originalDuration = job.scheduled_start && job.scheduled_end
          ? new Date(job.scheduled_end).getTime() - new Date(job.scheduled_start).getTime()
          : 90 * 60 * 1000;

        const nextEnd = new Date(currentHour.getTime() + originalDuration);

        // Update database
        const { error } = await supabase
          .from("jobs")
          .update({
            scheduled_start: currentHour.toISOString(),
            scheduled_end: nextEnd.toISOString(),
          })
          .eq("id", job.id);

        if (error) throw error;

        // Set next job start time to 30 mins after this job ends (representing travel time)
        currentHour = new Date(nextEnd.getTime() + 30 * 60 * 1000);
      }

      toast.success("Daily route optimized successfully! Timestamps updated.");
      fetchCrewJobs(historyStaff.id);
    } catch (err: any) {
      console.error(err);
      toast.error(`Route optimization failed: ${err.message}`);
    } finally {
      setOptimizingRouteState(false);
    }
  };

  const showHistory = (staffId: string, name: string) => {
    setHistoryStaff({ id: staffId, name });
    setSelectedStaffId(staffId);
    fetchHistory(staffId);
    fetchCrossings(staffId);
    fetchStaffShifts(staffId);
    fetchCrewJobs(staffId);
  };

  const closeHistory = () => {
    setHistoryStaff(null);
    setHistoryPoints([]);
    setCrossings([]);
    setStaffShifts([]);
    setCrewJobs([]);
    setSelectedPointId(null);
    setSelectedStaffId(null);
  };

  const handleSelectCrew = (loc: StaffLocation) => {
    setSelectedCrewDetails(loc);
    setSelectedStaffId(loc.staff_id);
    flyTo(loc.latitude, loc.longitude);
    
    // Fetch diagnostics background context
    fetchHistory(loc.staff_id);
    fetchCrossings(loc.staff_id);
    fetchStaffShifts(loc.staff_id);
    fetchCrewJobs(loc.staff_id);
  };

  useEffect(() => {
    if (historyStaff?.id) {
      fetchCrewJobs(historyStaff.id);
    }
  }, [crossingsDate, historyStaff?.id, fetchCrewJobs]);

  // Fetch project staff assignments when in project mode
  useEffect(() => {
    if (projectId) fetchProjectStaff();
  }, [projectId, fetchProjectStaff]);

  useEffect(() => {
    fetchLocations();
    fetchGeofences();
    const interval = setInterval(fetchLocations, 8000);
    const uniqueSuffix = Math.random().toString(36).substring(2, 9);
    const channelName = projectId
      ? `staff_locations_project_${projectId}_${uniqueSuffix}`
      : `staff_locations_company_${companyId}_${uniqueSuffix}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_locations" }, () => {
        fetchLocations();
      })
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchLocations, fetchGeofences, projectId]);

  const flyTo = (lat: number, lng: number) => {
    mapInstanceRef.current?.panTo({ lat, lng });
    mapInstanceRef.current?.setZoom(17);
  };

  const sidebarContent = (
    <>
      <div className="pb-3 px-4 pt-4 border-b border-[#233558]/30 bg-slate-900/60 backdrop-blur">
        {historyStaff ? (
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <History className="h-4 w-4 text-blue-400" />
              {historyStaff.name} (History)
            </h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => setShiftStaff(historyStaff)} title="Manage shifts">
                <Clock className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={closeHistory}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h3 className="text-sm font-bold tracking-wide text-slate-100 uppercase text-[11px]">
                Live Command Console
              </h3>
            </div>
            <span className="text-[9px] font-mono bg-slate-900 border border-[#233558]/80 text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
              Syncing
            </span>
          </div>
        )}
      </div>

      <div className="overflow-hidden flex-1 flex flex-col min-h-0 bg-[#070b12]/30">
        {historyStaff ? (
          <Tabs defaultValue="location" className="w-full flex flex-col flex-1 overflow-hidden">
            <div className="px-4 py-2 bg-slate-950/20 border-b border-border/20">
              <TabsList className="w-full h-8 bg-slate-900 border border-[#233558] p-0.5">
                <TabsTrigger value="location" className="text-xs flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <MapPin className="h-3 w-3 mr-1" />
                  Location
                </TabsTrigger>
                <TabsTrigger value="crossings" className="text-xs flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <ArrowRightLeft className="h-3 w-3 mr-1" />
                  Crossings
                </TabsTrigger>
                <TabsTrigger value="route" className="text-xs flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Zap className="h-3 w-3 mr-1" />
                  Route
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="location" className="flex-1 overflow-auto mt-0 outline-none">
              {loadingHistory ? (
                <p className="px-4 py-4 text-xs text-muted-foreground">Loading history…</p>
              ) : !historyPoints.length ? (
                <p className="px-4 py-4 text-xs text-muted-foreground">No history recorded.</p>
              ) : (
                <div className="divide-y divide-border/30">
                  {groupHistoryPoints(historyPoints).reverse().map((group, i) => {
                    const isSelected = group.pointIds.includes(selectedPointId ?? "");
                    return (
                      <div
                        key={group.id}
                        className={`px-4 py-3 cursor-pointer transition-colors border-l-2 ${
                          isSelected
                            ? "bg-primary/10 border-l-primary"
                            : "hover:bg-muted/30 border-l-transparent"
                        }`}
                        onClick={() => {
                          setSelectedPointId(group.id);
                          flyTo(group.latitude, group.longitude);
                          if (isMobile) setSidebarOpen(false);
                        }}
                      >
                        <p className={`text-xs font-medium flex items-center gap-1.5 ${isSelected ? "text-primary" : ""}`}>
                          <CircleDot className={`h-3 w-3 ${isSelected ? "text-destructive" : i === 0 ? "text-green-500" : "text-primary"}`} />
                          {formatGroupTime(group)}
                        </p>
                        {group.pointCount > 1 && (
                          <p className="text-[10px] text-muted-foreground ml-[18px]">
                            {group.pointCount} pings
                          </p>
                        )}
                        <div className="flex items-center mt-0.5 ml-[18px]">
                          <p className="text-xs text-muted-foreground font-mono">
                            {group.latitude.toFixed(5)}, {group.longitude.toFixed(5)}
                          </p>
                          <AddressLookup lat={group.latitude} lng={group.longitude} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            <TabsContent value="crossings" className="flex-1 overflow-auto mt-0 outline-none">
              {/* Date picker */}
              <div className="px-4 py-2 flex items-center gap-1.5 border-b border-border/20 bg-slate-950/20">
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setCrossingsDate(d => subDays(d, 1))}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 flex-1 justify-center bg-transparent border-[#233558]">
                      <CalendarIcon className="h-3 w-3 text-blue-400" />
                      {isToday(crossingsDate) ? "Today" : format(crossingsDate, "MMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={crossingsDate}
                      onSelect={(d) => d && setCrossingsDate(d)}
                      initialFocus
                      className="p-3 pointer-events-auto bg-[#0c121f] border border-[#233558]"
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setCrossingsDate(d => addDays(d, 1))} disabled={isToday(crossingsDate)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                {!isToday(crossingsDate) && (
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 shrink-0" onClick={() => setCrossingsDate(new Date())}>
                    Today
                  </Button>
                )}
              </div>

              {(() => {
                const dayStart = startOfDay(crossingsDate).toISOString();
                const dayEnd = endOfDay(crossingsDate).toISOString();
                const dayCrossings = crossings.filter(c => c.created_at >= dayStart && c.created_at <= dayEnd);

                if (loadingCrossings) return <p className="px-4 py-4 text-xs text-muted-foreground">Loading crossings…</p>;
                if (!dayCrossings.length) return <p className="px-4 py-4 text-xs text-muted-foreground">No crossings on this day.</p>;

                return (
                  <div className="divide-y divide-border/20">
                    {dayCrossings.map((c) => {
                      const date = new Date(c.created_at);
                      const isEntry = c.event_type === "entered";
                      const isExit = c.event_type === "exited";

                      let punctualityLabel: string | null = null;
                      let punctualityClass = "";
                      const shift = staffShifts.find((s) => s.geofence_id === c.geofence_id);
                      if (shift) {
                        const evHHMM = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
                        if (isEntry) {
                          const expected = shift.check_in_time.slice(0, 5);
                          if (evHHMM < expected) { punctualityLabel = "Early"; punctualityClass = "bg-green-500/10 text-green-400 border-green-500/20 text-[10px]"; }
                          else if (evHHMM > expected) { punctualityLabel = "Late"; punctualityClass = "bg-red-500/10 text-red-400 border-red-500/20 text-[10px]"; }
                          else { punctualityLabel = "On time"; punctualityClass = "bg-green-500/10 text-green-400 border-green-500/20 text-[10px]"; }
                        } else if (isExit && shift.check_out_time) {
                          const expected = shift.check_out_time.slice(0, 5);
                          if (evHHMM < expected) { punctualityLabel = "Early"; punctualityClass = "bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px]"; }
                          else if (evHHMM > expected) { punctualityLabel = "Late"; punctualityClass = "bg-red-500/10 text-red-400 border-red-500/20 text-[10px]"; }
                          else { punctualityLabel = "On time"; punctualityClass = "bg-green-500/10 text-green-400 border-green-500/20 text-[10px]"; }
                        }
                      }

                      return (
                        <div key={c.id} className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={isEntry ? "default" : "secondary"}
                              className="text-[9px] px-1.5 py-0"
                            >
                              {isEntry ? "IN" : "OUT"}
                            </Badge>
                            <span className="text-xs font-semibold truncate flex-1 text-slate-100">{c.geofence_name}</span>
                            {punctualityLabel && (
                              <span className={`px-1.5 py-0.5 rounded border font-mono ${punctualityClass}`}>
                                {punctualityLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 ml-[36px]">
                            {format(date, "MMM d, yyyy · HH:mm:ss")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </TabsContent>
            <TabsContent value="route" className="flex-1 overflow-auto mt-0 outline-none">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-border/20 pb-3">
                  <span className="text-xs font-bold text-slate-300">Daily Jobs List</span>
                  {crewJobs.length > 1 && (
                    <Button
                      size="sm"
                      onClick={handleOptimizeRoute}
                      disabled={optimizingRouteState}
                      className="h-7 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-[0_0_10px_rgba(37,99,235,0.2)]"
                    >
                      {optimizingRouteState ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Solving...
                        </>
                      ) : (
                        <>
                          <Zap className="h-3 w-3 text-amber-300" />
                          Optimize Route
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {loadingCrewJobs ? (
                  <p className="text-xs text-muted-foreground">Loading assigned jobs...</p>
                ) : crewJobs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No jobs scheduled for this date.</p>
                ) : (
                  <div className="space-y-3">
                    {crewJobs.map((job, idx) => {
                      const geofence = job.project?.geofences?.[0];
                      const start = job.scheduled_start ? format(new Date(job.scheduled_start), "hh:mm a") : "N/A";
                      const end = job.scheduled_end ? format(new Date(job.scheduled_end), "hh:mm a") : "N/A";

                      return (
                        <div key={job.id} className="p-3 rounded-lg border border-border/40 bg-slate-900/40 relative flex flex-col gap-1.5 hover:border-blue-500/40 transition-colors">
                          <div className="absolute top-3 left-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] h-5 w-5 rounded-full flex items-center justify-center font-bold">
                            {idx + 1}
                          </div>
                          <div className="pl-7">
                            <span className="text-xs font-bold text-slate-200 block truncate">{job.title}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {geofence?.name || "No coordinates set"}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-1 font-semibold">
                              <Clock className="h-3 w-3 text-emerald-500" />
                              {start} - {end}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="crew" className="w-full flex flex-col flex-1 overflow-hidden">
            <div className="px-4 py-3 bg-[#080d19] border-b border-[#233558]/30 shrink-0 z-10 relative">
              <TabsList className="w-full h-8.5 bg-[#0b1324] border border-[#233558]/60 p-0.5 rounded-lg">
                <TabsTrigger value="crew" className="text-xs flex-1 py-1 rounded-md font-bold tracking-wide text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Crew List
                </TabsTrigger>
                <TabsTrigger value="geofences" className="text-xs flex-1 py-1 rounded-md font-bold tracking-wide text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all">
                  <CircleDot className="h-3.5 w-3.5 mr-1.5" />
                  Worksite Zones
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="crew" className="flex-1 mt-0 outline-none overflow-hidden h-full min-h-0">
              <div className="flex flex-col h-full w-full overflow-hidden py-2">
              {/* Segmented Status Filters */}
              <div className="px-3 pb-2.5 pt-0.5 border-b border-[#233558]/20 flex gap-1 shrink-0 bg-[#090e1a] z-10 relative">
                <button
                  onClick={() => setCrewStatusFilter("all")}
                  className={`text-[10px] font-bold h-7 px-2.5 rounded-lg transition-all ${
                    crewStatusFilter === "all"
                      ? "bg-slate-900 border border-[#233558] text-blue-400 font-black shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  All ({locations.length})
                </button>
                <button
                  onClick={() => setCrewStatusFilter("active")}
                  className={`text-[10px] font-bold h-7 px-2.5 rounded-lg transition-all ${
                    crewStatusFilter === "active"
                      ? "bg-slate-900 border border-[#233558] text-emerald-400 font-black shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Active ({locations.filter(l => new Date().getTime() - new Date(l.updated_at).getTime() < 15 * 60 * 1000).length})
                </button>
                <button
                  onClick={() => setCrewStatusFilter("offline")}
                  className={`text-[10px] font-bold h-7 px-2.5 rounded-lg transition-all ${
                    crewStatusFilter === "offline"
                      ? "bg-slate-900 border border-[#233558] text-slate-400 font-black shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Offline ({locations.filter(l => new Date().getTime() - new Date(l.updated_at).getTime() >= 15 * 60 * 1000).length})
                </button>
              </div>

              <div className="flex-1 overflow-auto mt-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#233558]/60 hover:[&::-webkit-scrollbar-thumb]:bg-blue-500/50 [&::-webkit-scrollbar-thumb]:rounded-full">
                {filteredCrewLocations.length === 0 && (
                  <p className="px-4 py-12 text-xs text-muted-foreground text-center">No matching crew locations found.</p>
                )}
                
                {filteredCrewLocations.length > 0 && (
                  <div className="space-y-1">
                    {[...filteredCrewLocations]
                      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                      .map((loc) => {
                        const isSelected = loc.staff_id === selectedStaffId;
                        const isHidden = hiddenStaffIds.has(loc.staff_id);
                        const color = getStaffColor(loc.staff_id);
                        return (
                          <div
                            key={loc.staff_id}
                            className={`group mx-3 my-1 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                              isHidden
                                ? "opacity-40 bg-slate-950/10 border-transparent"
                                : isSelected
                                  ? "bg-blue-600/10 border-blue-500/40 shadow-[0_0_15px_rgba(37,99,235,0.08)]"
                                  : "bg-[#0b1324]/40 border-[#233558]/30 hover:bg-[#0f1b33]/60 hover:border-blue-500/20"
                            }`}
                            onClick={() => {
                              if (isHidden) return;
                              handleSelectCrew(loc);
                              if (isMobile) setSidebarOpen(false);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                  <div className="rounded-full p-0.5 border-2 transition-colors" style={{ borderColor: color.ring }}>
                                    <StaffAvatar
                                      photoUrl={loc.staff_profiles?.photo_url}
                                      fullName={loc.staff_profiles?.full_name || "?"}
                                      size="md"
                                    />
                                  </div>
                                  {!isHidden && (
                                    <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-slate-950 ${
                                      (new Date().getTime() - new Date(loc.updated_at).getTime() < 15 * 60 * 1000)
                                        ? "bg-emerald-500"
                                        : "bg-slate-500"
                                    }`} />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className={`font-bold text-xs tracking-wide truncate max-w-[100px] ${isSelected && !isHidden ? "text-blue-400" : "text-slate-100"}`}>
                                      {loc.staff_profiles?.full_name}
                                    </p>
                                    {(new Date().getTime() - new Date(loc.updated_at).getTime() < 15 * 60 * 1000) ? (
                                      <span className="text-[7.5px] font-bold px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider shrink-0 scale-90">
                                        Active
                                      </span>
                                    ) : (
                                      <span className="text-[7.5px] font-bold px-1 py-0.2 rounded bg-slate-500/10 text-slate-400 border border-slate-500/25 uppercase tracking-wider shrink-0 scale-90">
                                        Offline
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                                    @{loc.staff_profiles?.username}
                                  </span>
                                  
                                  {/* Telemetry Accuracy and Age Warnings */}
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {loc.accuracy && loc.accuracy > 50 && (
                                      <span className="text-[8px] font-bold text-rose-400 bg-rose-500/5 border border-rose-500/15 px-1 py-0.2 rounded uppercase tracking-wide animate-pulse">
                                        ⚠️ GPS Weak
                                      </span>
                                    )}
                                    {(new Date().getTime() - new Date(loc.updated_at).getTime() >= 30 * 60 * 1000) && (
                                      <span className="text-[8px] font-bold text-amber-400 bg-amber-500/5 border border-amber-500/15 px-1 py-0.2 rounded uppercase tracking-wide">
                                        ⚠️ Out of Sync
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action overlay buttons - visible on hover */}
                              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStaffVisibility(loc.staff_id);
                                  }}
                                  title={isHidden ? "Show on map" : "Hide from map"}
                                >
                                  {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                {!isHidden && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShiftStaff({ id: loc.staff_id, name: loc.staff_profiles?.full_name || "Unknown" });
                                      }}
                                      title="Manage shifts"
                                    >
                                      <Clock className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        showHistory(loc.staff_id, loc.staff_profiles?.full_name || "Unknown");
                                      }}
                                      title="View path history"
                                    >
                                      <History className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
              </div>
            </TabsContent>

            <TabsContent value="geofences" className="flex-1 mt-0 outline-none overflow-hidden h-full min-h-0">
              <div className="flex flex-col h-full w-full overflow-hidden py-2 space-y-3">
              {isPlacingGeofence ? (
                /* Geofence Form View */
                <div className="mx-3 space-y-4 border border-[#233558]/40 rounded-xl p-4 bg-slate-950/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    {editingGeofence ? "Modify Geofence Parameters" : "Define Geofence Zone"}
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="gf-name" className="text-xs font-semibold text-slate-300">Worksite / Geofence Name</Label>
                    <Input
                      id="gf-name"
                      ref={geofenceNameInputRef}
                      placeholder="e.g. Lincoln Tower Phase 1"
                      value={newGeofenceName}
                      onChange={(e) => setNewGeofenceName(e.target.value)}
                      className="bg-[#0c121f] border-[#233558] text-slate-100 h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <Label className="text-slate-300">Geofence Radius</Label>
                      <span className="font-mono text-blue-400 font-bold">{newGeofenceRadius} meters</span>
                    </div>
                    <Slider
                      min={100}
                      max={500}
                      step={25}
                      value={[newGeofenceRadius]}
                      onValueChange={([val]) => setNewGeofenceRadius(val)}
                      className="py-2"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-[#233558]/30 pt-3">
                    <div className="space-y-0.5">
                      <Label className="text-xs text-slate-300">Biometric Verification</Label>
                      <p className="text-[9px] text-slate-400 leading-tight">
                        Requires worker selfie on clock-in
                      </p>
                    </div>
                    <Switch
                      checked={newGeofenceFaceId}
                      onCheckedChange={setNewGeofenceFaceId}
                    />
                  </div>
                  
                  {!newGeofenceCoords && (
                    <div className="text-[10px] text-amber-400 leading-normal border border-amber-500/20 bg-amber-500/5 rounded p-2.5">
                      💡 **Map Placement Required**: Double-click or click anywhere on the map to set the center of this geofence circle.
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-[#233558]/30">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelGeofenceEdit}
                      className="flex-1 text-xs border-[#233558] hover:bg-slate-900 bg-transparent text-slate-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveGeofence}
                      disabled={!newGeofenceName.trim() || !newGeofenceCoords}
                      className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-900/40"
                    >
                      Save Zone
                    </Button>
                  </div>
                </div>
              ) : (
                /* Geofence List View */
                <>
                  <div className="px-3 shrink-0 pb-1 pt-0.5">
                    <Button
                      onClick={startAddGeofence}
                      className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-bold tracking-wide shadow-md shadow-blue-900/35 h-9"
                      size="sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Geofence Zone
                    </Button>
                  </div>

                  {!geofences.length ? (
                    <p className="text-xs text-muted-foreground text-center py-12 shrink-0">No worksite geofences created yet.</p>
                  ) : (
                    <div className="flex-1 overflow-auto space-y-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#233558]/60 hover:[&::-webkit-scrollbar-thumb]:bg-blue-500/50 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {geofences.map((gf) => {
                        const isSelected = gf.id === selectedGeofenceId;
                        return (
                          <div
                            key={gf.id}
                            className={`mx-3 my-1 p-2.5 rounded-xl border transition-all duration-200 ${
                              isSelected
                                ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                                : "bg-[#0b1324]/40 border-[#233558]/30 hover:bg-[#0f1b33]/60 hover:border-emerald-500/20"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => {
                                  setSelectedGeofenceId(gf.id);
                                  flyTo(gf.latitude, gf.longitude);
                                }}
                              >
                                <p className="text-xs font-bold text-slate-100 truncate">{gf.name}</p>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <Badge className="text-[9px] px-1.5 py-0 bg-[#0c121f] text-emerald-400 border border-emerald-500/20 font-medium">
                                    Radius: {gf.radius_meters}m
                                  </Badge>
                                  {gf.ask_for_face_id && (
                                    <Badge className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                                      Biometrics
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Switch
                                  checked={gf.is_active}
                                  onCheckedChange={() => toggleGeofenceActive(gf.id, gf.is_active, gf.name)}
                                  className="scale-75 data-[state=checked]:bg-emerald-500"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                                  onClick={() => startEditGeofence(gf)}
                                  title="Edit geofence parameters"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/20"
                                  onClick={() => deleteGeofence(gf.id, gf.name)}
                                  title="Delete geofence"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );

  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
    <div className="flex gap-4 h-[calc(100vh-10rem)] relative">
      <div className="flex-1 rounded-xl overflow-hidden border border-border">
          <Map
            key={mapStyle}
            defaultCenter={savedViewRef.current?.center ?? (projectLatitude && projectLongitude ? { lat: projectLatitude, lng: projectLongitude } : { lat: 24.7136, lng: 46.6753 })}
            defaultZoom={savedViewRef.current?.zoom ?? (projectLatitude && projectLongitude ? 15 : 13)}
            mapId={activeMapId}
            style={{ width: "100%", height: "100%" }}
            gestureHandling="greedy"
            disableDefaultUI={true}
            zoomControl={!isMobile}
            fullscreenControl={true}
            mapTypeControl={false}
            streetViewControl={true}
            onIdle={(e) => {
              if (!e.map) return;
              mapInstanceRef.current = e.map;
              if (suppressAutoFitOnMount) {
                setSuppressAutoFitOnMount(false);
              }
            }}
          >
            <FitOnce locations={visibleLocations} geofences={geofences} suppressAutoFitOnMount={suppressAutoFitOnMount} />
            <FitHistory points={historyPoints} suppressAutoFitOnMount={suppressAutoFitOnMount} />
            <PlaceSearch />
            <HistoryOverlay points={historyPoints} selectedPointId={selectedPointId} staffId={historyStaff?.id || ""} />

            {/* Map Style & Layers Selector */}
            <MapControl position={ControlPosition.TOP_RIGHT}>
              <div className="p-2.5 flex flex-col gap-2 bg-slate-900/90 border border-[#233558] rounded-xl shadow-lg text-slate-100 max-w-[200px]">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Map Theme</span>
                  <div className="flex bg-[#0c121f] p-0.5 rounded-lg border border-[#233558]/60">
                    <button
                      onClick={() => switchStyle("normal")}
                      className={`flex-1 py-1 px-2.5 text-[10px] rounded font-semibold transition-colors ${
                        mapStyle === "normal" ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white"
                      }`}
                    >
                      Default
                    </button>
                    <button
                      onClick={() => switchStyle("clean")}
                      className={`flex-1 py-1 px-2.5 text-[10px] rounded font-semibold transition-colors ${
                        mapStyle === "clean" ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white"
                      }`}
                    >
                      Clean
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-[#233558]/30 pt-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Layers</span>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 flex items-center gap-1"><Users className="h-3 w-3 text-blue-400" /> Crew Pins</span>
                    <Switch
                      checked={showStaffLayer}
                      onCheckedChange={setShowStaffLayer}
                      className="scale-75"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 flex items-center gap-1"><CircleDot className="h-3 w-3 text-emerald-400" /> Geofences</span>
                    <Switch
                      checked={showGeofencesLayer}
                      onCheckedChange={setShowGeofencesLayer}
                      className="scale-75"
                    />
                  </div>
                </div>
              </div>
            </MapControl>

            {/* Geofencing Overlays */}
            {showGeofencesLayer && (
              <GeofenceCircles
                geofences={geofences}
                selectedId={selectedGeofenceId}
                onSelect={(id) => {
                  setSelectedGeofenceId(id);
                  const matched = geofences.find((g) => g.id === id);
                  if (matched) {
                    flyTo(matched.latitude, matched.longitude);
                  }
                }}
              />
            )}

            {showGeofencesLayer && (
              <GeofenceCircles
                geofences={geofences}
                selectedId={selectedGeofenceId}
                onSelect={(id) => {
                  setSelectedGeofenceId(id);
                  const matched = geofences.find((g) => g.id === id);
                  if (matched) {
                    flyTo(matched.latitude, matched.longitude);
                  }
                }}
              />
            )}

            {isPlacingGeofence && newGeofenceCoords && (
              <EditableCircle
                center={newGeofenceCoords}
                radius={newGeofenceRadius}
                onCenterChange={(lat, lng) => setNewGeofenceCoords({ lat, lng })}
              />
            )}

            {isPlacingGeofence && (
              <PlacementMode
                onPlace={(lat, lng) => setNewGeofenceCoords({ lat, lng })}
              />
            )}

            {!historyStaff && showStaffLayer && (
              <StaffMarkers
                locations={visibleLocations}
                selectedStaffId={selectedStaffId}
                staffGeofenceNames={staffGeofenceNames}
                onSelect={(staffId) => {
                  const loc = locations.find(l => l.staff_id === staffId);
                  if (loc) {
                    handleSelectCrew(loc);
                  } else {
                    setSelectedStaffId(staffId);
                  }
                }}
              />
            )}
          </Map>
      </div>

      {/* Mobile: floating button + Sheet */}
      {isMobile ? (
        <>
          <Button
            className="absolute bottom-4 right-4 z-10 h-12 w-12 rounded-full shadow-lg"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Users className="h-5 w-5" />
          </Button>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="bottom" className="h-[70vh] flex flex-col p-0 bg-[#090e1a] border-t border-[#233558]/40 text-slate-100">
              <SheetHeader className="sr-only">
                <SheetTitle>Staff Panel</SheetTitle>
              </SheetHeader>
              {sidebarContent}
            </SheetContent>
          </Sheet>
        </>
      ) : (
        /* Desktop: side panel */
        <div className="w-72 shrink-0 overflow-hidden flex flex-col bg-[#090e1a] border border-[#233558]/40 shadow-2xl rounded-xl">
          {sidebarContent}
        </div>
      )}
      {shiftStaff && (
        <StaffShiftManager
          staffId={shiftStaff.id}
          staffName={shiftStaff.name}
          open={!!shiftStaff}
          onOpenChange={(open) => {
            if (!open) {
              setShiftStaff(null);
              // Re-fetch shifts if viewing crossings
              if (historyStaff) fetchStaffShifts(historyStaff.id);
            }
          }}
        />
      )}

      {/* Telemetry Detail Slide Sheet */}
      <Sheet open={!!selectedCrewDetails} onOpenChange={(open) => !open && setSelectedCrewDetails(null)}>
        <SheetContent side="right" className="w-[380px] bg-slate-950/95 border-l border-[#233558] p-6 text-slate-100 flex flex-col h-full overflow-hidden shadow-2xl z-[9999]">
          <SheetHeader className="pb-4 border-b border-[#233558]/30">
            <SheetTitle className="text-sm font-bold tracking-wide text-slate-100 uppercase flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Telemetry Console
            </SheetTitle>
          </SheetHeader>
          
          {selectedCrewDetails && (
            <div className="flex-1 flex flex-col gap-6 overflow-auto py-4 min-h-0">
              {/* Header profile info */}
              <div className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-[#233558]/30">
                <StaffAvatar
                  photoUrl={selectedCrewDetails.staff_profiles?.photo_url}
                  fullName={selectedCrewDetails.staff_profiles?.full_name || "?"}
                  size="md"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-slate-100 truncate">
                    {selectedCrewDetails.staff_profiles?.full_name}
                  </h4>
                  <span className="text-xs text-slate-400 font-mono block mt-0.5">
                    @{selectedCrewDetails.staff_profiles?.username}
                  </span>
                </div>
              </div>

              {/* GPS Coordinates & Accuracy */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">GPS Coordinates</span>
                <div className="bg-[#080d19] border border-[#233558]/40 rounded-xl p-3.5 flex flex-col gap-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Latitude:</span>
                    <span className="text-slate-200">{selectedCrewDetails.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Longitude:</span>
                    <span className="text-slate-200">{selectedCrewDetails.longitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#233558]/20 pt-1.5 mt-0.5">
                    <span className="text-slate-400">Accuracy:</span>
                    <span className={`font-semibold ${(selectedCrewDetails.accuracy ?? 0) > 50 ? "text-rose-400" : "text-emerald-400"}`}>
                      {selectedCrewDetails.accuracy ? `${selectedCrewDetails.accuracy.toFixed(1)} meters` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Address reverse lookup */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Current Location Address</span>
                <div className="bg-[#080d19] border border-[#233558]/40 rounded-xl p-3.5 text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                  <MapPin className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <AddressLookup lat={selectedCrewDetails.latitude} lng={selectedCrewDetails.longitude} />
                  </div>
                </div>
              </div>

              {/* Playback trigger */}
              <Button
                variant="outline"
                className="w-full text-xs font-bold border-[#233558] hover:bg-slate-900 bg-transparent gap-2 h-9 text-blue-400 hover:text-white"
                onClick={() => {
                  showHistory(selectedCrewDetails.staff_id, selectedCrewDetails.staff_profiles?.full_name || "Unknown");
                  setSelectedCrewDetails(null);
                }}
              >
                <History className="h-3.5 w-3.5" />
                Analyze Route History Path
              </Button>

              {/* Crossings history */}
              <div className="space-y-2 flex-1 flex flex-col min-h-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Recent Boundary Crossings</span>
                <div className="bg-[#080d19] border border-[#233558]/40 rounded-xl flex-1 overflow-auto divide-y divide-[#233558]/20 text-xs min-h-[140px]">
                  {loadingCrossings ? (
                    <p className="p-4 text-xs text-muted-foreground text-center">Loading crossings...</p>
                  ) : !crossings.length ? (
                    <p className="p-4 text-xs text-muted-foreground text-center">No crossings recorded.</p>
                  ) : (
                    crossings.slice(0, 10).map((c) => {
                      const isEntry = c.event_type === "entered";
                      return (
                        <div key={c.id} className="p-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={isEntry ? "default" : "secondary"} className="text-[9px] px-1 py-0 scale-90">
                              {isEntry ? "IN" : "OUT"}
                            </Badge>
                            <span className="font-semibold text-slate-200 truncate max-w-[150px]">{c.geofence_name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {format(new Date(c.created_at), "MMM d, HH:mm")}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
    </APIProvider>
  );
};

export default LiveMap;
