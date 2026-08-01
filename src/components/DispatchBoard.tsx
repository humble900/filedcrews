import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, ClipboardList, UserCheck, ArrowRight, UserPlus, AlertCircle, AlertTriangle, ShieldCheck, MapPin, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";


interface DispatchBoardProps {
  companyId: string;
  projectId?: string;
}

export default function DispatchBoard({ companyId, projectId }: DispatchBoardProps) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  // 1. Fetch Staff Directory
  const { data: staffList = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ["dispatch_staff", companyId, projectId],
    queryFn: async () => {
      let query = supabase
        .from("staff_profiles")
        .select("id, full_name, username, job_title, is_active")
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (projectId) {
        const { data: assignments } = await supabase
          .from("project_assignments")
          .select("staff_id")
          .eq("project_id", projectId);
        const assignedIds = assignments?.map((a: any) => a.staff_id) || [];
        if (assignedIds.length > 0) {
          query = query.in("id", assignedIds);
        } else {
          return [];
        }
      }

      const { data, error } = await query.order("full_name");
      if (error) throw error;
      return data || [];
    },
  });

  // 2. Fetch Shifts for Today to detect availability
  const { data: todayShifts = [] } = useQuery({
    queryKey: ["dispatch_shifts", companyId, selectedDate, projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_shifts")
        .select("id, staff_id, geofence_id, shift_date, check_in_time, check_out_time, geofences(name, project_id)")
        .eq("shift_date", selectedDate);
      if (error) return [];

      let finalShifts = data || [];
      if (projectId) {
        finalShifts = finalShifts.filter((s: any) => s.geofences?.project_id === projectId);
      }
      return finalShifts;
    },
  });

  // 3. Fetch Work Orders (Jobs)
  const { data: workOrders = [], isLoading: isLoadingJobs, refetch: refetchJobs } = useQuery({
    queryKey: ["dispatch_jobs", companyId, projectId],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select(`
          id,
          project_id,
          customer_id,
          title,
          status,
          description,
          scheduled_start,
          scheduled_end,
          assigned_staff_id,
          priority,
          projects(name),
          customers(name)
        `);

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query.order("scheduled_start", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // 4. Mutation to assign staff member to a work order
  const assignStaffMutation = useMutation({
    mutationFn: async ({ jobId, staffId }: { jobId: string; staffId: string | null }) => {
      const { error } = await supabase
        .from("jobs")
        .update({ assigned_staff_id: staffId })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Work order assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["dispatch_jobs"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to assign work order");
    },
  });

  // 5. Mutation to change priority
  const updatePriorityMutation = useMutation({
    mutationFn: async ({ jobId, priority }: { jobId: string; priority: string }) => {
      const { error } = await supabase
        .from("jobs")
        .update({ priority })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Priority updated");
      queryClient.invalidateQueries({ queryKey: ["dispatch_jobs"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update priority");
    },
  });

  const unassignedOrders = workOrders.filter((w) => !w.assigned_staff_id);
  const assignedOrders = workOrders.filter((w) => w.assigned_staff_id);

  // Helper to check staff status
  const getStaffStatus = (staffId: string) => {
    const shift = todayShifts.find((s) => s.staff_id === staffId);
    if (!shift) return { status: "offline", label: "No Shift Scheduled" };
    if (shift.check_out_time) return { status: "completed", label: "Shift Completed" };
    return { status: "active", label: `On Duty: ${shift.geofences?.name || "Site"}` };
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "Urgent": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "High": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Normal": return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "Low": return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const [mobileTab, setMobileTab] = useState<"unassigned" | "staff" | "dispatched">("unassigned");

  if (isLoadingStaff || isLoadingJobs) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upper Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20 p-4 rounded-lg border border-border/40">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Live Dispatch Panel
          </h3>
          <p className="text-xs text-muted-foreground">
            Match field staff shifts with incoming customer work orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Availability Date:</span>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-8 text-xs w-36 bg-background"
          />
        </div>
      </div>

      {/* Mobile-only Column Selector Tabs */}
      <div className="flex lg:hidden bg-muted/40 p-1 rounded-xl border border-border/50 gap-1 text-xs">
        <button
          onClick={() => setMobileTab("unassigned")}
          className={`flex-1 py-2 px-2 font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
            mobileTab === "unassigned" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm" : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          <ClipboardList className="h-3.5 w-3.5" />
          Unassigned ({unassignedOrders.length})
        </button>
        <button
          onClick={() => setMobileTab("staff")}
          className={`flex-1 py-2 px-2 font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
            mobileTab === "staff" ? "bg-primary/20 text-primary border border-primary/30 shadow-sm" : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Staff ({staffList.length})
        </button>
        <button
          onClick={() => setMobileTab("dispatched")}
          className={`flex-1 py-2 px-2 font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
            mobileTab === "dispatched" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm" : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          Dispatched ({assignedOrders.length})
        </button>
      </div>

      {/* Main Board Layout: Mobile Horizontal Sliding / Desktop 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Unassigned Work Orders */}
        <div className={`space-y-4 ${mobileTab === "unassigned" ? "block" : "hidden lg:block"}`}>
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-rose-400">
              <ClipboardList className="h-4 w-4" />
              Unassigned Orders ({unassignedOrders.length})
            </h4>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const jobId = e.dataTransfer.getData("text/plain");
              if (jobId) {
                assignStaffMutation.mutate({ jobId, staffId: null });
              }
            }}
            className="space-y-3 max-h-[600px] overflow-y-auto pr-1 min-h-[200px]"
          >
            {unassignedOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 bg-muted/10 rounded-lg border border-dashed">
                All work orders dispatched!
              </p>
            ) : (
              unassignedOrders.map((wo) => (
                <Card
                  key={wo.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", wo.id)}
                  className="border-border/50 bg-card hover:border-border transition-all cursor-grab active:cursor-grabbing hover:shadow-sm"
                >
                  <CardHeader className="p-3 pb-1.5 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-xs text-foreground line-clamp-2">{wo.title}</h5>
                      <Select
                        value={wo.priority || "Normal"}
                        onValueChange={(val) => updatePriorityMutation.mutate({ jobId: wo.id, priority: val })}
                      >
                        <SelectTrigger className="h-5 text-[9px] w-18 px-1.5 border-0 bg-transparent shadow-none hover:bg-muted/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Urgent", "High", "Normal", "Low"].map((p) => (
                            <SelectItem key={p} value={p} className="text-[10px]">{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${getPriorityColor(wo.priority || "Normal")}`}>
                        {wo.priority || "Normal"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {wo.projects?.name}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-1 space-y-3">
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {wo.description || "No description provided."}
                    </p>

                    <div className="pt-2 border-t flex items-center justify-between gap-2">
                      <span className="text-[10px] text-foreground font-semibold truncate">
                        {wo.customers?.name || "No Customer"}
                      </span>
                      <Select
                        value="assign"
                        onValueChange={(val) => {
                          if (val !== "assign") {
                            assignStaffMutation.mutate({ jobId: wo.id, staffId: val });
                          }
                        }}
                      >
                        <SelectTrigger className="h-7 text-[10px] w-32 bg-indigo-600 hover:bg-indigo-700 text-white border-none font-bold">
                          <SelectValue placeholder="Dispatch Staff" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assign" disabled className="text-xs text-muted-foreground">
                            Dispatch Staff
                          </SelectItem>
                          {staffList.map((s) => {
                            const availability = getStaffStatus(s.id);
                            return (
                              <SelectItem key={s.id} value={s.id} className="text-xs">
                                <div className="flex items-center gap-2">
                                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                    availability.status === "active" ? "bg-emerald-400" :
                                    availability.status === "completed" ? "bg-slate-400" : "bg-rose-400"
                                  }`} />
                                  <span>{s.full_name}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Staff Directory & Shift Status */}
        <div className={`space-y-4 ${mobileTab === "staff" ? "block" : "hidden lg:block"}`}>
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
              <Users className="h-4 w-4" />
              Staff Capacity & Shifts ({staffList.length})
            </h4>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {staffList.map((staff) => {
              const availability = getStaffStatus(staff.id);
              const staffJobs = workOrders.filter((w) => w.assigned_staff_id === staff.id);

              return (
                <Card
                  key={staff.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const jobId = e.dataTransfer.getData("text/plain");
                    if (jobId) {
                      assignStaffMutation.mutate({ jobId, staffId: staff.id });
                    }
                  }}
                  className={`border-border/40 transition-all ${
                    availability.status === "active" ? "bg-emerald-500/5 border-emerald-500/20" :
                    availability.status === "completed" ? "bg-slate-500/5" : "bg-muted/10 opacity-70"
                  } hover:bg-muted/30`}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${
                            availability.status === "active" ? "bg-emerald-400 animate-pulse" :
                            availability.status === "completed" ? "bg-slate-400" : "bg-rose-400"
                          }`} />
                          {staff.full_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">@{staff.username} • {staff.job_title || "Field Crew"}</p>
                      </div>
                      <Badge variant="outline" className={`text-[9px] ${
                        availability.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        availability.status === "completed" ? "bg-slate-500/10 text-slate-400 border-slate-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}>
                        {availability.label}
                      </Badge>
                    </div>

                    {/* Assigned Jobs Summary */}
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                        Active Dispatch ({staffJobs.length})
                      </p>
                      {staffJobs.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic">No work orders assigned.</p>
                      ) : (
                        <div className="space-y-1">
                          {staffJobs.map((sj) => (
                            <div key={sj.id} className="flex items-center justify-between text-[10px] bg-background/50 px-2 py-1 rounded border border-border/30">
                              <span className="font-medium text-foreground truncate max-w-[150px]">{sj.title}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 text-rose-400 hover:text-rose-600 hover:bg-transparent"
                                onClick={() => assignStaffMutation.mutate({ jobId: sj.id, staffId: null })}
                                title="Unassign"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Column 3: Dispatched Work Orders */}
        <div className={`space-y-4 ${mobileTab === "dispatched" ? "block" : "hidden lg:block"}`}>
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-emerald-400">
              <UserCheck className="h-4 w-4" />
              Dispatched Orders ({assignedOrders.length})
            </h4>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {assignedOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 bg-muted/10 rounded-lg border border-dashed">
                No orders dispatched yet. Choose a staff member to assign.
              </p>
            ) : (
              assignedOrders.map((wo) => {
                const assignedStaff = staffList.find((s) => s.id === wo.assigned_staff_id);
                return (
                  <Card
                    key={wo.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", wo.id)}
                    className="border-emerald-500/20 bg-card hover:border-emerald-500/40 transition-all cursor-grab active:cursor-grabbing hover:shadow-sm"
                  >
                    <CardHeader className="p-3 pb-1.5 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-bold text-xs text-foreground line-clamp-2">{wo.title}</h5>
                        <Badge variant="outline" className={`text-[9px] px-1 py-0 shrink-0 ${getPriorityColor(wo.priority || "Normal")}`}>
                          {wo.priority || "Normal"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">
                          {wo.projects?.name} • {wo.customers?.name}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-1 space-y-3">
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {wo.description || "No description provided."}
                      </p>

                      <div className="pt-2 border-t flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                            {assignedStaff?.full_name[0] || "S"}
                          </div>
                          <span className="text-[10px] font-semibold text-foreground truncate max-w-[120px]">
                            {assignedStaff?.full_name || "Assigned Crew"}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] px-2 text-rose-400 hover:text-rose-600 hover:bg-rose-500/10"
                          onClick={() => assignStaffMutation.mutate({ jobId: wo.id, staffId: null })}
                        >
                          Recall Order
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Quick component-level close icon
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
