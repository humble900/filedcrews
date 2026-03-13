import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Circle,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  MapPin,
  ArrowRightLeft,
  Move,
  Clock,
  Minus as MinusIcon,
  Plus as PlusIcon,
  Check,
  List,
  Calendar as CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import StaffAvatar from "./StaffAvatar";
import {
  APIProvider,
  Map,
  MapControl,
  ControlPosition,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

/* ── Places search (with pin + close button) ── */
function GeoPlaceSearch() {
  const map = useMap();
  const places = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
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

        const marker = new google.maps.Marker({
          map,
          position: pos,
          title: place.name || place.formatted_address || "Search result",
          animation: google.maps.Animation.DROP,
        });
        markerRef.current = marker;

        class CloseOverlay extends google.maps.OverlayView {
          private div: HTMLDivElement | null = null;
          private position: google.maps.LatLng;
          private onClose: () => void;
          constructor(position: google.maps.LatLng, m: google.maps.Map, onClose: () => void) {
            super();
            this.position = position;
            this.onClose = onClose;
            this.setMap(m);
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

/* ── Types ── */
interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
  check_in_time: string | null;
  check_out_time: string | null;
}

interface GeofenceEvent {
  id: string;
  geofence_id: string;
  staff_id: string;
  event_type: string;
  created_at: string;
  staff_profiles?: { full_name: string; photo_url?: string | null } | null;
}

/* ── Circle overlay using vanilla Maps API ── */
function GeofenceCircles({
  geofences,
  selectedId,
  onSelect,
  excludeId,
}: {
  geofences: Geofence[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  excludeId?: string | null;
}) {
  const map = useMap();
  const circlesRef = useRef<google.maps.Circle[]>([]);

  useEffect(() => {
    if (!map) return;
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    geofences
      .filter((gf) => gf.id !== excludeId)
      .forEach((gf) => {
        const isSelected = gf.id === selectedId;
        const circle = new google.maps.Circle({
          center: { lat: gf.latitude, lng: gf.longitude },
          radius: gf.radius_meters,
          fillColor: gf.is_active
            ? isSelected
              ? "#3b71ca"
              : "#43a047"
            : "#9e9e9e",
          fillOpacity: isSelected ? 0.3 : 0.15,
          strokeColor: gf.is_active
            ? isSelected
              ? "#1e4b8f"
              : "#2e7d32"
            : "#757575",
          strokeWeight: isSelected ? 3 : 2,
          map,
          clickable: true,
        });
        circle.addListener("click", () => onSelect(gf.id));
        circlesRef.current.push(circle);
      });

    return () => {
      circlesRef.current.forEach((c) => c.setMap(null));
    };
  }, [map, geofences, selectedId, onSelect, excludeId]);

  return null;
}

/* ── Editable circle (shown during edit mode) ── */
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

    // Create draggable marker
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
      title: "Drag to move geofence",
    });

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) onCenterChange(pos.lat(), pos.lng());
    });

    // Create circle
    const circle = new google.maps.Circle({
      center,
      radius,
      fillColor: "#3b71ca",
      fillOpacity: 0.2,
      strokeColor: "#1e4b8f",
      strokeWeight: 2,
      strokeOpacity: 0.8,
      map,
      clickable: false,
    });

    markerRef.current = marker;
    circleRef.current = circle;

    return () => {
      marker.setMap(null);
      circle.setMap(null);
    };
  }, [map]); // Only create once

  // Update position
  useEffect(() => {
    if (markerRef.current) markerRef.current.setPosition(center);
    if (circleRef.current) circleRef.current.setCenter(center);
  }, [center]);

  // Update radius
  useEffect(() => {
    if (circleRef.current) circleRef.current.setRadius(radius);
  }, [radius]);

  return null;
}

/* ── Click-to-place ── */
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

