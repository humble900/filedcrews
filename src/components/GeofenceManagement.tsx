import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
}: {
  geofences: Geofence[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();
  const circlesRef = useRef<google.maps.Circle[]>([]);

  useEffect(() => {
    if (!map) return;
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    geofences.forEach((gf) => {
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
  }, [map, geofences, selectedId, onSelect]);

  return null;
}

/* ── Click-to-place marker ── */
function PlacementMode({
  onPlace,
}: {
  onPlace: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onPlace(e.latLng.lat(), e.latLng.lng());
      }
    });
    return () => google.maps.event.removeListener(listener);
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

/* ── Main component ── */
interface Props {
  apiKey: string;
}

const GeofenceManagement = ({ apiKey }: Props) => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  const [events, setEvents] = useState<GeofenceEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placedPoint, setPlacedPoint] = useState<{ lat: number; lng: number } | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const [formName, setFormName] = useState("");
  const [formRadius, setFormRadius] = useState("100");

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

  const openCreate = () => {
    setPlacing(true);
    setPlacedPoint(null);
    toast.info("Click on the map to place the geofence center");
  };

  const handlePlace = useCallback((lat: number, lng: number) => {
    setPlacedPoint({ lat, lng });
    setPlacing(false);
    setEditingGeofence(null);
    setFormName("");
    setFormRadius("100");
    setDialogOpen(true);
  }, []);

  const openEdit = (gf: Geofence) => {
    setEditingGeofence(gf);
    setPlacedPoint({ lat: gf.latitude, lng: gf.longitude });
    setFormName(gf.name);
    setFormRadius(String(gf.radius_meters));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !placedPoint) return;
    const radius = parseFloat(formRadius) || 100;

    if (editingGeofence) {
      const { error } = await supabase
        .from("geofences")
        .update({
          name: formName.trim(),
          latitude: placedPoint.lat,
          longitude: placedPoint.lng,
          radius_meters: radius,
        })
        .eq("id", editingGeofence.id);
      if (error) toast.error("Failed to update geofence");
      else toast.success("Geofence updated");
    } else {
      const { error } = await supabase.from("geofences").insert({
        name: formName.trim(),
        latitude: placedPoint.lat,
        longitude: placedPoint.lng,
        radius_meters: radius,
      });
      if (error) toast.error("Failed to create geofence");
      else toast.success("Geofence created");
    }

    setDialogOpen(false);
    setPlacedPoint(null);
    fetchGeofences();
  };

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

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden border border-border">
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
                const gf = geofences.find((g) => g.id === id);
                if (gf) selectGeofence(gf);
              }}
            />

            {/* Placement marker */}
            {placedPoint && (
              <AdvancedMarker position={placedPoint}>
                <div className="w-4 h-4 rounded-full bg-primary border-2 border-primary-foreground shadow-lg" />
              </AdvancedMarker>
            )}

            {placing && <PlacementMode onPlace={handlePlace} />}

            {/* Labels */}
            {geofences.map((gf) => (
              <AdvancedMarker
                key={gf.id}
                position={{ lat: gf.latitude, lng: gf.longitude }}
                zIndex={1}
              >
                <div
                  style={{
                    background: gf.is_active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
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
      </div>

      {/* Sidebar */}
      <Card className="w-80 shrink-0 overflow-auto">
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
              <Button size="sm" variant="outline" onClick={openCreate} disabled={placing}>
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
                  <Badge variant={selectedGeofence.is_active ? "default" : "secondary"}>
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
                    onClick={() => openEdit(selectedGeofence)}
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
                          variant={ev.event_type === "inside" ? "default" : "secondary"}
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
                        {format(new Date(ev.created_at), "MMM d, yyyy – HH:mm:ss")}
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
                        onCheckedChange={(e) => {
                          e; // prevent bubbling handled by click
                          toggleActive(gf);
                        }}
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
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGeofence ? "Edit Geofence" : "New Geofence"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Office, Warehouse"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Radius (meters)</label>
              <Input
                type="number"
                value={formRadius}
                onChange={(e) => setFormRadius(e.target.value)}
                min="10"
                max="50000"
              />
            </div>
            {placedPoint && (
              <p className="text-xs text-muted-foreground font-mono">
                Center: {placedPoint.lat.toFixed(6)}, {placedPoint.lng.toFixed(6)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>
              {editingGeofence ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeofenceManagement;
