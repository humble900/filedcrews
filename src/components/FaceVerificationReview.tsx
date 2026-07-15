import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PaginatedTableFull } from "@/components/PaginatedTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, CheckCircle2, XCircle, RefreshCw, Sparkles, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface FaceVerificationReviewProps {
  companyId: string;
}

interface VerificationEvent {
  id: string;
  geofence_name: string;
  staff_id: string;
  staff_name: string;
  staff_username: string;
  staff_ref_photo: string | null;
  event_type: string;
  created_at: string;
  face_check_photo_url: string | null;
  face_check_status: string;
  face_check_at: string | null;
  face_check_confidence: string | null;
  face_check_override_status: string | null;
  face_check_override_by: string | null;
}

export default function FaceVerificationReview({ companyId }: FaceVerificationReviewProps) {
  const { user: currentAdmin } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<VerificationEvent | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Fetch events containing face verification
  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ["face_verification_events", companyId],
    queryFn: async () => {
      // Get all staff belonging to the company first
      const { data: staffData } = await supabase
        .from("staff_profiles")
        .select("id, username, full_name, photo_url")
        .eq("company_id", companyId);

      const staffMap = new Map<string, typeof staffData[0]>();
      staffData?.forEach((s) => staffMap.set(s.id, s));

      const staffIds = staffData?.map((s) => s.id) || [];
      if (staffIds.length === 0) return [];

      // Query geofence events with a face verification status
      const { data: eventsData, error } = await supabase
        .from("geofence_events")
        .select(`
          id,
          geofence_id,
          staff_id,
          event_type,
          created_at,
          face_check_photo_url,
          face_check_status,
          face_check_at,
          face_check_confidence,
          face_check_override_status,
          face_check_override_by,
          geofences (
            name
          )
        `)
        .in("staff_id", staffIds)
        .neq("face_check_status", "not_requested")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (eventsData as any[]).map((e) => {
        const staff = staffMap.get(e.staff_id);
        return {
          ...e,
          staff_name: staff?.full_name ?? "Unknown",
          staff_username: staff?.username ?? "unknown",
          staff_ref_photo: staff?.photo_url ?? null,
          geofence_name: e.geofences?.name ?? "Deleted Geofence",
        };
      });
    },
  });

  // Handle manual override action (Approve/Reject)
  const handleOverride = async (eventId: string, status: "approved" | "rejected" | null) => {
    if (!currentAdmin) return;
    setActioningId(eventId);
    try {
      const { error } = await supabase
        .from("geofence_events")
        .update({
          face_check_override_status: status,
          face_check_override_by: status ? currentAdmin.id : null,
        } as any)
        .eq("id", eventId);

      if (error) throw error;

      toast.success(`Verification status updated to: ${status || "AI original"}`);
      setSelectedEvent(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit override decision");
    } finally {
      setActioningId(null);
    }
  };

  const getStatusBadge = (event: VerificationEvent) => {
    if (event.face_check_override_status) {
      return event.face_check_override_status === "approved" ? (
        <Badge className="bg-blue-500 hover:bg-blue-600">Manual Approved</Badge>
      ) : (
        <Badge variant="destructive">Manual Rejected</Badge>
      );
    }

    switch (event.face_check_status) {
      case "verified":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">AI Verified</Badge>;
      case "mismatch":
        return <Badge variant="destructive">AI Mismatch</Badge>;
      case "requested":
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Selfie Pending</Badge>;
      default:
        return <Badge variant="secondary">{event.face_check_status}</Badge>;
    }
  };

  return (
    <Card className="border-border/50 card-shadow-md">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Face Check Verification Audit
          </CardTitle>
          <CardDescription>
            Inspect AI verification decisions and manually override face mismatches.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        <PaginatedTableFull
          data={events}
          renderTable={(paginatedItems) => (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Geofence Site</TableHead>
                  <TableHead>AI Status</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Loading face checks...
                    </TableCell>
                  </TableRow>
                ) : paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No face verification records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((event) => (
                    <TableRow
                      key={event.id}
                      className={`hover:bg-muted/10 ${event.face_check_status === "mismatch" && !event.face_check_override_status ? "bg-red-500/5" : ""}`}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(event.created_at), "yyyy-MM-dd HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-sm">{event.staff_name}</span>
                          <span className="text-xs text-muted-foreground">@{event.staff_username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{event.geofence_name}</TableCell>
                      <TableCell>
                        <Badge variant={event.face_check_status === "mismatch" ? "destructive" : "outline"}>
                          {event.face_check_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm capitalize">{event.face_check_confidence || "n/a"}</TableCell>
                      <TableCell>{getStatusBadge(event)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(event)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        />
      </CardContent>

      {/* Inspection Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Inspect Face Verification — {selectedEvent.staff_name}
              </DialogTitle>
              <CardDescription>
                Compare the registered profile photo with the selfie uploaded at the geofence site.
              </CardDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Reference Photo */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground text-center">
                  Official Profile Reference
                </h4>
                <div className="aspect-square rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center">
                  {selectedEvent.staff_ref_photo ? (
                    <img
                      src={selectedEvent.staff_ref_photo}
                      alt="Profile Reference"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">No reference photo</span>
                  )}
                </div>
              </div>

              {/* Uploaded Selfie */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground text-center">
                  Uploaded Selfie (Check-In)
                </h4>
                <div className="aspect-square rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center">
                  {selectedEvent.face_check_photo_url ? (
                    <img
                      src={selectedEvent.face_check_photo_url}
                      alt="Uploaded Check-In"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">No check-in selfie uploaded</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Diagnostics details */}
            <div className="rounded-lg bg-muted/50 p-4 border border-border space-y-1.5 text-sm">
              <div>
                <strong className="text-foreground">Geofence Site:</strong> {selectedEvent.geofence_name}
              </div>
              <div>
                <strong className="text-foreground">Event Trigger:</strong> {selectedEvent.event_type} at{" "}
                {format(new Date(selectedEvent.created_at), "yyyy-MM-dd HH:mm:ss")}
              </div>
              <div className="flex items-center gap-2">
                <strong className="text-foreground">AI Status:</strong>
                <Badge variant={selectedEvent.face_check_status === "mismatch" ? "destructive" : "default"}>
                  {selectedEvent.face_check_status}
                </Badge>
                {selectedEvent.face_check_confidence && (
                  <span className="text-xs text-muted-foreground">({selectedEvent.face_check_confidence} confidence)</span>
                )}
              </div>
              {selectedEvent.face_check_override_status && (
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  <strong>Manual Action:</strong> Manually {selectedEvent.face_check_override_status} by admin
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="sm:mr-auto"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </Button>
              {selectedEvent.face_check_override_status && (
                <Button
                  variant="ghost"
                  disabled={actioningId === selectedEvent.id}
                  onClick={() => handleOverride(selectedEvent.id, null)}
                  className="text-muted-foreground"
                >
                  Reset to AI status
                </Button>
              )}
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                disabled={actioningId === selectedEvent.id || selectedEvent.face_check_override_status === "rejected"}
                onClick={() => handleOverride(selectedEvent.id, "rejected")}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Reject Match
              </Button>
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-500"
                disabled={actioningId === selectedEvent.id || selectedEvent.face_check_override_status === "approved"}
                onClick={() => handleOverride(selectedEvent.id, "approved")}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Approve Match
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