/* ── Fit map to geofences ── */
function FitGeofences({ geofences }: { geofences: Geofence[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || geofences.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    geofences.forEach((gf) => bounds.extend({ lat: gf.latitude, lng: gf.longitude }));
    map.fitBounds(bounds, 120);
    // Cap zoom so it doesn't zoom in too much (e.g. single geofence)
    const listener = google.maps.event.addListenerOnce(map, "idle", () => {
      const z = map.getZoom();
      if (z && z > 15) map.setZoom(15);
    });
    return () => google.maps.event.removeListener(listener);
  }, [map, geofences]);

  return null;
}

/* ── Pan to point ── */
function PanTo({ lat, lng, zoom = 14 }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!map || done.current) return;
    map.panTo({ lat, lng });
    map.setZoom(zoom);
    done.current = true;
  }, [map, lat, lng, zoom]);
  return null;
}

/* ── Pan to selected geofence ── */
function PanToGeofence({ geofence }: { geofence: Geofence }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: geofence.latitude, lng: geofence.longitude });
    map.setZoom(16);
  }, [map, geofence.id]);
  return null;
}

/* ── Helper: format duration ── */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/* ── Duration Log component ── */
function DurationLog({ events }: { events: GeofenceEvent[] }) {
  const sessions = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const insideTypes = new Set(["entered", "inside", "logged_in", "logged_in_inside"]);
    const result: {
      staffName: string;
      staffPhotoUrl: string | null;
      state: "inside" | "outside";
      from: Date;
      to: Date | null;
      duration: number | null;
    }[] = [];

    const staffState: globalThis.Map<string, { state: "inside" | "outside"; from: Date; staffName: string; staffPhotoUrl: string | null }> = new globalThis.Map();

    for (const ev of sorted) {
      const isInside = insideTypes.has(ev.event_type);
      const currentState: "inside" | "outside" = isInside ? "inside" : "outside";
      const staffName = ev.staff_profiles?.full_name || "Unknown";
      const staffPhotoUrl = ev.staff_profiles?.photo_url || null;
      const time = new Date(ev.created_at);

      const prev = staffState.get(ev.staff_id);
      if (prev && prev.state !== currentState) {
        result.push({
          staffName: prev.staffName,
          staffPhotoUrl: prev.staffPhotoUrl,
          state: prev.state,
          from: prev.from,
          to: time,
          duration: time.getTime() - prev.from.getTime(),
        });
      }
      staffState.set(ev.staff_id, { state: currentState, from: time, staffName, staffPhotoUrl });
    }

    const now = new Date();
    staffState.forEach((val) => {
      result.push({
        staffName: val.staffName,
        staffPhotoUrl: val.staffPhotoUrl,
        state: val.state,
        from: val.from,
        to: null,
        duration: now.getTime() - val.from.getTime(),
      });
    });

    return result.sort((a, b) => b.from.getTime() - a.from.getTime());
  }, [events]);

  if (sessions.length === 0) {
    return <p className="px-4 py-6 text-xs text-muted-foreground text-center">No duration data available.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {sessions.map((s, i) => (
        <div key={i} className="px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StaffAvatar
                photoUrl={s.staffPhotoUrl}
                fullName={s.staffName}
                size="sm"
              />
              <p className="text-sm font-medium">{s.staffName}</p>
            </div>
            <Badge
              variant={s.state === "inside" ? "default" : "secondary"}
              className={s.state === "inside" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Clock className="h-3 w-3 mr-1" />
              {s.state === "inside" ? "Inside" : "Outside"}
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-muted-foreground">
              {format(s.from, "MMM d, HH:mm")} → {s.to ? format(s.to, "MMM d, HH:mm") : "now"}
            </p>
            <p className="text-xs font-mono font-medium text-foreground">
              {s.duration ? formatDuration(s.duration) : "–"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main component ── */
interface Props {
  apiKey: string;
  onEditModeChange?: (editing: boolean) => void;
  companyId: string;
}

const GeofenceManagement = ({ apiKey, onEditModeChange, companyId }: Props) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  const [events, setEvents] = useState<GeofenceEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Creation flow: step 1 = name dialog, step 2 = placing on map
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [placing, setPlacing] = useState(false);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCenter, setEditCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [editRadius, setEditRadius] = useState(500);

  // Clock-in/out dialog
  const [clockDialogOpen, setClockDialogOpen] = useState(false);
  const [clockInTime, setClockInTime] = useState("");
  const [clockOutTime, setClockOutTime] = useState("");

  // Notify parent about edit mode changes
  useEffect(() => {
    onEditModeChange?.(editMode || placing || nameDialogOpen);
  }, [editMode, placing, nameDialogOpen, onEditModeChange]);

  const fetchGeofences = useCallback(async () => {
    const { data } = await supabase
      .from("geofences")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setGeofences(data as Geofence[]);
  }, []);

  const fetchEvents = useCallback(async (geofenceId: string, date: Date) => {
    setLoadingEvents(true);
    const dayStart = startOfDay(date).toISOString();
    const dayEnd = endOfDay(date).toISOString();
    const { data } = await supabase
      .from("geofence_events")
      .select("*, staff_profiles(full_name, photo_url)")
      .eq("geofence_id", geofenceId)
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd)
      .order("created_at", { ascending: false })
      .limit(500);
    if (data) setEvents(data as GeofenceEvent[]);
    setLoadingEvents(false);
  }, []);

  useEffect(() => {
    fetchGeofences();
  }, [fetchGeofences]);

  // Realtime for events
  useEffect(() => {
    if (!selectedGeofence) return;
    const channel = supabase
      .channel("geofence_events_" + selectedGeofence.id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "geofence_events",
          filter: `geofence_id=eq.${selectedGeofence.id}`,
        },
        () => fetchEvents(selectedGeofence.id, selectedDate)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedGeofence, selectedDate, fetchEvents]);

  // Re-fetch events when date changes
  useEffect(() => {
    if (selectedGeofence) {
      fetchEvents(selectedGeofence.id, selectedDate);
    }
  }, [selectedDate, selectedGeofence, fetchEvents]);

  /* ── Creation flow ── */
  const startCreate = () => {
    setPendingName("");
    setNameDialogOpen(true);
  };

  const confirmName = () => {
    if (!pendingName.trim()) return;
    setNameDialogOpen(false);
    setPlacing(true);
    toast.info("Click on the map to place the geofence");
  };

  const handlePlace = useCallback(
    async (lat: number, lng: number) => {
      setPlacing(false);

      // Insert into DB immediately with 500m default
      const { data, error } = await supabase
        .from("geofences")
        .insert({
          name: pendingName.trim(),
          latitude: lat,
          longitude: lng,
          radius_meters: 500,
          company_id: companyId,
        })
        .select()
        .single();

      if (error || !data) {
        toast.error("Failed to create geofence");
        return;
      }

      toast.success("Geofence created — adjust size and position");
      await fetchGeofences();

      // Enter edit mode
      setEditingId(data.id);
      setEditCenter({ lat, lng });
      setEditRadius(500);
      setEditMode(true);
    },
    [pendingName, fetchGeofences, companyId]
  );

  /* ── Edit mode ── */
  const enterEditMode = (gf: Geofence) => {
    setEditingId(gf.id);
    setEditCenter({ lat: gf.latitude, lng: gf.longitude });
    setEditRadius(gf.radius_meters);
    setEditMode(true);
    setSelectedGeofence(null);
    setEvents([]);
  };

  const handleDone = async () => {
    if (!editingId || !editCenter) return;

    const { error } = await supabase
      .from("geofences")
      .update({
        latitude: editCenter.lat,
        longitude: editCenter.lng,
        radius_meters: editRadius,
      })
      .eq("id", editingId);

    if (error) {
      toast.error("Failed to save geofence");
      return;
    }

    toast.success("Geofence saved");
    setEditMode(false);
    setEditingId(null);
    setEditCenter(null);
    fetchGeofences();
  };

  const adjustRadius = (delta: number) => {
    setEditRadius((prev) => Math.max(10, Math.min(50000, prev + delta)));
  };

  /* ── Other actions ── */
  const toggleActive = async (gf: Geofence) => {
    const { error } = await supabase
      .from("geofences")
      .update({ is_active: !gf.is_active })
      .eq("id", gf.id);
    if (error) toast.error("Failed to toggle geofence");
    else {
      toast.success(`${gf.name} ${!gf.is_active ? "enabled" : "disabled"}`);
      fetchGeofences();
    }
  };

  const deleteGeofence = async (gf: Geofence) => {
    const { error } = await supabase.from("geofences").delete().eq("id", gf.id);
    if (error) toast.error("Failed to delete geofence");
    else {
      toast.success("Geofence deleted");
      if (selectedGeofence?.id === gf.id) {
        setSelectedGeofence(null);
        setEvents([]);
      }
      fetchGeofences();
    }
  };

  const selectGeofence = (gf: Geofence) => {
    setSelectedGeofence(gf);
    fetchEvents(gf.id, selectedDate);
  };

  const editingGeofenceName = editingId
    ? geofences.find((g) => g.id === editingId)?.name ?? "Geofence"
    : "";

  const sidebarContent = (
    <>
      {editMode ? (
        <>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Move className="h-4 w-4" />
              Editing: {editingGeofenceName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Radius
              </label>
              <div className="flex items-center gap-3 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => adjustRadius(editRadius <= 100 ? -10 : editRadius <= 1000 ? -50 : -100)}
                >
                  <MinusIcon className="h-3 w-3" />
                </Button>
                <div className="flex-1">
                  <Slider
                    value={[editRadius]}
                    onValueChange={([v]) => setEditRadius(v)}
                    min={10}
                    max={5000}
                    step={10}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => adjustRadius(editRadius < 100 ? 10 : editRadius < 1000 ? 50 : 100)}
                >
                  <PlusIcon className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-center text-sm font-mono mt-2 text-foreground">
                {editRadius}m
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Position
              </label>
              {editCenter && (
                <p className="text-xs font-mono mt-1 text-muted-foreground">
                  {editCenter.lat.toFixed(6)}, {editCenter.lng.toFixed(6)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Drag the blue dot or use arrows to move
              </p>
              <div className="flex flex-col items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditCenter((prev) => prev ? { ...prev, lat: prev.lat + 0.0005 } : prev)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
                </Button>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditCenter((prev) => prev ? { ...prev, lng: prev.lng - 0.0005 } : prev)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                  </Button>
                  <div className="h-8 w-8 rounded-md border border-border flex items-center justify-center">
                    <Move className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditCenter((prev) => prev ? { ...prev, lng: prev.lng + 0.0005 } : prev)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Button>
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditCenter((prev) => prev ? { ...prev, lat: prev.lat - 0.0005 } : prev)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
                </Button>
              </div>
            </div>

            <Button className="w-full h-12 text-base font-semibold" onClick={handleDone}>
              <Check className="h-5 w-5 mr-2" />
              Done
            </Button>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader className="pb-3">
            {selectedGeofence ? (
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedGeofence(null); setEvents([]); }}>
                    <ArrowLeft className="h-3 w-3" />
                  </Button>
                  {selectedGeofence.name}
                </CardTitle>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Circle className="h-4 w-4" />
                  Geofences ({geofences.length})
                </CardTitle>
                <Button size="sm" variant="outline" onClick={startCreate} disabled={placing}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {selectedGeofence ? (
              <div>
                <div className="px-4 pb-3 border-b border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={selectedGeofence.is_active ? "default" : "secondary"}>
                      {selectedGeofence.is_active ? "Active" : "Disabled"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{selectedGeofence.radius_meters}m radius</span>
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    <Button size="sm" variant="ghost" onClick={() => { enterEditMode(selectedGeofence); if (isMobile) setSidebarOpen(false); }}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setClockInTime(selectedGeofence.check_in_time?.slice(0, 5) || "");
                      setClockOutTime(selectedGeofence.check_out_time?.slice(0, 5) || "");
                      setClockDialogOpen(true);
                    }}>
                      <Clock className="h-3 w-3 mr-1" />
                      Set Clock-In/Out
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(selectedGeofence)}>
                      {selectedGeofence.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteGeofence(selectedGeofence)}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                  {(selectedGeofence.check_in_time || selectedGeofence.check_out_time) && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {selectedGeofence.check_in_time && <span>In: {selectedGeofence.check_in_time.slice(0, 5)}</span>}
                      {selectedGeofence.check_in_time && selectedGeofence.check_out_time && <span>·</span>}
                      {selectedGeofence.check_out_time && <span>Out: {selectedGeofence.check_out_time.slice(0, 5)}</span>}
                    </div>
                  )}
                </div>
                <Tabs defaultValue="crossings" className="w-full">
                  <div className="px-4 py-2 border-b border-border space-y-2">
                    <TabsList className="w-full h-8">
                      <TabsTrigger value="crossings" className="text-xs flex-1">
                        <ArrowRightLeft className="h-3 w-3 mr-1" />
                        Crossings
                      </TabsTrigger>
                      <TabsTrigger value="duration" className="text-xs flex-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Duration
                      </TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs w-full justify-start font-normal">
                            <CalendarIcon className="h-3 w-3 mr-1.5" />
                            {format(selectedDate, "MMM d, yyyy")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(d) => d && setSelectedDate(d)}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      {format(selectedDate, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs shrink-0"
                          onClick={() => setSelectedDate(new Date())}
                        >
                          Today
                        </Button>
                      )}
                    </div>
                  </div>

                  <TabsContent value="crossings" className="mt-0">
                    {loadingEvents ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (() => {
                      const inTypes = new Set(["entered", "inside", "logged_in_inside", "logged_in"]);
                      const outTypes = new Set(["exited", "outside"]);
                      const inEvents = events.filter((ev) => inTypes.has(ev.event_type));
                      const outEvents = events.filter((ev) => outTypes.has(ev.event_type));

                      const renderEvent = (ev: GeofenceEvent, mode: "in" | "out") => {
                        const isEntered = ev.event_type === "entered" || ev.event_type === "inside";
                        const isLoggedInInside = ev.event_type === "logged_in_inside" || ev.event_type === "logged_in";
                        const isExited = ev.event_type === "exited" || ev.event_type === "outside";

                        let badgeClass = "";
                        let label = ev.event_type;
                        if (isEntered) {
                          badgeClass = "bg-green-600 hover:bg-green-700";
                          label = "Entered";
                        } else if (isLoggedInInside) {
                          badgeClass = "bg-blue-600 hover:bg-blue-700";
                          label = "Started inside";
                        } else if (isExited) {
                          badgeClass = "";
                          label = "Exited";
                        }

                        // Late/Early logic
                        let punctualityLabel: string | null = null;
                        let punctualityClass = "";
                        const evTime = new Date(ev.created_at);
                        const evHHMM = `${String(evTime.getHours()).padStart(2, "0")}:${String(evTime.getMinutes()).padStart(2, "0")}`;

                        if (mode === "in" && selectedGeofence?.check_in_time) {
                          const expected = selectedGeofence.check_in_time.slice(0, 5);
                          if (evHHMM < expected) {
                            punctualityLabel = "Early";
                            punctualityClass = "bg-green-100 text-green-800 border-green-200";
                          } else if (evHHMM > expected) {
                            punctualityLabel = "Late";
                            punctualityClass = "bg-red-100 text-red-800 border-red-200";
                          } else {
                            punctualityLabel = "On time";
                            punctualityClass = "bg-green-100 text-green-800 border-green-200";
                          }
                        } else if (mode === "out" && selectedGeofence?.check_out_time) {
                          const expected = selectedGeofence.check_out_time.slice(0, 5);
                          if (evHHMM < expected) {
                            punctualityLabel = "Early";
                            punctualityClass = "bg-orange-100 text-orange-800 border-orange-200";
                          } else if (evHHMM > expected) {
                            punctualityLabel = "Late";
                            punctualityClass = "bg-red-100 text-red-800 border-red-200";
                          } else {
                            punctualityLabel = "On time";
                            punctualityClass = "bg-green-100 text-green-800 border-green-200";
                          }
                        }

                        return (
                          <div key={ev.id} className="px-4 py-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <StaffAvatar
                                  photoUrl={ev.staff_profiles?.photo_url}
                                  fullName={ev.staff_profiles?.full_name || "Unknown"}
                                  size="sm"
                                />
                                <p className="text-sm font-medium">{ev.staff_profiles?.full_name || "Unknown"}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {punctualityLabel && (
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${punctualityClass}`}>
                                    {punctualityLabel}
                                  </span>
                                )}
                                <Badge
                                  variant={isExited ? "secondary" : "default"}
                                  className={badgeClass}
                                >
                                  <ArrowRightLeft className="h-3 w-3 mr-1" />
                                  {label}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(ev.created_at), "MMM d, yyyy – HH:mm:ss")}
                            </p>
                          </div>
                        );
                      };

                      return (
                        <Tabs defaultValue="in" className="w-full">
                          <div className="px-4 py-1.5 border-b border-border">
                            <TabsList className="w-full h-7">
                              <TabsTrigger value="in" className="text-xs flex-1">
                                In ({inEvents.length})
                              </TabsTrigger>
                              <TabsTrigger value="out" className="text-xs flex-1">
                                Out ({outEvents.length})
                              </TabsTrigger>
                            </TabsList>
                          </div>
                          <TabsContent value="in" className="mt-0">
                            {inEvents.length === 0 ? (
                              <p className="px-4 py-6 text-xs text-muted-foreground text-center">No entries detected.</p>
                            ) : (
                              <div className="divide-y divide-border">
                                {inEvents.map((ev) => renderEvent(ev, "in"))}
                              </div>
                            )}
                          </TabsContent>
                          <TabsContent value="out" className="mt-0">
                            {outEvents.length === 0 ? (
                              <p className="px-4 py-6 text-xs text-muted-foreground text-center">No exits detected.</p>
                            ) : (
                              <div className="divide-y divide-border">
                                {outEvents.map((ev) => renderEvent(ev, "out"))}
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      );
                    })()}
                  </TabsContent>

                  <TabsContent value="duration" className="mt-0">
                    {loadingEvents ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : events.length === 0 ? (
                      <p className="px-4 py-6 text-xs text-muted-foreground text-center">No data yet.</p>
                    ) : (
                      <DurationLog events={events} />
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : geofences.length === 0 ? (
              <p className="px-4 pb-4 text-xs text-muted-foreground">No geofences yet. Click "Add" to create one.</p>
            ) : (
              <div className="divide-y divide-border">
                {geofences.map((gf) => (
                  <div key={gf.id} className="px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => selectGeofence(gf)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="font-medium text-sm">{gf.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={gf.is_active} onCheckedChange={() => toggleActive(gf)} onClick={(e) => e.stopPropagation()} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-[22px]">
                      {gf.radius_meters}m radius · Created {format(new Date(gf.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </>
      )}
    </>
  );

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)] relative">
      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden border border-border relative">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={{ lat: 24.7136, lng: 46.6753 }}
            defaultZoom={6}
            mapId="geofence-map"
            style={{ width: "100%", height: "100%" }}
            gestureHandling="greedy"
            disableDefaultUI
            zoomControl
            fullscreenControl
          >
            <GeoPlaceSearch />
            <FitGeofences geofences={geofences} />
            <GeofenceCircles
              geofences={geofences}
              selectedId={selectedGeofence?.id ?? null}
              onSelect={(id) => {
                if (editMode) return;
                const gf = geofences.find((g) => g.id === id);
                if (gf) selectGeofence(gf);
              }}
              excludeId={editMode ? editingId : null}
            />
            {editMode && editCenter && (
              <>
                <EditableCircle center={editCenter} radius={editRadius} onCenterChange={(lat, lng) => setEditCenter({ lat, lng })} />
                <PanTo lat={editCenter.lat} lng={editCenter.lng} />
              </>
            )}
            {placing && <PlacementMode onPlace={handlePlace} />}
            {geofences
              .filter((gf) => gf.id !== editingId || !editMode)
              .map((gf) => (
                <AdvancedMarker key={gf.id} position={{ lat: gf.latitude, lng: gf.longitude }} zIndex={1}>
                  <div style={{
                    background: gf.is_active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    color: "white", padding: "3px 10px", borderRadius: "8px", fontSize: "14px",
                    fontWeight: 600, whiteSpace: "nowrap", boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                    opacity: gf.is_active ? 1 : 0.7,
                  }}>
                    {gf.name}
                  </div>
                </AdvancedMarker>
              ))}
          </Map>
        </APIProvider>

        {placing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 z-10">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Click on the map to place "{pendingName}"</span>
            <span className="sm:hidden">Tap to place</span>
            <Button size="sm" variant="secondary" className="ml-2 h-7" onClick={() => setPlacing(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Mobile: floating button + Sheet */}
      {isMobile ? (
        <>
          {!editMode && (
            <Button
              className="absolute bottom-4 right-4 z-10 h-12 w-12 rounded-full shadow-lg"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <List className="h-5 w-5" />
            </Button>
          )}
          {editMode && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-card border border-border rounded-xl shadow-lg p-4 w-[90vw] max-w-sm">
              {sidebarContent}
            </div>
          )}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="bottom" className="h-[70vh] flex flex-col p-0 overflow-auto">
              <SheetHeader className="sr-only">
                <SheetTitle>Geofences</SheetTitle>
              </SheetHeader>
              {sidebarContent}
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <Card className="w-80 shrink-0 overflow-auto">
          {sidebarContent}
        </Card>
      )}

      {/* Name dialog */}
      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Geofence</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={pendingName}
              onChange={(e) => setPendingName(e.target.value)}
              placeholder="e.g. Office, Warehouse"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") confirmName(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNameDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmName} disabled={!pendingName.trim()}>Next</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clock-In/Out dialog */}
      <Dialog open={clockDialogOpen} onOpenChange={setClockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Clock-In/Out</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Define expected check-in and check-out times for <span className="font-medium text-foreground">{selectedGeofence?.name}</span>. Crossings will be labeled as Early or Late based on these times.
          </p>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Check-In Time</label>
              <Input
                type="time"
                value={clockInTime}
                onChange={(e) => setClockInTime(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Before → "Early" · After → "Late"</p>
            </div>
            <div>
              <label className="text-sm font-medium">Check-Out Time</label>
              <Input
                type="time"
                value={clockOutTime}
                onChange={(e) => setClockOutTime(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Before → "Early" · After → "Late"</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {(selectedGeofence?.check_in_time || selectedGeofence?.check_out_time) && (
              <Button
                variant="outline"
                className="text-destructive mr-auto"
                onClick={async () => {
                  if (!selectedGeofence) return;
                  const { error } = await supabase
                    .from("geofences")
                    .update({ check_in_time: null, check_out_time: null } as any)
                    .eq("id", selectedGeofence.id);
                  if (error) { toast.error("Failed to clear times"); return; }
                  toast.success("Clock-in/out times cleared");
                  setClockDialogOpen(false);
                  fetchGeofences();
                  setSelectedGeofence({ ...selectedGeofence, check_in_time: null, check_out_time: null });
                }}
              >
                Clear
              </Button>
            )}
            <Button variant="outline" onClick={() => setClockDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!selectedGeofence) return;
                const updates: any = {
                  check_in_time: clockInTime || null,
                  check_out_time: clockOutTime || null,
                };
                const { error } = await supabase
                  .from("geofences")
                  .update(updates)
                  .eq("id", selectedGeofence.id);
                if (error) { toast.error("Failed to save times"); return; }
                toast.success("Clock-in/out times saved");
                setClockDialogOpen(false);
                fetchGeofences();
                setSelectedGeofence({ ...selectedGeofence, ...updates });
              }}
              disabled={!clockInTime && !clockOutTime}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeofenceManagement;
