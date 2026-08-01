import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { PaginatedTableFull } from "@/components/PaginatedTable";
import FilterChipBar, { FilterChip } from "@/components/FilterChipBar";
import SEO from "@/components/SEO";
import ShiftScheduler from "@/components/ShiftScheduler";
import DispatchBoard from "@/components/DispatchBoard";
import MobileTechVoiceCopilot from "@/components/MobileTechVoiceCopilot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgenticDispatch } from "@/hooks/useAgenticDispatch";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Briefcase,
  User,
  CheckCircle2,
  AlertTriangle,
  Play,
  ClipboardList,
  Search,
  Filter,
  Image,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  ArrowRight,
  MapPin,
  FileText,
  Paperclip,
  ImageIcon,
  MessageSquare,
  Sparkles,
  Bot,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
} from "date-fns";

interface Customer {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  full_name: string;
  username: string;
}

interface Job {
  id: string;
  project_id: string;
  customer_id: string;
  title: string;
  status: string;
  description: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  created_at: string;
  project?: Project;
  customer?: Customer;
}

interface Task {
  id: string;
  job_id: string;
  phase_id: string | null;
  name: string;
  description: string | null;
  priority: string;
  status: string;
  assignee_id: string | null;
  est_hours: number;
  before_photo_url: string | null;
  after_photo_url: string | null;
  created_at: string;
  assignee?: Staff;
}

