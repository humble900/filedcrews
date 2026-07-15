import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin,
  Download,
  LogOut,
  Smartphone,
  Check,
  ClipboardList,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Loader2,
  FileSpreadsheet,
  AlertTriangle,
  Plus,
  Settings,
  Calendar,
  X,
  Camera,
  User,
  Building2,
  ChevronDown,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import TaskPhotoUpload from "./TaskPhotoUpload";
import DocumentScanner from "./DocumentScanner";
import InteractiveSpreadsheet from "./InteractiveSpreadsheet";

interface StaffProfile {
  id: string;
  username: string;
  full_name: string;
  company_id: string;
  is_active: boolean;
}

interface Company {
  id: string;
  name: string;
  prefix: string;
}

interface StaffPortalProps {
  staffProfile: StaffProfile;
  company: Company | null;
  onSignOut: () => void;
}

type MobileTab = "tasks" | "docs" | "shifts" | "settings";

export default function StaffPortal({ staffProfile, company, onSignOut }: StaffPortalProps) {
  const queryClient = useQueryClient();
  const apkDownloadUrl = "/downloads/Ocrem.apk";

  const [activeTab, setActiveTab] = useState<MobileTab>("tasks");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Task detail sheet state
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [taskNotes, setTaskNotes] = useState("");
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);

  // Close task sheet on back button
  useEffect(() => {
    const handleBack = (e: PopStateEvent) => {
      if (selectedTask) {
        e.preventDefault();
        setSelectedTask(null);
      }
    };
    if (selectedTask) {
      window.history.pushState(null, "", window.location.href);
      window.addEventListener("popstate", handleBack);
    }
    return () => window.removeEventListener("popstate", handleBack);
  }, [selectedTask]);

  const [formResponses, setFormResponses] = useState<Record<string, any>>({});

  // Offline states
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<{ taskId: string; payload: any; taskTitle: string }[]>([]);

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    try {
      for (const item of offlineQueue) {
        const { error } = await supabase.from("tasks").update(item.payload).eq("id", item.taskId);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["staff_tasks", staffProfile.id] });
      toast.success(`Online! Synced ${offlineQueue.length} offline updates to server!`);
      setOfflineQueue([]);
    } catch (e: any) {
      toast.error(`Sync error: ${e.message}`);
    }
  };

  const toggleOfflineMode = () => {
    const nextState = !isOfflineMode;
    setIsOfflineMode(nextState);
    if (!nextState && offlineQueue.length > 0) {
      syncOfflineQueue();
    } else if (nextState) {
      toast.info("Offline mode simulated. Task changes will queue locally.");
    }
  };

  const handleUpdateTask = (taskId: string, payload: any, taskTitle: string) => {
    if (isOfflineMode) {
      const newQueue = [...offlineQueue, { taskId, payload, taskTitle }];
      setOfflineQueue(newQueue);
      toast.warning(`Saved offline: queued update for "${taskTitle}"`);
    } else {
      updateTaskMutation.mutate({ taskId, payload });
    }
  };

  // ── Data Queries ──────────────────────────────────────────────────

  // Fetch active form templates
  const { data: formTemplates = [] } = useQuery({
    queryKey: ["active_form_templates", staffProfile.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .eq("company_id", staffProfile.company_id);
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        schema: Array.isArray(t.schema) ? t.schema : []
      }));
    }
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["staff_tasks", staffProfile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          job:jobs(
            id,
            title,
            description,
            project_id,
            project:projects(id, name, address)
          )
        `)
        .eq("assignee_id", staffProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["staff_assignments", staffProfile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_assignments")
        .select(`id, project_id, project:projects(id, name, ref_number)`)
        .eq("staff_id", staffProfile.id);
      if (error) throw error;
      const list = data || [];
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].project_id);
      }
      return list;
    },
  });

  const { data: latestCheckIn } = useQuery({
    queryKey: ["staff_latest_checkin", staffProfile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("geofence_events")
        .select(`id, event_type, created_at, geofence:geofences(name)`)
        .eq("staff_id", staffProfile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: documents = [], isLoading: docsLoading, refetch: refetchDocs } = useQuery({
    queryKey: ["staff_project_docs", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const { data, error } = await supabase
        .from("project_documents")
        .select(`*, uploader:staff_profiles(full_name)`)
        .eq("project_id", selectedProjectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedProjectId,
  });

  // Fetch field crew's shifts
  const { data: myShifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ["staff_shifts", staffProfile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_shifts")
        .select(`*, geofence:geofences(name)`)
        .eq("staff_id", staffProfile.id)
        .gte("shift_date", new Date().toISOString().split("T")[0])
        .order("shift_date", { ascending: true })
        .limit(14);
      if (error) return [];
      return data || [];
    },
  });

  // ── Mutations ──────────────────────────────────────────────────

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, payload }: { taskId: string; payload: any }) => {
      const { error } = await supabase.from("tasks").update(payload).eq("id", taskId);
      if (error) throw error;

      // Check if task is being completed and save checklist responses
      if (payload.status === "Completed") {
        for (const tpl of formTemplates) {
          const responseData = formResponses[tpl.id] || {};
          // Only insert if there's actual data filled out
          if (Object.keys(responseData).length > 0) {
            const { error: respErr } = await supabase.from("form_responses").insert({
              template_id: tpl.id,
              job_id: selectedTask?.job_id || selectedTask?.id,
              submitted_by: staffProfile.id,
              data: responseData
            });
            if (respErr) {
              console.error("Error saving form response:", respErr);
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_tasks", staffProfile.id] });
      toast.success("Task updated");
      // Reset form responses
      setFormResponses({});
    },
    onError: (err: any) => toast.error(err.message || "Failed to update task"),
  });

  const handleSaveSpreadsheet = async (csvContent: string) => {
    if (!selectedDoc) return;
    try {
      const blob = new Blob([csvContent], { type: "text/csv" });
      const bucketName = "task-attachments";
      const urlParts = selectedDoc.file_url.split(`/public/${bucketName}/`);
      if (urlParts.length < 2) throw new Error("Invalid file URL pattern");
      const filePath = urlParts[1].split("?")[0];
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, blob, { upsert: true, contentType: "text/csv" });
      if (error) throw error;
      toast.success("Spreadsheet saved successfully");
      refetchDocs();
      setSheetOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update spreadsheet");
    }
  };

  const openTaskDetails = (task: any) => {
    setSelectedTask(task);
    setTaskNotes(task.staff_notes || "");
    setBeforePhoto(task.before_photo_url || null);
    setAfterPhoto(task.after_photo_url || null);
  };

  // ── Helpers ──────────────────────────────────────────────────

  const isChecklistCompleted = () => {
    for (const tpl of formTemplates) {
      if (tpl.is_required) {
        const responseData = formResponses[tpl.id] || {};
        for (const field of tpl.schema) {
          const val = responseData[field.label];
          if (field.type === "checkbox" && !val) {
            return false;
          }
          if (field.type !== "checkbox" && (val === undefined || val === null || String(val).trim() === "")) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const activeTasks = tasks.filter((t) => t.status === "In Progress");
  const pendingTasks = tasks.filter((t) => t.status === "Pending");
  const completedTasks = tasks.filter((t) => t.status === "Completed");

  const isOnSite =
    latestCheckIn &&
    (latestCheckIn.event_type.includes("inside") || latestCheckIn.event_type === "entered");

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case "High": return "border-l-priority-high";
      case "Medium": return "border-l-priority-medium";
      default: return "border-l-priority-low";
    }
  };

  const getStatusBadge = (status: string, approval: string) => {
    if (status === "Completed") {
      if (approval === "Approved")
        return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">Approved</Badge>;
      if (approval === "Rejected")
        return <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30 text-[10px] font-bold">Rework</Badge>;
      return <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 text-[10px] font-bold">Under Review</Badge>;
    }
    if (status === "In Progress")
      return <Badge className="bg-indigo-500/15 text-indigo-600 border-indigo-500/30 text-[10px] font-bold">Active</Badge>;
    return <Badge className="bg-muted text-muted-foreground text-[10px] font-bold">Assigned</Badge>;
  };

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* ═══ STICKY GLASS HEADER ═══ */}
      <header className="glass-header sticky top-0 z-40 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Avatar circle */}
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">{staffProfile.full_name}</p>
              <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <Building2 className="h-2.5 w-2.5" />
                {company?.name || "Portal"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isOfflineMode ? "destructive" : "outline"}
              onClick={toggleOfflineMode}
              className="h-7 text-[10px] font-bold gap-1 px-2 border-dashed"
              size="sm"
            >
              <WifiOff className="h-3.5 w-3.5" />
              {isOfflineMode ? "Simulated Offline" : "Go Offline"}
            </Button>
            <img src="/favicon.png" alt="Ocrem" className="h-7 w-7 rounded-lg opacity-70" />
          </div>
        </div>

        {offlineQueue.length > 0 && (
          <div className="mx-4 mb-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2 text-[10px] text-amber-500">
            <span className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {offlineQueue.length} updates queued offline.
            </span>
            <Button
              size="xs"
              onClick={syncOfflineQueue}
              className="h-6 text-[9px] bg-amber-600 hover:bg-amber-700 text-white font-bold animate-pulse"
              disabled={isOfflineMode}
            >
              Sync Now
            </Button>
          </div>
        )}

        {/* Live Status Pill */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
              isOnSite
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-muted text-muted-foreground border border-border/50"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                isOnSite ? "bg-emerald-500 animate-pulse-dot" : "bg-muted-foreground/40"
              }`}
            />
            {isOnSite ? (
              <>On Site · {latestCheckIn?.geofence?.name || "Active Zone"}</>
            ) : latestCheckIn ? (
              <>Off Site · {latestCheckIn?.geofence?.name || "Last Zone"}</>
            ) : (
              <>No active shift tracked</>
            )}
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT (scrollable, with bottom padding for nav) ═══ */}
      <main className="flex-1 overflow-y-auto pb-20">
        {/* ─── TASKS TAB ─── */}
        {activeTab === "tasks" && (
          <div className="px-4 py-4 space-y-5 animate-fade-in">
            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Active", value: activeTasks.length, color: "text-indigo-600 bg-indigo-500/10" },
                { label: "Assigned", value: pendingTasks.length, color: "text-amber-600 bg-amber-500/10" },
                { label: "Done", value: completedTasks.length, color: "text-emerald-600 bg-emerald-500/10" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center">
                  <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="font-bold text-base">No tasks assigned</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Your manager hasn't assigned any tasks yet. Check back later.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Tasks */}
                {activeTasks.length > 0 && (
                  <TaskSection title="Active Now" count={activeTasks.length} tasks={activeTasks} />
                )}
                {pendingTasks.length > 0 && (
                  <TaskSection title="Assigned to Me" count={pendingTasks.length} tasks={pendingTasks} />
                )}
                {completedTasks.length > 0 && (
                  <TaskSection title="Completed" count={completedTasks.length} tasks={completedTasks} dimmed />
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── DOCUMENTS TAB ─── */}
        {activeTab === "docs" && (
          <div className="px-4 py-4 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Documents</h2>
              <Button
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5"
                onClick={() => {
                  if (!selectedProjectId) {
                    toast.error("Select a project first");
                    return;
                  }
                  setScannerOpen(true);
                }}
                disabled={!selectedProjectId}
              >
                <Plus className="h-3.5 w-3.5" /> Scan
              </Button>
            </div>

            {assignments.length > 0 ? (
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-full h-11 text-sm font-semibold">
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  {assignments.map((a: any) => (
                    <SelectItem key={a.project_id} value={a.project_id}>
                      {a.project?.name || "Project"} ({a.project?.ref_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 font-semibold text-center">
                No active project assignments.
              </div>
            )}

            {selectedProjectId && (
              <>
                {docsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
                  </div>
                ) : documents.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center space-y-2">
                    <FileText className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm font-semibold text-muted-foreground">No documents yet</p>
                    <p className="text-xs text-muted-foreground">Use "Scan" to add files.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-xl border bg-card card-elevated"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {doc.file_url.includes(".csv") ? (
                            <FileSpreadsheet className="h-8 w-8 text-emerald-600 shrink-0" />
                          ) : (
                            <FileText className="h-8 w-8 text-primary shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {doc.uploader?.full_name || "Manager"} · {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 ml-2">
                          {doc.file_url.includes(".csv") ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 text-xs font-bold"
                              onClick={() => {
                                setSelectedDoc(doc);
                                setSheetOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                          ) : (
                            <a href={doc.file_url} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="sm" className="h-8 text-xs font-bold gap-1">
                                View <ExternalLink className="h-3 w-3" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── SHIFTS TAB ─── */}
        {activeTab === "shifts" && (
          <div className="px-4 py-4 space-y-4 animate-fade-in">
            <h2 className="text-base font-bold">My Shifts</h2>

            {shiftsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : myShifts.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="font-bold text-base">No upcoming shifts</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Your manager hasn't scheduled shifts for you yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {myShifts.map((shift: any) => {
                  const shiftDate = new Date((shift.shift_date || "") + "T00:00:00");
                  const isToday = new Date().toDateString() === shiftDate.toDateString();
                  return (
                    <div
                      key={shift.id}
                      className={`p-4 rounded-xl border card-elevated ${
                        isToday ? "bg-primary/5 border-primary/20" : "bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">
                              {isToday ? "Today" : format(shiftDate, "EEE, MMM d")}
                            </p>
                            {isToday && (
                              <Badge className="bg-primary/15 text-primary text-[10px] font-bold">Today</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {shift.start_time?.slice(0, 5)} – {shift.end_time?.slice(0, 5)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 justify-end">
                            <MapPin className="h-3 w-3" />
                            {shift.geofence?.name || "Unassigned"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── SETTINGS TAB ─── */}
        {activeTab === "settings" && (
          <div className="px-4 py-4 space-y-4 animate-fade-in">
            <h2 className="text-base font-bold">Settings</h2>

            {/* Profile Card */}
            <div className="p-4 rounded-xl border bg-card card-elevated space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm">{staffProfile.full_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">@{staffProfile.username}</p>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Company</span>
                  <span className="font-bold">{company?.name || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Status</span>
                  <span className={`font-bold ${staffProfile.is_active ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {staffProfile.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* App Download */}
            <div className="p-4 rounded-xl border bg-card card-elevated space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <p className="font-bold text-sm">Android App</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Download the official APK for real-time GPS tracking and geofence check-ins.
              </p>
              <a href={apkDownloadUrl} download>
                <Button className="w-full h-11 font-bold gap-2">
                  <Download className="h-4 w-4" />
                  Download APK
                </Button>
              </a>
            </div>

            {/* Installation Steps */}
            <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Installation Steps
              </p>
              <div className="space-y-2.5">
                {[
                  "Download the APK file to your device",
                  "Open it from notifications or downloads",
                  "Enable 'Allow installation from this source'",
                  "Install, open, and log in to start tracking",
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-start text-xs">
                    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sign Out */}
            <Button
              variant="outline"
              className="w-full h-11 font-bold text-destructive border-destructive/20 hover:bg-destructive/5 gap-2"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}
      </main>

      {/* ═══ TASK DETAIL SHEET (full-screen slide-up) ═══ */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background animate-slide-up">
          {/* Sheet Header */}
          <div className="glass-header sticky top-0 z-10 safe-top">
            <div className="mobile-sheet-handle" />
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="space-y-0.5 min-w-0 flex-1 mr-3">
                <h3 className="font-bold text-base truncate">{selectedTask.name}</h3>
                <p className="text-[10px] text-muted-foreground">
                  {selectedTask.job?.title || "General"} · {selectedTask.job?.project?.name || ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {getStatusBadge(selectedTask.status, selectedTask.approval_status)}
                <button
                  className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
                  onClick={() => setSelectedTask(null)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sheet Body */}
          <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-4 space-y-5">
            {/* Rework Banner */}
            {selectedTask.status === "Completed" && selectedTask.approval_status === "Rejected" && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs text-rose-700">Rework Requested</p>
                  <p className="text-xs text-rose-600/90 mt-0.5">
                    "{selectedTask.manager_feedback || "Please review and resubmit."}"
                  </p>
                </div>
              </div>
            )}

            {/* Task Details */}
            {selectedTask.description && (
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Instructions
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">{selectedTask.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Priority</p>
                <p className="font-bold text-sm mt-0.5">{selectedTask.priority}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Est. Hours</p>
                <p className="font-bold text-sm mt-0.5">{selectedTask.est_hours || "—"} hrs</p>
              </div>
            </div>

            {/* Action Area */}
            {selectedTask.status === "Pending" ? (
              <Button
                className="w-full font-bold h-12 text-base"
                onClick={() =>
                  handleUpdateTask(selectedTask.id, { status: "In Progress" }, selectedTask.title)
                }
                disabled={updateTaskMutation.isPending}
              >
                {updateTaskMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Start Task"
                )}
              </Button>
            ) : (
              <div className="space-y-4 pt-2 border-t border-border/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Verification Photos
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Before *</label>
                    <TaskPhotoUpload
                      taskId={selectedTask.id}
                      type="before"
                      currentUrl={beforePhoto}
                      onPhotoUpdated={(url) => {
                        setBeforePhoto(url);
                        handleUpdateTask(
                          selectedTask.id,
                          { before_photo_url: url },
                          selectedTask.title
                        );
                      }}
                      disabled={selectedTask.status === "Completed" && selectedTask.approval_status === "Approved"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">After *</label>
                    <TaskPhotoUpload
                      taskId={selectedTask.id}
                      type="after"
                      currentUrl={afterPhoto}
                      onPhotoUpdated={(url) => {
                        setAfterPhoto(url);
                        handleUpdateTask(
                          selectedTask.id,
                          { after_photo_url: url },
                          selectedTask.title
                        );
                      }}
                      disabled={selectedTask.status === "Completed" && selectedTask.approval_status === "Approved"}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Notes *</label>
                  <Textarea
                    placeholder="Report outcomes, tools used, or issues..."
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    className="min-h-[80px]"
                    disabled={selectedTask.status === "Completed" && selectedTask.approval_status === "Approved"}
                  />
                </div>

                {/* Checklist Section */}
                {formTemplates.length > 0 && (
                  <div className="space-y-3 pt-3 border-t">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Required Compliance Checklists
                    </p>
                    {formTemplates.map((tpl) => (
                      <div key={tpl.id} className="p-3 border rounded-xl bg-muted/20 space-y-3">
                        <div className="font-bold text-xs text-foreground flex items-center justify-between">
                          <span>{tpl.name}</span>
                          {tpl.is_required && (
                            <Badge className="bg-red-500/10 text-red-600 border-red-200 text-[8px] py-0 px-1 font-extrabold uppercase">Required</Badge>
                          )}
                        </div>
                        {tpl.description && (
                          <p className="text-[10px] text-muted-foreground">{tpl.description}</p>
                        )}
                        <div className="space-y-2 pt-1">
                          {tpl.schema.map((field: any) => {
                            const responseData = formResponses[tpl.id] || {};
                            const value = responseData[field.label] ?? "";
                            return (
                              <div key={field.label} className="space-y-1">
                                {field.type === "checkbox" ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`${tpl.id}-${field.label}`}
                                      checked={!!value}
                                      onChange={(e) => {
                                        const updatedData = { ...responseData, [field.label]: e.target.checked };
                                        setFormResponses({ ...formResponses, [tpl.id]: updatedData });
                                      }}
                                      className="h-4 w-4 rounded border-gray-300 text-primary"
                                    />
                                    <label htmlFor={`${tpl.id}-${field.label}`} className="text-xs text-slate-700 font-medium">
                                      {field.label}
                                    </label>
                                  </div>
                                ) : (
                                  <>
                                    <label className="text-[10px] font-semibold text-muted-foreground block">{field.label}</label>
                                    <Input
                                      type={field.type === "number" ? "number" : "text"}
                                      placeholder={field.type === "number" ? "Enter numeric value" : "Enter answer"}
                                      value={value}
                                      onChange={(e) => {
                                        const val = field.type === "number" ? Number(e.target.value) : e.target.value;
                                        const updatedData = { ...responseData, [field.label]: val };
                                        setFormResponses({ ...formResponses, [tpl.id]: updatedData });
                                      }}
                                      className="text-xs h-9 bg-card text-foreground"
                                    />
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Submit Button */}
          {selectedTask.status !== "Pending" &&
            !(selectedTask.status === "Completed" && selectedTask.approval_status === "Approved") && (
              <div className="sticky bottom-0 p-4 glass-header safe-bottom border-t">
                <Button
                  className="w-full font-bold h-12 text-base bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  disabled={
                    updateTaskMutation.isPending || !beforePhoto || !afterPhoto || !taskNotes.trim() || !isChecklistCompleted()
                  }
                  onClick={() =>
                    handleUpdateTask(selectedTask.id, {
                      status: "Completed",
                      approval_status: "Pending",
                      staff_notes: taskNotes.trim(),
                      completed_at: new Date().toISOString(),
                    }, selectedTask.title)
                  }
                >
                  {updateTaskMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Submit for Review
                    </>
                  )}
                </Button>
              </div>
            )}
        </div>
      )}

      {/* ═══ SPREADSHEET DIALOG ═══ */}
      {sheetOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-bold text-sm truncate">{selectedDoc.name}</h3>
            <button
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
              onClick={() => setSheetOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-auto scrollbar-hidden p-4">
            <InteractiveSpreadsheet
              fileUrl={`${selectedDoc.file_url}?v=${Date.now()}`}
              onSave={handleSaveSpreadsheet}
            />
          </div>
        </div>
      )}

      {/* ═══ DOCUMENT SCANNER ═══ */}
      <DocumentScanner
        projectId={selectedProjectId}
        onUploadSuccess={refetchDocs}
        open={scannerOpen}
        onOpenChange={setScannerOpen}
      />

      {/* ═══ BOTTOM NAVIGATION BAR ═══ */}
      {!selectedTask && !sheetOpen && (
        <nav className="bottom-nav glass-header border-t border-border/30">
          <div className="grid grid-cols-4 max-w-md mx-auto">
            {([
              { id: "tasks" as MobileTab, icon: ClipboardList, label: "Tasks", badge: activeTasks.length },
              { id: "docs" as MobileTab, icon: FileText, label: "Docs" },
              { id: "shifts" as MobileTab, icon: Calendar, label: "Shifts" },
              { id: "settings" as MobileTab, icon: Settings, label: "Settings" },
            ]).map((tab) => (
              <button
                key={tab.id}
                className={`bottom-nav-item ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="relative">
                  <tab.icon className="h-5 w-5" />
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 h-3.5 min-w-[14px] rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center px-0.5">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );

  // ── Task Section Component ──────────────────────────────────

  function TaskSection({
    title,
    count,
    tasks,
    dimmed,
  }: {
    title: string;
    count: number;
    tasks: any[];
    dimmed?: boolean;
  }) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {title} ({count})
          </h3>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3.5 rounded-xl border bg-card card-elevated cursor-pointer active:scale-[0.98] transition-transform ${
                getPriorityBorder(task.priority)
              } ${dimmed ? "opacity-60" : ""}`}
              onClick={() => openTaskDetails(task)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-bold text-sm truncate ${dimmed ? "line-through text-muted-foreground" : ""}`}>
                      {task.name}
                    </h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {task.job?.title || "General"} {task.job?.project?.name ? `· ${task.job.project.name}` : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(task.status, task.approval_status)}
                    {task.est_hours && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> ~{task.est_hours}h
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
