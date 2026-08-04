import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import SEO from "@/components/SEO";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Users,
  Briefcase,
  Search,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";

// ─── Interfaces ─────────────────────────────────────────────────────
interface StaffProfile {
  id: string;
  full_name: string;
  global_role: string | null;
}

interface TimesheetEntry {
  id: string;
  staff_id: string;
  job_id: string | null;
  entry_type: string;
  source: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  approval_status: string;
  notes: string | null;
  staff?: StaffProfile;
  job?: { title: string } | null;
}

export default function TimesheetsPage() {
  const { company, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  // Form states - Timesheet entry
  const [logStaffId, setLogStaffId] = useState("");
  const [logType, setLogType] = useState("onsite");
  const [logStart, setLogStart] = useState("");
  const [logEnd, setLogEnd] = useState("");
  const [logNotes, setLogNotes] = useState("");

  // 1. Fetch Staff Profiles
  const { data: staffList = [] } = useQuery({
    queryKey: ["staff_profiles", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, full_name, global_role")
        .eq("company_id", company.id)
        .order("full_name");
      if (error) throw error;
      return data as StaffProfile[];
    },
    enabled: !!company?.id,
  });

  // 2. Fetch Timesheet entries
  const { data: timesheets = [], isLoading: timesheetsLoading } = useQuery({
    queryKey: ["timesheet_entries", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("timesheet_entries")
        .select(`
          *,
          staff:staff_profiles(id, full_name, global_role),
          job:jobs(title)
        `)
        .order("start_time", { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        staff: t.staff ? (t.staff as StaffProfile) : undefined,
        job: t.job ? { title: t.job.title } : null,
      })) as TimesheetEntry[];
    },
    enabled: !!company?.id,
  });

  // ─── Mutations ───────────────────────────────────────────────────
  const saveEntryMutation = useMutation({
    mutationFn: async () => {
      if (!logStaffId || !logStart) throw new Error("Staff name and start time are required");

      const startTime = new Date(logStart);
      const endTime = logEnd ? new Date(logEnd) : null;
      let duration: number | null = null;
      if (endTime) {
        duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      }

      const { error } = await supabase.from("timesheet_entries").insert({
        staff_id: logStaffId,
        entry_type: logType,
        source: "manual",
        start_time: startTime.toISOString(),
        end_time: endTime ? endTime.toISOString() : null,
        duration_minutes: duration,
        notes: logNotes || null,
        approval_status: "approved",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheet_entries", company?.id] });
      toast({ title: "Timesheet log saved" });
      setLogDialogOpen(false);
      setLogStaffId("");
      setLogNotes("");
      setLogStart("");
      setLogEnd("");
    },
    onError: (err: any) => {
      toast({ title: "Error saving timesheet log", description: err.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("timesheet_entries")
        .update({ approval_status: "approved" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheet_entries", company?.id] });
      toast({ title: "Timesheet entry approved" });
    },
    onError: (err: any) => {
      toast({ title: "Error approving entry", description: err.message, variant: "destructive" });
    },
  });

  // Aggregate stats
  const stats = useMemo(() => {
    const pending = timesheets.filter(t => t.approval_status === "pending").length;
    const totalMinutes = timesheets.reduce((sum, t) => sum + Number(t.duration_minutes || 0), 0);
    const driveMinutes = timesheets.filter(t => t.entry_type === "drive").reduce((sum, t) => sum + Number(t.duration_minutes || 0), 0);
    return { pending, hours: (totalMinutes / 60).toFixed(1), driveHours: (driveMinutes / 60).toFixed(1) };
  }, [timesheets]);

  if (timesheetsLoading) {
    return (
      <DashboardLayout activeTab="timesheets" companyName={company?.name || ""} companyPrefix={company?.prefix || ""} companyId={company?.id || ""}>
        <div className="flex justify-center items-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const filteredTimesheets = timesheets.filter((t) => {
    const q = searchQuery.toLowerCase();
    return !q || (t.staff?.full_name || "").toLowerCase().includes(q);
  });

  return (
    <>
      <SEO
        title="Timesheets & Payroll"
        description="Weekly timesheet approvals, auto-logged drive and onsite tracking, and payroll exports."
        path="/timesheets"
        noIndex
      />
      <DashboardLayout
        activeTab="timesheets"
        companyName={company?.name || ""}
        companyPrefix={company?.prefix || ""}
        companyId={company?.id || ""}
      >
        <div className="p-3 sm:p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Timesheets & Payroll logs
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Monitor auto-tracked work hours, approve drive/onsite durations, and export payrolls.
              </p>
            </div>
            <Button onClick={() => setLogDialogOpen(true)} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Add Manual Entry
            </Button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/40">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Hours Logged</p>
                  <p className="text-2xl font-black text-foreground mt-0.5">{stats.hours} hrs</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider font-semibold">Pending Approvals</p>
                  <p className="text-2xl font-black text-amber-600 mt-0.5">{stats.pending} items</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-violet-500/10 rounded-xl">
                  <UserCheck className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider font-semibold">Drive Time Hours</p>
                  <p className="text-2xl font-black text-violet-600 mt-0.5">{stats.driveHours} hrs</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timesheet Table */}
          <Card className="border-border/50 card-shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Timesheet Entry Log</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by staff profile name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Activity Type</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Reference Job</TableHead>
                    <TableHead>Approval</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTimesheets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                        No timesheet entries found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTimesheets.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-semibold text-slate-800">{t.staff?.full_name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {t.entry_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(t.start_time), "MMM dd, HH:mm")}
                        </TableCell>
                        <TableCell className="text-xs">
                          {t.end_time ? format(new Date(t.end_time), "MMM dd, HH:mm") : "Ongoing"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {t.duration_minutes ? `${(t.duration_minutes / 60).toFixed(2)} hrs` : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {t.job?.title || "None (idle/shop)"}
                        </TableCell>
                        <TableCell>
                          {t.approval_status === "approved" ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-200">Approved</Badge>
                          ) : (
                            <Button size="xs" variant="outline" onClick={() => approveMutation.mutate(t.id)}>
                              Approve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Manual log Dialog */}
        <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Log Manual Time
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Select Technician *</label>
                <Select value={logStaffId} onValueChange={setLogStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.global_role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Activity Type</label>
                <Select value={logType} onValueChange={setLogType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onsite">On-Site Work</SelectItem>
                    <SelectItem value="drive">Drive Time</SelectItem>
                    <SelectItem value="shop">Shop Duties</SelectItem>
                    <SelectItem value="break">Lunch/Break</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Start Date & Time *</label>
                  <Input
                    type="datetime-local"
                    value={logStart}
                    onChange={(e) => setLogStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">End Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={logEnd}
                    onChange={(e) => setLogEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Notes</label>
                <Input
                  placeholder="e.g. Completed maintenance, delay at site"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLogDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => saveEntryMutation.mutate()} disabled={saveEntryMutation.isPending}>
                Save Log
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}
