import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Loader2,
  MapPin,
  Users,
  Briefcase,
} from "lucide-react";
import {
  format,
  startOfWeek,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
} from "date-fns";
import { toast } from "sonner";

interface ShiftSchedulerProps {
  companyId: string;
  projectId?: string;
}

interface Staff {
  id: string;
  full_name: string;
  username: string;
}

interface Geofence {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  staff_id: string;
  geofence_id: string;
  shift_date: string;
  check_in_time: string;
  check_out_time: string | null;
  geofence_name?: string;
  job_id?: string;
  job_title?: string;
  project_id?: string;
}

export default function ShiftScheduler({ companyId, projectId }: ShiftSchedulerProps) {
  const [view, setView] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedGeofenceId, setSelectedGeofenceId] = useState("");
  const [shiftDateInput, setShiftDateInput] = useState(format(new Date(), "yyyy-MM-dd"));
  const [checkInTimeInput, setCheckInTimeInput] = useState("09:00");
  const [checkOutTimeInput, setCheckOutTimeInput] = useState("17:00");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [addingShift, setAddingShift] = useState(false);

  // 0. Fetch Work Orders for selection
  const { data: jobsList = [] } = useQuery({
    queryKey: ["scheduler_jobs", companyId, projectId],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("id, title")
        .order("title");
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      const { data, error } = await query;
      if (error) return [];
      return data || [];
    },
  });

  // 1. Fetch Staff List
  const { data: staffList = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ["scheduler_staff", companyId, projectId],
    queryFn: async () => {
      let query = supabase
        .from("staff_profiles")
        .select("id, full_name, username")
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
      return data as Staff[];
    },
  });

  // 2. Fetch Geofences for selections
  const { data: geofenceList = [] } = useQuery({
    queryKey: ["scheduler_geofences", companyId, projectId],
    queryFn: async () => {
      let query = supabase
        .from("geofences")
        .select("id, name")
        .eq("company_id", companyId)
        .eq("is_active", true);
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      const { data, error } = await query.order("name");
      if (error) throw error;
      return data as Geofence[];
    },
  });

  // 3. Fetch Scheduled Shifts for date window
  const dateRange = (() => {
    if (view === "weekly") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      return { start, end: addDays(start, 6) };
    } else if (view === "biweekly") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      return { start, end: addDays(start, 13) };
    } else {
      const start = startOfMonth(currentDate);
      return { start, end: endOfMonth(currentDate) };
    }
  })();

  const { data: shifts = [], isLoading: isLoadingShifts, refetch: refetchShifts } = useQuery({
    queryKey: ["scheduler_shifts", companyId, dateRange.start, dateRange.end, view, projectId],
    queryFn: async () => {
      const startISO = format(dateRange.start, "yyyy-MM-dd");
      const endISO = format(dateRange.end, "yyyy-MM-dd");

      // First get staff profiles in this company to filter database
      let staffQuery = supabase
        .from("staff_profiles")
        .select("id")
        .eq("company_id", companyId);

      if (projectId) {
        const { data: assignments } = await supabase
          .from("project_assignments")
          .select("staff_id")
          .eq("project_id", projectId);
        const assignedIds = assignments?.map((a: any) => a.staff_id) || [];
        if (assignedIds.length > 0) {
          staffQuery = staffQuery.in("id", assignedIds);
        } else {
          return [];
        }
      }
      const { data: staffData } = await staffQuery;

      const staffIds = staffData?.map((s) => s.id) || [];
      if (staffIds.length === 0) return [];

      const { data, error } = await supabase
        .from("staff_shifts")
        .select("id, staff_id, geofence_id, shift_date, check_in_time, check_out_time, job_id, geofences(name, project_id), jobs(title, project_id)")
        .in("staff_id", staffIds)
        .gte("shift_date", startISO)
        .lte("shift_date", endISO)
        .order("shift_date")
        .order("check_in_time");

      if (error) throw error;

      let finalShifts = (data as any[]).map((s) => ({
        id: s.id,
        staff_id: s.staff_id,
        geofence_id: s.geofence_id,
        shift_date: s.shift_date,
        check_in_time: s.check_in_time,
        check_out_time: s.check_out_time,
        geofence_name: s.geofences?.name ?? "Unknown Site",
        job_id: s.job_id,
        job_title: s.jobs?.title || undefined,
        project_id: s.jobs?.project_id || s.geofences?.project_id,
      }));

      if (projectId) {
        finalShifts = finalShifts.filter((s) => s.project_id === projectId);
      }

      return finalShifts as Shift[];
    },
  });

  // Handle shift schedule submission
  const handleScheduleSubmit = async () => {
    if (!selectedStaffId || !selectedGeofenceId || !shiftDateInput || !checkInTimeInput) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setAddingShift(true);
    try {
      const { error } = await supabase.from("staff_shifts").insert({
        staff_id: selectedStaffId,
        geofence_id: selectedGeofenceId,
        shift_date: shiftDateInput,
        check_in_time: checkInTimeInput,
        check_out_time: checkOutTimeInput || null,
        job_id: selectedJobId || null,
      } as any);

      if (error) throw error;

      toast.success("Shift scheduled successfully");
      setScheduleDialogOpen(false);
      refetchShifts();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule shift");
    } finally {
      setAddingShift(false);
    }
  };

  // Handle shift deletion
  const handleDeleteShift = async (shiftId: string) => {
    try {
      const { error } = await supabase.from("staff_shifts").delete().eq("id", shiftId);
      if (error) throw error;

      toast.success("Shift removed");
      refetchShifts();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove shift");
    }
  };

  // Navigate Date Ranges
  const handleNavigate = (direction: "prev" | "next") => {
    if (view === "weekly") {
      setCurrentDate(direction === "prev" ? subDays(currentDate, 7) : addDays(currentDate, 7));
    } else if (view === "biweekly") {
      setCurrentDate(direction === "prev" ? subDays(currentDate, 14) : addDays(currentDate, 14));
    } else {
      const monthOffset = direction === "prev" ? -1 : 1;
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
      setCurrentDate(nextMonth);
    }
  };

  // Get active range days
  const activeDays = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });

  const getWeekHeaderLabel = () => {
    if (view === "weekly") {
      return `Week of ${format(dateRange.start, "MMM d, yyyy")}`;
    } else if (view === "biweekly") {
      return `Fortnight of ${format(dateRange.start, "MMM d")} - ${format(dateRange.end, "MMM d, yyyy")}`;
    } else {
      return format(currentDate, "MMMM yyyy");
    }
  };

  // Render weekly & bi-weekly grid layouts
  const renderTimelineGrid = () => {
    if (staffList.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-lg">
          No active staff members available to schedule. Go to the Staff tab to add one.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto border rounded-lg border-border">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="p-3 font-semibold text-xs text-muted-foreground w-48 shrink-0 sticky left-0 bg-muted/80 backdrop-blur z-10 border-r">
                Staff Member
              </th>
              {activeDays.map((day) => (
                <th key={day.toISOString()} className="p-3 font-semibold text-xs text-muted-foreground min-w-[140px] text-center border-r last:border-r-0">
                  <div className="font-semibold text-foreground">{format(day, "EEE")}</div>
                  <div className="text-[10px] text-muted-foreground">{format(day, "MMM d")}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff) => (
              <tr key={staff.id} className="border-b hover:bg-muted/10 last:border-b-0">
                <td className="p-3 font-medium text-sm sticky left-0 bg-background border-r z-10">
                  <div className="font-bold">{staff.full_name}</div>
                  <div className="text-[10px] text-muted-foreground">@{staff.username}</div>
                </td>
                {activeDays.map((day) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const dayShifts = shifts.filter(
                    (s) => s.staff_id === staff.id && s.shift_date === dayStr
                  );

                  return (
                    <td
                      key={day.toISOString()}
                      className="p-2 border-r last:border-r-0 text-center relative group min-h-[80px]"
                    >
                      <div className="space-y-1.5 min-h-[50px] flex flex-col justify-center">
                        {dayShifts.map((shift) => {
                          // Modern 2026 Color Coding based on Shift Status
                          let shiftColorStyle = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"; // Scheduled (default)
                          const isToday = isSameDay(parseISO(shift.shift_date), new Date());
                          if (shift.check_out_time) {
                            shiftColorStyle = "bg-slate-500/10 text-slate-400 border-slate-500/20"; // Completed
                          } else if (isToday) {
                            shiftColorStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"; // Active/On-site
                          }

                          return (
                            <div
                              key={shift.id}
                              className={`border rounded-md p-1.5 text-left text-xs relative group/item ${shiftColorStyle}`}
                            >
                              <div className="font-semibold flex items-center gap-1 truncate pr-4">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {shift.geofence_name}
                              </div>
                              <div className="text-[10px] opacity-80 flex items-center gap-1 mt-0.5">
                                <Clock className="h-2.5 w-2.5 shrink-0" />
                                {shift.check_in_time.slice(0, 5)}
                                {shift.check_out_time ? ` - ${shift.check_out_time.slice(0, 5)}` : ""}
                              </div>
                              {shift.job_title && (
                                <div className="text-[9px] font-medium flex items-center gap-1 mt-1 opacity-90 border-t pt-1 border-current/10">
                                  <Briefcase className="h-2.5 w-2.5 shrink-0" />
                                  WO: {shift.job_title}
                                </div>
                              )}
                              <button
                                onClick={() => handleDeleteShift(shift.id)}
                                className="absolute right-1.5 top-1.5 opacity-0 group-hover/item:opacity-100 text-destructive hover:text-red-700 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}

                        {/* Quick Add overlay button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStaffId(staff.id);
                            setShiftDateInput(dayStr);
                            setScheduleDialogOpen(true);
                          }}
                          className="w-full opacity-0 group-hover:opacity-100 h-7 text-[10px] py-1 border border-dashed border-border flex items-center justify-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </Button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render Monthly View
  const renderMonthlyGrid = () => {
    // Generate dates to display (padding at start/end for week alignments)
    const monthStart = startOfMonth(currentDate);
    const startOfGrid = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridDays = eachDayOfInterval({ start: startOfGrid, end: addDays(startOfGrid, 34) }); // 5 weeks display

    return (
      <div className="grid grid-cols-7 border rounded-lg border-border overflow-hidden">
        {/* Days of Week Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
          <div key={dayName} className="bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground border-b border-r last:border-r-0">
            {dayName}
          </div>
        ))}

        {/* Days grid */}
        {gridDays.map((day) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const dayShifts = shifts.filter((s) => s.shift_date === dayStr);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();

          return (
            <div
              key={day.toISOString()}
              onClick={() => {
                setShiftDateInput(dayStr);
                setScheduleDialogOpen(true);
              }}
              className={`p-2 min-h-[100px] border-b border-r last:border-r-0 hover:bg-muted/10 cursor-pointer flex flex-col justify-between ${
                !isCurrentMonth ? "bg-muted/20 opacity-50" : "bg-background"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${isSameDay(day, new Date()) ? "bg-primary text-primary-foreground h-5 w-5 rounded-full flex items-center justify-center" : "text-muted-foreground"}`}>
                  {format(day, "d")}
                </span>
                {dayShifts.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{dayShifts.length} scheduled</span>
                )}
              </div>

              <div className="space-y-1 mt-2 overflow-y-auto max-h-[70px]">
                {dayShifts.slice(0, 3).map((shift) => (
                  <div
                    key={shift.id}
                    onClick={(e) => {
                      e.stopPropagation(); // prevent opening dialog
                      if (confirm(`Delete shift for ${shift.geofence_name}?`)) {
                        handleDeleteShift(shift.id);
                      }
                    }}
                    className="bg-primary/5 hover:bg-destructive/10 border border-primary/10 hover:border-destructive/20 text-[10px] rounded p-1 text-left flex items-center justify-between truncate"
                    title="Click to delete shift"
                  >
                    <span className="font-medium text-foreground truncate block">
                      {staffList.find((s) => s.id === shift.staff_id)?.full_name.split(" ")[0]}: {shift.geofence_name}
                    </span>
                  </div>
                ))}
                {dayShifts.length > 3 && (
                  <div className="text-[8px] text-muted-foreground font-medium text-center">
                    + {dayShifts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="border-border/50 card-shadow-md">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-4 border-b">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Field Shift Scheduler
          </CardTitle>
          <CardDescription>
            Assign staff to monitored geofences and define check-in hours.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleNavigate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold px-2 min-w-[120px] text-center">
              {getWeekHeaderLabel()}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleNavigate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* View selector */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            {(["weekly", "biweekly", "monthly"] as const).map((v) => (
              <Button
                key={v}
                variant={view === v ? "default" : "ghost"}
                size="sm"
                className="text-xs capitalize h-7 px-3"
                onClick={() => setView(v)}
              >
                {v === "biweekly" ? "Bi-Weekly" : v}
              </Button>
            ))}
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setShiftDateInput(format(new Date(), "yyyy-MM-dd"));
              setScheduleDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Schedule Shift
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {isLoadingShifts || isLoadingStaff ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : view === "monthly" ? (
          renderMonthlyGrid()
        ) : (
          renderTimelineGrid()
        )}
      </CardContent>

      {/* Add Shift Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setScheduleDialogOpen(false);
            setSelectedStaffId("");
            setSelectedGeofenceId("");
            setSelectedJobId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Schedule Staff Shift
            </DialogTitle>
            <CardDescription>
              Assign a staff member to a geofence site on a specific date.
            </CardDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Select Staff */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold flex items-center gap-1.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                Staff Member *
              </label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} (@{s.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Geofence */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Geofence Site *
              </label>
              <Select value={selectedGeofenceId} onValueChange={setSelectedGeofenceId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select geofence location" />
                </SelectTrigger>
                <SelectContent>
                  {geofenceList.map((gf) => (
                    <SelectItem key={gf.id} value={gf.id}>
                      {gf.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Job / Work Order */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Link to Work Order (Optional)
              </label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select work order to associate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {jobsList.map((j: any) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                Shift Date *
              </label>
              <Input
                type="date"
                value={shiftDateInput}
                onChange={(e) => setShiftDateInput(e.target.value)}
              />
            </div>

            {/* Check-in and Check-out Times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Expected Check-in *
                </label>
                <Input
                  type="time"
                  value={checkInTimeInput}
                  onChange={(e) => setCheckInTimeInput(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Expected Check-out
                </label>
                <Input
                  type="time"
                  value={checkOutTimeInput}
                  onChange={(e) => setCheckOutTimeInput(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setScheduleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              disabled={addingShift || !selectedStaffId || !selectedGeofenceId || !shiftDateInput}
              onClick={handleScheduleSubmit}
            >
              {addingShift ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Scheduling...
                </>
              ) : (
                "Schedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
