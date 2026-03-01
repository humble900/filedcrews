import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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
  Minus as MinusIcon,
  Plus as PlusIcon,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
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
}

interface GeofenceEvent {
  id: string;
  geofence_id: string;
  staff_id: string;
  event_type: string;
  created_at: string;
  staff_profiles?: { full_name: string } | null;
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
  const hasFitted = useRef(false);

  useEffect(() => {
    if (hasFitted.current || !map || geofences.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    geofences.forEach((gf) => bounds.extend({ lat: gf.latitude, lng: gf.longitude }));
    map.fitBounds(bounds, 60);
    hasFitted.current = true;
  }, [map, geofences]);

  return null;
}

/* ── Pan to point ── */
function PanTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!map || done.current) return;
    map.panTo({ lat, lng });
    map.setZoom(14);
    done.current = true;
  }, [map, lat, lng]);
  return null;
}

/* ── Main component ── */
interface Props {
  apiKey: string;
  onEditModeChange?: (editing: boolean) => void;
}

const GeofenceManagement = ({ apiKey, onEditModeChange }: Props) => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  const [events, setEvents] = useState<GeofenceEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Creation flow: step 1 = name dialog, step 2 = placing on map
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [placing, setPlacing] = useState(false);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCenter, setEditCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [editRadius, setEditRadius] = useState(500);

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

  const fetchEvents = useCallback(async (geofenceId: string) => {
    setLoadingEvents(true);
    const { data } = await supabase
      .from("geofence_events")
      .select("*, staff_profiles(full_name)")
      .eq("geofence_id", geofenceId)
      .order("created_at", { ascending: false })
      .limit(200);
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
        () => fetchEvents(selectedGeofence.id)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedGeofence, fetchEvents]);

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
    [pendingName, fetchGeofences]
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
    fetchEvents(gf.id);
  };

  const editingGeofenceName = editingId
    ? geofences.find((g) => g.id === editingId)?.name ?? "Geofence"
    : "";

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
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

            {/* Edit mode: editable circle + draggable marker */}
            {editMode && editCenter && (
              <>
                <EditableCircle
                  center={editCenter}
                  radius={editRadius}
                  onCenterChange={(lat, lng) => setEditCenter({ lat, lng })}
                />
                <PanTo lat={editCenter.lat} lng={editCenter.lng} />
              </>
            )}

            {/* Placement mode */}
            {placing && <PlacementMode onPlace={handlePlace} />}

            {/* Labels for non-editing geofences */}
            {geofences
              .filter((gf) => gf.id !== editingId || !editMode)
              .map((gf) => (
                <AdvancedMarker
                  key={gf.id}
                  position={{ lat: gf.latitude, lng: gf.longitude }}
                  zIndex={1}
                >
                  <div
                    style={{
                      background: gf.is_active
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted-foreground))",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                      opacity: gf.is_active ? 1 : 0.7,
                    }}
                  >
                    {gf.name}
                  </div>
                </AdvancedMarker>
              ))}
          </Map>
        </APIProvider>

        {/* Placing overlay banner */}
        {placing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 z-10">
            <MapPin className="h-4 w-4" />
            Click on the map to place "{pendingName}"
            <Button
              size="sm"
              variant="secondary"
              className="ml-2 h-7"
              onClick={() => setPlacing(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <Card className="w-80 shrink-0 overflow-auto">
        {editMode ? (
          /* ── Edit mode sidebar ── */
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
                <p className="text-xs text-muted-foreground mt-1">
                  Drag the blue dot on the map to move
                </p>
              </div>

              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={handleDone}
              >
                <Check className="h-5 w-5 mr-2" />
                Done
              </Button>
            </CardContent>
          </>
        ) : (
          /* ── Normal sidebar ── */
          <>
            <CardHeader className="pb-3">
              {selectedGeofence ? (
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setSelectedGeofence(null);
                        setEvents([]);
                      }}
                    >
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={startCreate}
                    disabled={placing}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {selectedGeofence ? (
                /* Event log view */
                <div>
                  <div className="px-4 pb-3 border-b border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          selectedGeofence.is_active ? "default" : "secondary"
                        }
                      >
                        {selectedGeofence.is_active ? "Active" : "Disabled"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {selectedGeofence.radius_meters}m radius
                      </span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => enterEditMode(selectedGeofence)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleActive(selectedGeofence)}
                      >
                        {selectedGeofence.is_active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteGeofence(selectedGeofence)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-xs font-medium text-muted-foreground">
                      Crossing Log ({events.length})
                    </p>
                  </div>

                  {loadingEvents ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : events.length === 0 ? (
                    <p className="px-4 py-6 text-xs text-muted-foreground text-center">
                      No crossings detected yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-border">
                      {events.map((ev) => (
                        <div key={ev.id} className="px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                              {ev.staff_profiles?.full_name || "Unknown"}
                            </p>
                            <Badge
                              variant={
                                ev.event_type === "inside"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                ev.event_type === "inside"
                                  ? "bg-green-600 hover:bg-green-700"
                                  : ""
                              }
                            >
                              <ArrowRightLeft className="h-3 w-3 mr-1" />
                              {ev.event_type === "inside" ? "Entered" : "Exited"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(
                              new Date(ev.created_at),
                              "MMM d, yyyy – HH:mm:ss"
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : /* Geofence list */
              geofences.length === 0 ? (
                <p className="px-4 pb-4 text-xs text-muted-foreground">
                  No geofences yet. Click "Add" to create one.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {geofences.map((gf) => (
                    <div
                      key={gf.id}
                      className="px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => selectGeofence(gf)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="font-medium text-sm">{gf.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={gf.is_active}
                            onCheckedChange={() => toggleActive(gf)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 ml-[22px]">
                        {gf.radius_meters}m radius · Created{" "}
                        {format(new Date(gf.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>

      {/* Name dialog (step 1 of creation) */}
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
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmName();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmName} disabled={!pendingName.trim()}>
              Next
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeofenceManagement;