export default function WorkOrdersPage({ projectId }: { projectId?: string }) {
  const { user, company, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { isOptimizing, autoAssignJob } = useAgenticDispatch(company?.id || "");

  // Filters
  const [techFilter, setTechFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Job dialog states
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobProjId, setJobProjId] = useState("");
  const [jobCustId, setJobCustId] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobStatus, setJobStatus] = useState("Scheduled");
  const [jobStart, setJobStart] = useState("");
  const [jobEnd, setJobEnd] = useState("");

  // Task dialog states
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [showVoiceCopilot, setShowVoiceCopilot] = useState(false);

  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskStatus, setTaskStatus] = useState("Pending");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskHours, setTaskHours] = useState("0");
  const [taskBeforePhoto, setTaskBeforePhoto] = useState("");
  const [taskAfterPhoto, setTaskAfterPhoto] = useState("");

  // 1. Fetch Company Staff (Field Crew)
  const { data: staff = [] } = useQuery({
    queryKey: ["jobs_staff", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, full_name, username")
        .eq("company_id", company.id)
        .eq("is_active", true)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data as Staff[];
    },
    enabled: !!company?.id,
  });

  // 2. Fetch Projects (for job creator)
  const { data: projects = [] } = useQuery({
    queryKey: ["jobs_projects", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, customer_id")
        .eq("company_id", company.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!company?.id,
  });

  // 3. Fetch Customers (for job creator)
  const { data: customers = [] } = useQuery({
    queryKey: ["jobs_customers", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .eq("company_id", company.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!company?.id,
  });

  // 4. Fetch Jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs", company?.id, projectId],
    queryFn: async () => {
      if (!company?.id) return [];
      let query = supabase
        .from("jobs")
        .select(`
          *,
          project:projects(id, name),
          customer:customers(id, name)
        `);
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      const { data, error } = await query.order("scheduled_start", { ascending: true });
      if (error) throw error;
      return (data || []).map((j: any) => ({
        ...j,
        project: j.project ? { id: j.project.id, name: j.project.name } : undefined,
        customer: j.customer ? { id: j.customer.id, name: j.customer.name } : undefined,
      })) as Job[];
    },
    enabled: !!company?.id,
  });

  // 5. Fetch Tasks for selected job
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:staff_profiles(id, full_name, username)
        `)
        .eq("job_id", selectedJobId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        assignee: t.assignee ? { id: t.assignee.id, full_name: t.assignee.full_name, username: t.assignee.username } : undefined,
      })) as Task[];
    },
    enabled: !!selectedJobId,
  });

  // Job Mutations
  const saveJobMutation = useMutation({
    mutationFn: async () => {
      if (!jobTitle.trim()) throw new Error("Job title is required");
      if (!jobProjId) throw new Error("Project link is required");
      if (!jobCustId) throw new Error("Customer link is required");

      const payload = {
        project_id: jobProjId,
        customer_id: jobCustId,
        title: jobTitle.trim(),
        status: jobStatus,
        description: jobDesc.trim() || null,
        scheduled_start: jobStart || null,
        scheduled_end: jobEnd || null,
      };

      if (editingJob) {
        const { error } = await supabase
          .from("jobs")
          .update(payload)
          .eq("id", editingJob.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("jobs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", company?.id] });
      toast({
        title: editingJob ? "Job updated" : "Job created",
        description: `Successfully saved "${jobTitle}".`,
      });
      closeJobDialog();
    },
    onError: (err: any) => {
      toast({
        title: "Error saving job",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", company?.id] });
      if (selectedJobId) setSelectedJobId(null);
      toast({
        title: "Job deleted",
        description: "The work order has been deleted.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error deleting job",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Task Mutations
  const saveTaskMutation = useMutation({
    mutationFn: async () => {
      if (!selectedJobId) throw new Error("No job selected");
      if (!taskName.trim()) throw new Error("Task name is required");

      const payload = {
        job_id: selectedJobId,
        name: taskName.trim(),
        description: taskDesc.trim() || null,
        priority: taskPriority,
        status: taskStatus,
        assignee_id: taskAssignee && taskAssignee !== "__unassigned__" ? taskAssignee : null,
        est_hours: parseFloat(taskHours) || 0.00,
        before_photo_url: taskBeforePhoto.trim() || null,
        after_photo_url: taskAfterPhoto.trim() || null,
      };

      if (editingTask) {
        const { error } = await supabase
          .from("tasks")
          .update(payload)
          .eq("id", editingTask.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tasks").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", selectedJobId] });
      toast({
        title: editingTask ? "Task updated" : "Task added",
        description: `Successfully saved "${taskName}".`,
      });
      closeTaskDialog();
    },
    onError: (err: any) => {
      toast({
        title: "Error saving task",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", selectedJobId] });
      toast({
        title: "Task removed",
        description: "The task was successfully deleted.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error deleting task",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Helpers
  const openJobDialog = (job?: Job) => {
    if (job) {
      setEditingJob(job);
      setJobTitle(job.title);
      setJobProjId(job.project_id);
      setJobCustId(job.customer_id);
      setJobDesc(job.description || "");
      setJobStatus(job.status);
      setJobStart(job.scheduled_start ? job.scheduled_start.substring(0, 16) : "");
      setJobEnd(job.scheduled_end ? job.scheduled_end.substring(0, 16) : "");
    } else {
      setEditingJob(null);
      setJobTitle("");
      setJobProjId(projectId || (projects.length > 0 ? projects[0].id : ""));
      setJobCustId(customers.length > 0 ? customers[0].id : "");
      setJobDesc("");
      setJobStatus("Scheduled");
      setJobStart(format(new Date(), "yyyy-MM-dd'T'09:00"));
      setJobEnd(format(new Date(), "yyyy-MM-dd'T'17:00"));
    }
    setJobDialogOpen(true);
  };

  const closeJobDialog = () => {
    setJobDialogOpen(false);
    setEditingJob(null);
  };

  const openTaskDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskName(task.name);
      setTaskDesc(task.description || "");
      setTaskPriority(task.priority);
      setTaskStatus(task.status);
      setTaskAssignee(task.assignee_id || "");
      setTaskHours(task.est_hours.toString());
      setTaskBeforePhoto(task.before_photo_url || "");
      setTaskAfterPhoto(task.after_photo_url || "");
    } else {
      setEditingTask(null);
      setTaskName("");
      setTaskDesc("");
      setTaskPriority("Medium");
      setTaskStatus("Pending");
      setTaskAssignee(staff.length > 0 ? staff[0].id : "");
      setTaskHours("2.0");
      setTaskBeforePhoto("");
      setTaskAfterPhoto("");
    }
    setTaskDialogOpen(true);
  };

  const closeTaskDialog = () => {
    setTaskDialogOpen(false);
    setEditingTask(null);
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-500/10 text-blue-600 border-blue-200/50 hover:bg-blue-500/15";
      case "In Progress":
        return "bg-amber-500/10 text-amber-600 border-amber-200/50 hover:bg-amber-500/15";
      case "Completed":
        return "bg-green-500/10 text-green-600 border-green-200/50 hover:bg-green-500/15";
      case "Cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15";
      default:
        return "bg-muted text-muted-foreground hover:bg-muted/80";
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case "Urgent":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px] font-bold">Urgent</Badge>;
      case "High":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold">High</Badge>;
      case "Medium":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-bold">Medium</Badge>;
      case "Low":
      default:
        return <Badge variant="secondary" className="text-[10px] font-bold">Low</Badge>;
    }
  };

  // Generate Calendar Days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Filtered jobs
  const filteredJobs = jobs.filter((job) => {
    // Filter by tech assignee if a tasks match
    const matchesTech = techFilter === "ALL" || (
      // Requires query client cached task filtering or simply let them query
      // For this local view, we'll check if the tech filter matches any staff assignee.
      true // We will do visual filtering in the details / list, let's keep calendar showing all jobs.
    );

    const matchesStatus = statusFilter === "ALL" || job.status === statusFilter;
    return matchesStatus;
  });

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  if (authLoading || jobsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pageContent = (
    <>
      <div className="p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <ClipboardList className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Work Order Dispatch
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Visual dispatch boards, job schedules, field crew resource allocations, and real-time task sheets.
              </p>
            </div>
            <Button onClick={() => openJobDialog()} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Add Work Order
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left/Middle Column: Calendar & Dispatch Board */}
            <div className="lg:col-span-2 space-y-6">
              {/* Calendar Container */}
              <Card className="border-border/50 card-shadow-md">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                      {format(currentMonth, "MMMM yyyy")}
                    </CardTitle>
                    <div className="flex items-center gap-1 border rounded-lg p-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="h-7 w-7"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(new Date())}
                        className="text-xs h-7 px-2 font-medium"
                      >
                        Today
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="h-7 w-7"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <FilterChipBar
                    hasActiveFilters={statusFilter !== "ALL"}
                    onClearAll={() => setStatusFilter("ALL")}
                  >
                    <FilterChip
                      label="All Statuses"
                      selectedValue={statusFilter}
                      options={[
                        { label: "Scheduled", value: "Scheduled" },
                        { label: "In Progress", value: "In Progress" },
                        { label: "Completed", value: "Completed" },
                        { label: "Cancelled", value: "Cancelled" },
                      ]}
                      onSelect={setStatusFilter}
                      onClear={() => setStatusFilter("ALL")}
                    />
                  </FilterChipBar>
                </CardHeader>
                <CardContent className="p-4">
                  {/* Day of Week Labels */}
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-muted-foreground pb-2 border-b">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid cells */}
                  <div className="grid grid-cols-7 gap-1 mt-1">
                    {/* Padding cells to align with start of month day of week */}
                    {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, idx) => (
                      <div key={`pad-${idx}`} className="min-h-[100px] border border-transparent bg-muted/10 opacity-30 rounded-lg" />
                    ))}

                    {daysInMonth.map((day) => {
                      // Get jobs for this day
                      const dayJobs = filteredJobs.filter((job) => {
                        if (!job.scheduled_start) return false;
                        return isSameDay(parseISO(job.scheduled_start), day);
                      });

                      const isToday = isSameDay(day, new Date());

                      return (
                        <div
                          key={day.toString()}
                          className={`min-h-[110px] border p-1 rounded-lg flex flex-col space-y-1 relative transition-colors ${
                            isToday ? "bg-primary/5 border-primary/45" : "bg-muted/10 border-border/40 hover:bg-muted/15"
                          }`}
                        >
                          <span
                            className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-full w-fit ${
                              isToday
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {format(day, "d")}
                          </span>

                          {/* Jobs Badges list */}
                          <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 max-h-[85px]">
                            {dayJobs.map((job) => (
                              <button
                                key={job.id}
                                onClick={() => setSelectedJobId(job.id)}
                                className={`w-full text-left text-[10px] font-bold px-1.5 py-1 border rounded truncate block ${getJobStatusColor(
                                  job.status
                                )}`}
                              >
                                {job.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* List of All Jobs */}
              <Card className="border-border/50 card-shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Work Orders Directory ({filteredJobs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <PaginatedTableFull
                    data={filteredJobs}
                    renderTable={(paginatedItems) => (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-xs text-muted-foreground font-bold">
                            <th className="p-3 text-left">Job Scope</th>
                            <th className="p-3 text-left">Client & Project</th>
                            <th className="p-3 text-left">Scheduled Time</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedItems.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center p-6 text-sm text-muted-foreground">
                                No jobs found in this month.
                              </td>
                            </tr>
                          ) : (
                            paginatedItems.map((job) => (
                              <tr
                                key={job.id}
                                className={`border-b text-sm cursor-pointer hover:bg-muted/30 transition-colors ${
                                  selectedJobId === job.id ? "bg-muted/70" : ""
                                }`}
                                onClick={() => setSelectedJobId(job.id)}
                              >
                                <td className="p-3 font-semibold text-foreground">{job.title}</td>
                                <td className="p-3">
                                  <div className="text-xs font-semibold text-foreground">
                                    {job.customer?.name || "—"}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" /> {job.project?.name || "—"}
                                  </div>
                                </td>
                                <td className="p-3 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {job.scheduled_start
                                      ? format(parseISO(job.scheduled_start), "MMM d, h:mm a")
                                      : "—"}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${getJobStatusColor(job.status)}`}>
                                    {job.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openJobDialog(job)}>
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (confirm(`Delete job "${job.title}" and all its sub-tasks?`)) {
                                          deleteJobMutation.mutate(job.id);
                                        }
                                      }}
                                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Work Order Details & Sub-task Manager */}
            <div className="space-y-6">
              {!selectedJobId ? (
                <Card className="border-border/50 card-shadow-md">
                  <CardContent className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                    <ClipboardList className="h-12 w-12 text-muted-foreground/45 mb-3" />
                    <p className="text-sm font-semibold">Select a Work Order</p>
                    <p className="text-xs mt-1 px-4 max-w-sm">
                      Select a scheduled job from the calendar or list to dispatch tasks, assign crew members, and log photo reports.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Selected Job Card Details */}
                  <Card className="border-border/50 card-shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-bold">{selectedJob?.title}</CardTitle>
                          <CardDescription className="text-xs mt-1 font-semibold flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" /> Project: {selectedJob?.project?.name}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20"
                            disabled={isOptimizing || selectedJob?.status !== "Unassigned"}
                            onClick={async () => {
                              try {
                                const tech = await autoAssignJob(selectedJob!.id, 0, 0, []);
                                toast({ title: "AI Dispatch Success", description: `Assigned to ${tech.name} (Score: ${tech.score})` });
                                queryClient.invalidateQueries({ queryKey: ["jobs"] });
                              } catch(e: any) {
                                toast({ title: "AI Dispatch Failed", description: e.message, variant: "destructive" });
                              }
                            }}
                          >
                            {isOptimizing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Bot className="h-3 w-3 mr-1" />}
                            AI Auto-Assign
                          </Button>
                          <Badge className={`${getJobStatusColor(selectedJob?.status || "")}`}>
                            {selectedJob?.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="space-y-1.5 border-t pt-3">
                        <div className="text-xs text-muted-foreground">Customer / Address</div>
                        <div className="font-bold text-foreground">{selectedJob?.customer?.name}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t pt-3">
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Scheduled Start</span>
                          <div className="font-semibold text-xs flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {selectedJob?.scheduled_start
                              ? format(parseISO(selectedJob.scheduled_start), "MMM d, h:mm a")
                              : "N/A"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Scheduled End</span>
                          <div className="font-semibold text-xs flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {selectedJob?.scheduled_end
                              ? format(parseISO(selectedJob.scheduled_end), "MMM d, h:mm a")
                              : "N/A"}
                          </div>
                        </div>
                      </div>

                      {selectedJob?.description && (
                        <div className="border-t pt-3 space-y-1">
                          <span className="text-xs text-muted-foreground">Scope Instructions</span>
                          <p className="text-xs text-foreground bg-muted/30 p-2 rounded leading-relaxed border">
                            {selectedJob.description}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Task Sheets & Dispatcher */}
                  <Card className="border-border/50 card-shadow-md">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <ClipboardList className="h-5 w-5 text-primary" />
                          Crew Task Sheet
                        </CardTitle>
                        <CardDescription>Individual tasks assigned to field crew members.</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openTaskDialog()} className="gap-1">
                        <Plus className="h-3.5 w-3.5" /> Add Task
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {tasksLoading ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      ) : tasks.length === 0 ? (
                        <div className="text-center py-8 border border-dashed rounded-lg bg-muted/20">
                          <p className="text-xs text-muted-foreground">No tasks logged on this work order.</p>
                          <Button variant="link" size="xs" onClick={() => openTaskDialog()} className="text-primary mt-1">
                            Create First Task
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {tasks.map((task) => (
                            <div key={task.id} className="p-3 border border-border/40 rounded-lg bg-muted/10 space-y-3 relative group">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                                    {task.name}
                                    {getPriorityBadge(task.priority)}
                                  </h4>
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{task.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    task.status === "Completed"
                                      ? "bg-green-500/10 text-green-600 border-green-200"
                                      : task.status === "In Progress"
                                      ? "bg-amber-500/10 text-amber-600 border-amber-200"
                                      : task.status === "Blocked"
                                      ? "bg-red-500/10 text-red-600 border-red-200"
                                      : "bg-muted text-muted-foreground"
                                  }`}>
                                    {task.status}
                                  </span>

                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                    <Button variant="ghost" size="icon" onClick={() => openTaskDialog(task)} className="h-6 w-6">
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (confirm(`Delete task "${task.name}"?`)) {
                                          deleteTaskMutation.mutate(task.id);
                                        }
                                      }}
                                      className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Assignee & Hours */}
                              <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground border-t pt-2 gap-2">
                                <span className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5 text-primary" />
                                  Tech: <span className="font-semibold text-foreground">{task.assignee?.full_name || "Unassigned"}</span>
                                </span>
                                <span>Est: <span className="font-semibold text-foreground font-mono">{task.est_hours} hrs</span></span>
                              </div>

                              {/* Photo reports URLs */}
                              {(task.before_photo_url || task.after_photo_url) && (
                                <div className="grid grid-cols-2 gap-2 border-t pt-2 text-[10px] font-mono text-muted-foreground">
                                  <div className="truncate">
                                    <span className="font-bold text-foreground">Before: </span>
                                    {task.before_photo_url ? (
                                      <a href={task.before_photo_url} target="_blank" rel="noreferrer" className="text-primary underline">
                                        View Image
                                      </a>
                                    ) : (
                                      "None"
                                    )}
                                  </div>
                                  <div className="truncate">
                                    <span className="font-bold text-foreground">After: </span>
                                    {task.after_photo_url ? (
                                      <a href={task.after_photo_url} target="_blank" rel="noreferrer" className="text-primary underline">
                                        View Image
                                      </a>
                                    ) : (
                                      "None"
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Job Creator/Editor Dialog */}
        <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                {editingJob ? "Edit Scheduled Job" : "Schedule New Job / Work Order"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Job Summary Title *</label>
                <Input
                  placeholder="e.g. Inspect air ducts & check compressors"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Client (Customer) *</label>
                  <Select value={jobCustId} onValueChange={setJobCustId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!projectId && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Project Scope *</label>
                    <Select value={jobProjId} onValueChange={setJobProjId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Job Instructions</label>
                <Textarea
                  placeholder="Enter details, crew notes, tools required, or site gate codes..."
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Scheduled Start Time</label>
                  <Input
                    type="datetime-local"
                    value={jobStart}
                    onChange={(e) => setJobStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Scheduled End Time</label>
                  <Input
                    type="datetime-local"
                    value={jobEnd}
                    onChange={(e) => setJobEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Job Status</label>
                <Select value={jobStatus} onValueChange={setJobStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeJobDialog}>
                Cancel
              </Button>
              <Button onClick={() => saveJobMutation.mutate()} disabled={saveJobMutation.isPending}>
                {saveJobMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Job
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Task Creator/Editor Dialog */}
        <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                {editingTask ? "Modify Crew Task" : "Assign Crew Task"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Task Title / Action Item *</label>
                <Input
                  placeholder="e.g. Clean condenser coils, Verify pressure levels"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Task Description</label>
                <Textarea
                  placeholder="Brief details about specific checklist goals..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Field Crew Assignee</label>
                  <Select value={taskAssignee} onValueChange={setTaskAssignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field crew member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unassigned__">Unassigned</SelectItem>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Estimated Duration (hours)</label>
                  <Input
                    type="number"
                    step="0.25"
                    placeholder="2.0"
                    value={taskHours}
                    onChange={(e) => setTaskHours(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Task Priority</label>
                  <Select value={taskPriority} onValueChange={setTaskPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Task Status</label>
                  <Select value={taskStatus} onValueChange={setTaskStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border p-3 rounded-lg bg-muted/10">
                <div className="col-span-2 text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                  <Image className="h-3.5 w-3.5" /> Photo Reports (URLs)
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Before Photo URL</label>
                  <Input
                    placeholder="e.g. https://bucket/before.jpg"
                    value={taskBeforePhoto}
                    onChange={(e) => setTaskBeforePhoto(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">After Photo URL</label>
                  <Input
                    placeholder="e.g. https://bucket/after.jpg"
                    value={taskAfterPhoto}
                    onChange={(e) => setTaskAfterPhoto(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeTaskDialog}>
                Cancel
              </Button>
              <Button onClick={() => saveTaskMutation.mutate()} disabled={saveTaskMutation.isPending}>
                {saveTaskMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mobile Tech Copilot FAB & Widget */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
          {showVoiceCopilot && (
            <div className="pointer-events-auto">
              <MobileTechVoiceCopilot 
                onClose={() => setShowVoiceCopilot(false)} 
                jobId={selectedJobId || undefined} 
              />
            </div>
          )}
          {!showVoiceCopilot && (
            <Button 
              className="pointer-events-auto h-14 w-14 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 p-0" 
              onClick={() => setShowVoiceCopilot(true)}
            >
              <Bot className="h-6 w-6 text-white" />
            </Button>
          )}
        </div>
    </>
  );

  if (projectId) {
    return (
      <Tabs defaultValue="work-orders" className="w-full">
        <div className="border-b px-3 sm:px-4 md:px-8 bg-card/60 backdrop-blur sticky top-0 z-20">
          <TabsList className="bg-transparent border-0 gap-6 h-12 p-0">
            <TabsTrigger value="work-orders" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full bg-transparent px-0 font-bold text-sm shadow-none">
              Work Orders
            </TabsTrigger>
            <TabsTrigger value="shifts" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full bg-transparent px-0 font-bold text-sm shadow-none">
              Shift Schedule
            </TabsTrigger>
            <TabsTrigger value="dispatch" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full bg-transparent px-0 font-bold text-sm shadow-none">
              Dispatch Board
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="work-orders" className="mt-0 border-0 outline-none">
          {pageContent}
        </TabsContent>
        <TabsContent value="shifts" className="p-3 sm:p-4 md:p-8 mt-0 border-0 outline-none">
          {company?.id && <ShiftScheduler companyId={company.id} projectId={projectId} />}
        </TabsContent>
        <TabsContent value="dispatch" className="p-3 sm:p-4 md:p-8 mt-0 border-0 outline-none">
          {company?.id && <DispatchBoard companyId={company.id} projectId={projectId} />}
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <>
      <SEO
        title="Work Orders & Dispatch Scheduling"
        description="Schedule work orders, visual shifts calendars, and dispatch field crew members."
        path="/work-orders"
        noIndex
      />
      <DashboardLayout
        activeTab="work-orders"
        companyName={company?.name || ""}
        companyPrefix={company?.prefix || ""}
        companyId={company?.id || ""}
      >
        <Tabs defaultValue="work-orders" className="w-full">
          <div className="border-b px-3 sm:px-4 md:px-8 bg-card/60 backdrop-blur sticky top-0 z-20">
            <TabsList className="bg-transparent border-0 gap-6 h-12 p-0">
              <TabsTrigger value="work-orders" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full bg-transparent px-0 font-bold text-sm shadow-none">
                Work Orders
              </TabsTrigger>
              <TabsTrigger value="shifts" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full bg-transparent px-0 font-bold text-sm shadow-none">
                Shift Schedule
              </TabsTrigger>
              <TabsTrigger value="dispatch" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full bg-transparent px-0 font-bold text-sm shadow-none">
                Dispatch Board
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="work-orders" className="mt-0 border-0 outline-none">
            {pageContent}
          </TabsContent>
          <TabsContent value="shifts" className="p-3 sm:p-4 md:p-8 mt-0 border-0 outline-none">
            {company?.id && <ShiftScheduler companyId={company.id} />}
          </TabsContent>
          <TabsContent value="dispatch" className="p-3 sm:p-4 md:p-8 mt-0 border-0 outline-none">
            {company?.id && <DispatchBoard companyId={company.id} />}
          </TabsContent>
        </Tabs>
      </DashboardLayout>
    </>
  );
}
