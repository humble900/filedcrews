import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginatedTableFull } from "@/components/PaginatedTable";
import FilterChipBar, { FilterChip } from "@/components/FilterChipBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Calendar, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface GeofenceHistoryProps {
  companyId: string;
  projectId?: string;
}

export default function GeofenceHistory({ companyId, projectId }: GeofenceHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGeofence, setSelectedGeofence] = useState("all");
  const [selectedEventType, setSelectedEventType] = useState("all");
  const [selectedFaceStatus, setSelectedFaceStatus] = useState("all");

  // 1. Fetch geofences for filters (scoped to project when in project mode)
  const { data: geofences = [] } = useQuery({
    queryKey: ["history_geofences", companyId, projectId],
    queryFn: async () => {
      let query = supabase
        .from("geofences")
        .select("id, name")
        .eq("company_id", companyId);
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      const { data, error } = await query.order("name");
      if (error) throw error;
      return data;
    },
  });

  // 2. Fetch history events (scoped to project staff when in project mode)
  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ["geofence_history_events", companyId, projectId],
    queryFn: async () => {
      // Get staff — either project-assigned or all company staff
      let staffQuery = supabase
        .from("staff_profiles")
        .select("id, username, full_name, photo_url")
        .eq("company_id", companyId);

      let staffIds: string[] = [];
      if (projectId) {
        // Only project-assigned staff
        const { data: assignments } = await supabase
          .from("project_assignments")
          .select("staff_id")
          .eq("project_id", projectId);
        staffIds = assignments?.map((a: any) => a.staff_id) || [];
        if (staffIds.length > 0) {
          staffQuery = staffQuery.in("id", staffIds);
        }
      }

      const { data: staffData } = await staffQuery;

      const staffMap = new Map<string, typeof staffData[0]>();
      staffData?.forEach((s) => staffMap.set(s.id, s));

      const finalStaffIds = staffData?.map((s) => s.id) || [];
      if (finalStaffIds.length === 0) return [];

      // Query geofence events
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
          geofences (
            name
          )
        `)
        .in("staff_id", finalStaffIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (eventsData as any[]).map((e) => {
        const staff = staffMap.get(e.staff_id);
        return {
          ...e,
          staff_name: staff?.full_name ?? "Unknown",
          staff_username: staff?.username ?? "unknown",
          geofence_name: e.geofences?.name ?? "Deleted Geofence",
        };
      });
    },
  });

  // Apply frontend filters
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.staff_username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGeofence = selectedGeofence === "all" || e.geofence_id === selectedGeofence;
    const matchesEventType = selectedEventType === "all" || e.event_type === selectedEventType;
    const matchesFaceStatus = selectedFaceStatus === "all" || e.face_check_status === selectedFaceStatus;

    return matchesSearch && matchesGeofence && matchesEventType && matchesFaceStatus;
  });

  // Export filtered logs to CSV
  const handleExport = () => {
    if (filteredEvents.length === 0) {
      toast.error("No events to export");
      return;
    }

    const headers = [
      "Date/Time",
      "Staff Member",
      "Username",
      "Geofence",
      "Event Type",
      "Face Check Status",
      "Confidence",
      "Override Status",
    ];

    const rows = filteredEvents.map((e) => [
      format(new Date(e.created_at), "yyyy-MM-dd HH:mm:ss"),
      e.staff_name,
      `@${e.staff_username}`,
      e.geofence_name,
      e.event_type,
      e.face_check_status || "n/a",
      e.face_check_confidence || "n/a",
      e.face_check_override_status || "n/a",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((val) => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ocrem_Logs_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV log exported successfully");
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case "entered":
      case "inside":
      case "logged_in_inside":
        return <Badge className="bg-green-500 hover:bg-green-600">{type}</Badge>;
      case "exited":
      case "outside":
      case "logged_in_outside":
        return <Badge variant="secondary">{type}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getFaceStatusBadge = (status: string, override: string) => {
    if (override) {
      return (
        <div className="flex flex-col items-start gap-1">
          <Badge className="bg-blue-500 hover:bg-blue-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Manually Override
          </Badge>
          <span className="text-[10px] text-muted-foreground font-mono">({override})</span>
        </div>
      );
    }

    switch (status) {
      case "verified":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Verified
          </Badge>
        );
      case "mismatch":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Mismatch
          </Badge>
        );
      case "requested":
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Selfie Requested</Badge>;
      default:
        return <Badge variant="secondary">Not Requested</Badge>;
    }
  };

  return (
    <Card className="border-border/50 card-shadow-md">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Geofence Activity Log
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit history of geofence entry and exit logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="default" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <FilterChipBar
            hasActiveFilters={selectedGeofence !== "all" || selectedEventType !== "all" || selectedFaceStatus !== "all"}
            onClearAll={() => {
              setSelectedGeofence("all");
              setSelectedEventType("all");
              setSelectedFaceStatus("all");
            }}
          >
            <FilterChip
              label="All Geofences"
              selectedValue={selectedGeofence}
              options={geofences.map((gf) => ({ label: gf.name, value: gf.id }))}
              onSelect={setSelectedGeofence}
              onClear={() => setSelectedGeofence("all")}
            />
            <FilterChip
              label="All Event Types"
              selectedValue={selectedEventType}
              options={[
                { label: "Entered", value: "entered" },
                { label: "Exited", value: "exited" },
                { label: "Logged In (Inside)", value: "logged_in_inside" },
                { label: "Logged In (Outside)", value: "logged_in_outside" },
              ]}
              onSelect={setSelectedEventType}
              onClear={() => setSelectedEventType("all")}
            />
            <FilterChip
              label="All Face Checks"
              selectedValue={selectedFaceStatus}
              options={[
                { label: "Verified", value: "verified" },
                { label: "Mismatch", value: "mismatch" },
                { label: "Requested", value: "requested" },
                { label: "Not Requested", value: "not_requested" },
              ]}
              onSelect={setSelectedFaceStatus}
              onClear={() => setSelectedFaceStatus("all")}
            />
          </FilterChipBar>
        </div>

        <PaginatedTableFull
          data={filteredEvents}
          renderTable={(paginatedItems) => (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Geofence Site</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Face Verification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading logs...
                    </TableCell>
                  </TableRow>
                ) : paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No activity logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((event) => (
                    <TableRow key={event.id} className="hover:bg-muted/10">
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(event.created_at), "yyyy-MM-dd HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-sm">{event.staff_name}</span>
                          <span className="text-xs text-muted-foreground">@{event.staff_username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{event.geofence_name}</TableCell>
                      <TableCell>{getEventBadge(event.event_type)}</TableCell>
                      <TableCell>{getFaceStatusBadge(event.face_check_status, event.face_check_override_status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        />
      </CardContent>
    </Card>
  );
}
