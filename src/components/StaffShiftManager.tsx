import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Plus, Trash2, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Shift {
  id: string;
  geofence_id: string;
  check_in_time: string;
  check_out_time: string | null;
  is_active: boolean;
  geofence_name?: string;
}

interface Geofence {
  id: string;
  name: string;
}

interface StaffShiftManagerProps {
  staffId: string;
  staffName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StaffShiftManager({
  staffId,
  staffName,
  open,
  onOpenChange,
}: StaffShiftManagerProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // New shift form
  const [newGeofenceId, setNewGeofenceId] = useState("");
  const [newCheckIn, setNewCheckIn] = useState("");
  const [newCheckOut, setNewCheckOut] = useState("");

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("staff_shifts")
      .select("id, geofence_id, check_in_time, check_out_time, is_active, geofences(name)")
      .eq("staff_id", staffId)
      .order("created_at", { ascending: true });

    if (data) {
      setShifts(
        (data as any[]).map((s) => ({
          id: s.id,
          geofence_id: s.geofence_id,
          check_in_time: s.check_in_time,
          check_out_time: s.check_out_time,
          is_active: s.is_active,
          geofence_name: s.geofences?.name ?? "Unknown",
        }))
      );
    }
    setLoading(false);
  }, [staffId]);

  const fetchGeofences = useCallback(async () => {
    const { data } = await supabase
      .from("geofences")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    if (data) setGeofences(data);
  }, []);

  useEffect(() => {
    if (open) {
      fetchShifts();
      fetchGeofences();
    }
  }, [open, fetchShifts, fetchGeofences]);

  const handleAdd = async () => {
    if (!newGeofenceId || !newCheckIn) {
      toast.error("Please select a geofence and check-in time");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("staff_shifts").insert({
      staff_id: staffId,
      geofence_id: newGeofenceId,
      check_in_time: newCheckIn,
      check_out_time: newCheckOut || null,
    } as any);

    if (error) {
      toast.error("Failed to add shift");
    } else {
      toast.success("Shift added");
      setNewGeofenceId("");
      setNewCheckIn("");
      setNewCheckOut("");
      fetchShifts();
    }
    setAdding(false);
  };

  const handleDelete = async (shiftId: string) => {
    const { error } = await supabase
      .from("staff_shifts")
      .delete()
      .eq("id", shiftId);
    if (error) {
      toast.error("Failed to delete shift");
    } else {
      toast.success("Shift removed");
      fetchShifts();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Shifts — {staffName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing shifts */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : shifts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              No shifts defined yet.
            </p>
          ) : (
            <div className="space-y-2">
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {shift.geofence_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 ml-[18px]">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        In: {shift.check_in_time.slice(0, 5)}
                      </Badge>
                      {shift.check_out_time && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Out: {shift.check_out_time.slice(0, 5)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleDelete(shift.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new shift */}
          <div className="border-t border-border pt-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Add Shift
            </p>
            <Select value={newGeofenceId} onValueChange={setNewGeofenceId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select geofence" />
              </SelectTrigger>
              <SelectContent>
                {geofences.map((gf) => (
                  <SelectItem key={gf.id} value={gf.id}>
                    {gf.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">
                  Check-in time *
                </label>
                <Input
                  type="time"
                  value={newCheckIn}
                  onChange={(e) => setNewCheckIn(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Check-out time
                </label>
                <Input
                  type="time"
                  value={newCheckOut}
                  onChange={(e) => setNewCheckOut(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <Button
              className="w-full"
              size="sm"
              onClick={handleAdd}
              disabled={adding || !newGeofenceId || !newCheckIn}
            >
              {adding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Plus className="h-3.5 w-3.5 mr-1" />
              )}
              Add Shift
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
