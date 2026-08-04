import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  ClipboardList,
  Receipt,
  ShieldAlert,
  BarChart3,
  Building2,
  Plus,
  X,
  Loader2,
  Briefcase,
  BrainCircuit,
  Target,
  TrendingUp,
  ShieldCheck,
  Eye,
  Check,
  FileText,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  ExternalLink,
  Edit2,
  Trash2,
  Layers,
  Compass,
  Play,
  CheckCircle2,
  Pause,
} from "lucide-react";
import { format } from "date-fns";

// Lazy-loaded tab pages
import WorkOrdersPage from "./WorkOrdersPage";
import InvoicesPage from "./InvoicesPage";
import SafetyPage from "./SafetyPage";
import ReportsPage from "./ReportsPage";

// Advanced custom components
import DocumentScanner from "@/components/DocumentScanner";
import InteractiveSpreadsheet from "@/components/InteractiveSpreadsheet";
import { APIProvider } from "@vis.gl/react-google-maps";
import LiveMap from "@/components/LiveMap";

interface Project {
  id: string;
  company_id: string;
  customer_id: string;
  name: string;
  ref_number: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  geofence_radius: number;
  budget_labour_cost: number;
  contract_value: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  customer?: { id: string; name: string; phone: string | null; email: string | null };
}

interface Phase {
  id: string;
  project_id: string;
  name: string;
  status: string;
  progress_percent: number;
  start_date: string | null;
  end_date: string | null;
}

interface Assignment {
  id: string;
  project_id: string;
  staff_id: string;
  role: string;
  assigned_at: string;
  crew_id?: string | null;
  crew?: { id: string; name: string };
  staff?: { id: string; full_name: string; username: string; hourly_rate: number; job_title: string | null };
}

interface StaffOption {
  id: string;
  full_name: string;
  username: string;
  hourly_rate: number;
  job_title: string | null;
}

export default function ProjectDetailWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeWorkspaceTab = searchParams.get("tab") || "overview";
  const { user, company, staffProfile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("get-maps-key");
        if (data?.key) setApiKey(data.key);
      } catch (e) {
        console.error("Error fetching maps key", e);
      }
    })();
  }, [user]);

  // Document states
  const [scannerOpen, setScannerOpen] = useState(false);
  const [spreadsheetOpen, setSpreadsheetOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  // Rework action dialog states
  const [reworkTaskId, setReworkTaskId] = useState<string | null>(null);
  const [reworkFeedback, setReworkFeedback] = useState("");
  const [reworkDialogOpen, setReworkDialogOpen] = useState(false);

  // Lightbox photo preview
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Phase dialog states
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [phaseName, setPhaseName] = useState("");
  const [phaseStatus, setPhaseStatus] = useState("Not Started");
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [phaseStart, setPhaseStart] = useState("");
  const [phaseEnd, setPhaseEnd] = useState("");

  // Custom project costs query and mutations state variables
  const [showAddRow, setShowAddRow] = useState(false);
  const [newCostCategory, setNewCostCategory] = useState("");
  const [newCostTitle, setNewCostTitle] = useState("");
  const [newCostBudget, setNewCostBudget] = useState("");
  const [newCostActual, setNewCostActual] = useState("");
  const [savingCostRow, setSavingCostRow] = useState(false);

  // Fetch Project Costs
  const { data: projectCosts = [], refetch: refetchCosts } = useQuery({
    queryKey: ["project_costs", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("project_costs")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleAddCost = async () => {
    if (!newCostCategory.trim() || !newCostTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category and description.",
        variant: "destructive",
      });
      return;
    }
    setSavingCostRow(true);
    try {
      const { error } = await supabase
        .from("project_costs")
        .insert({
          project_id: id!,
          company_id: project!.company_id,
          category: newCostCategory.trim(),
          title: newCostTitle.trim(),
          budget_amount: Number(newCostBudget) || 0,
          actual_amount: Number(newCostActual) || 0,
        });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Cost item added successfully!",
      });
      refetchCosts();
      setNewCostCategory("");
      setNewCostTitle("");
      setNewCostBudget("");
      setNewCostActual("");
      setShowAddRow(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: `Failed to add cost item: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setSavingCostRow(false);
    }
  };

  const handleDeleteCost = async (costId: string) => {
    if (!confirm("Are you sure you want to delete this cost item?")) return;
    try {
      const { error } = await supabase
        .from("project_costs")
        .delete()
        .eq("id", costId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Cost item deleted successfully!",
      });
      refetchCosts();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: `Failed to delete cost item: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  // 1. Fetch Project Details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project_detail", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          customer:customers(id, name, phone, email)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return {
        ...data,
        customer: data.customer
          ? { id: data.customer.id, name: data.customer.name, phone: data.customer.phone, email: data.customer.email }
          : undefined,
      } as Project;
    },
    enabled: !!id,
  });

  // 2. Fetch Project Phases
  const { data: phases = [], refetch: refetchPhases } = useQuery({
    queryKey: ["project_phases", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("project_phases")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Phase[];
    },
    enabled: !!id,
  });

  // 3. Fetch Team Assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["project_assignments", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("project_assignments")
        .select(`
          *,
          staff:staff_profiles(id, full_name, username, hourly_rate, job_title),
          crew:crews(id, name)
        `)
        .eq("project_id", id)
        .order("assigned_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((a: any) => ({
        ...a,
        staff: a.staff
          ? { id: a.staff.id, full_name: a.staff.full_name, username: a.staff.username, hourly_rate: a.staff.hourly_rate, job_title: a.staff.job_title }
          : undefined,
        crew: a.crew ? { id: a.crew.id, name: a.crew.name } : undefined,
      })) as Assignment[];
    },
    enabled: !!id,
  });

  // 4. Fetch all staff for assignment picker
  const { data: allStaff = [] } = useQuery({
    queryKey: ["all_staff", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, full_name, username, hourly_rate, job_title")
        .eq("company_id", company.id)
        .eq("is_active", true)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data as StaffOption[];
    },
    enabled: !!company?.id,
  });

  // Fetch available crews for the company
  const { data: companyCrews = [] } = useQuery({
    queryKey: ["company_crews", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("crews")
        .select("id, name, description")
        .eq("company_id", company.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  // 5. Fetch job/invoice counts for quick stats
  const { data: jobCount = 0 } = useQuery({
    queryKey: ["project_job_count", id],
    queryFn: async () => {
      if (!id) return 0;
      const { count, error } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("project_id", id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!id,
  });

  const { data: incidentCount = 0 } = useQuery({
    queryKey: ["project_incident_count", id],
    queryFn: async () => {
      if (!id) return 0;
      const { count, error } = await supabase
        .from("incident_reports")
        .select("*", { count: "exact", head: true })
        .eq("project_id", id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!id,
  });

  // 6. Fetch Project Documents
  const { data: documents = [], refetch: refetchDocs } = useQuery({
    queryKey: ["project_documents", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("project_documents")
        .select(`
          *,
          uploader:staff_profiles(full_name)
        `)
        .eq("project_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // 7. Fetch tasks needing verification (Completed tasks)
  const { data: approvalTasks = [], refetch: refetchApprovalTasks } = useQuery({
    queryKey: ["project_approval_tasks", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:staff_profiles(id, full_name, username),
          job:jobs!inner(id, title, project_id)
        `)
        .eq("job.project_id", id)
        .eq("status", "Completed")
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch all tasks to compute phase-level labor cost estimates
  const { data: allProjectTasks = [] } = useQuery({
    queryKey: ["project_all_tasks", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          id,
          name,
          est_hours,
          status,
          phase_id,
          assignee:staff_profiles(id, full_name, hourly_rate),
          job:jobs!inner(id, project_id)
        `)
        .eq("job.project_id", id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch invoices for this specific project to feed project overview progress ring widgets
  const { data: projectInvoices = [] } = useQuery({
    queryKey: ["project_invoices_summary", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id,
          amount,
          status,
          payment_status,
          job:jobs!inner(id, project_id)
        `)
        .eq("job.project_id", id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Assign staff mutation
  const assignStaffMutation = useMutation({
    mutationFn: async (staffId: string) => {
      if (!id) throw new Error("No project ID");
      const staffMember = allStaff.find((s) => s.id === staffId);
      const role = staffMember?.job_title || "Field Crew";
      const { error } = await supabase.from("project_assignments").insert({
        project_id: id,
        staff_id: staffId,
        role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_assignments", id] });
      toast({ title: "Staff assigned", description: "Field crew member added to the project." });
    },
    onError: (err: any) => {
      toast({
        title: "Assignment failed",
        description: err.message?.includes("unique_project_staff")
          ? "This staff member is already assigned."
          : err.message,
        variant: "destructive",
      });
    },
  });

  // Assign entire crew mutation
  const assignCrewMutation = useMutation({
    mutationFn: async (crewId: string) => {
      if (!id) throw new Error("No project ID");
      // 1. Fetch crew members
      const { data: crewMembers, error: memErr } = await supabase
        .from("crew_members")
        .select(`
          staff_id,
          staff_profiles:staff_profiles(job_title)
        `)
        .eq("crew_id", crewId);
      if (memErr) throw memErr;
      if (!crewMembers || crewMembers.length === 0) {
        throw new Error("This crew group has no members.");
      }

      // 2. Filter out already assigned staff
      const assignedStaffIds = new Set(assignments.map((a) => a.staff_id));
      const newMembers = crewMembers.filter((m) => !assignedStaffIds.has(m.staff_id));

      if (newMembers.length === 0) {
        throw new Error("All members of this crew are already assigned to this project.");
      }

      // 3. Insert project assignments
      const inserts = newMembers.map((m) => ({
        project_id: id,
        staff_id: m.staff_id,
        role: m.staff_profiles?.job_title || "Field Crew",
        crew_id: crewId,
      }));

      const { error: insErr } = await supabase.from("project_assignments").insert(inserts);
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_assignments", id] });
      toast({ title: "Crew Assigned", description: "All crew members have been assigned to the project." });
    },
    onError: (err: any) => {
      toast({ title: "Assignment failed", description: err.message, variant: "destructive" });
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase.from("project_assignments").delete().eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_assignments", id] });
      toast({ title: "Staff removed", description: "Crew member unassigned from the project." });
    },
    onError: (err: any) => {
      toast({ title: "Removal failed", description: err.message, variant: "destructive" });
    },
  });

  // Task Verification Board mutations
  const approveTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          approval_status: "Approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchApprovalTasks();
      toast({ title: "Task Approved", description: "Field crew's work has been verified." });
    },
    onError: (err: any) => {
      toast({ title: "Approval failed", description: err.message, variant: "destructive" });
    },
  });

  const rejectTaskMutation = useMutation({
    mutationFn: async ({ taskId, feedback }: { taskId: string; feedback: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          approval_status: "Rejected",
          status: "In Progress", // Reset status back to In Progress so field crew sees it as active
          manager_feedback: feedback,
        })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchApprovalTasks();
      setReworkDialogOpen(false);
      setReworkFeedback("");
      setReworkTaskId(null);
      toast({ title: "Rework Requested", description: "Field crew member has been requested to perform rework." });
    },
    onError: (err: any) => {
      toast({ title: "Rework request failed", description: err.message, variant: "destructive" });
    },
  });

  // Project Phase mutations
  const savePhaseMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No project selected");
      if (!phaseName.trim()) throw new Error("Phase title name is required");

      const payload = {
        project_id: id,
        name: phaseName.trim(),
        status: phaseStatus,
        progress_percent: phaseProgress,
        start_date: phaseStart || null,
        end_date: phaseEnd || null,
      };

      if (editingPhase) {
        const { error } = await supabase
          .from("project_phases")
          .update(payload)
          .eq("id", editingPhase.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("project_phases").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchPhases();
      toast({
        title: editingPhase ? "Phase updated" : "Phase added",
        description: `Successfully saved ${phaseName}.`,
      });
      closePhaseDialog();
    },
    onError: (err: any) => {
      toast({
        title: "Error saving phase",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deletePhaseMutation = useMutation({
    mutationFn: async (phaseId: string) => {
      const { error } = await supabase.from("project_phases").delete().eq("id", phaseId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchPhases();
      toast({
        title: "Phase removed",
        description: "The phase was deleted from this project.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error deleting phase",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Custom spreadsheet document mutation
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

      toast({ title: "Spreadsheet updated", description: "All edits compiled and saved." });
      refetchDocs();
      setSpreadsheetOpen(false);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
  };

  // Drag and drop / local upload for standard compliance documents
  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const isCsv = file.name.endsWith(".csv");
      const filename = `${file.name.replace(/\s+/g, "_")}_${Date.now()}`;
      const filePath = `documents/${id}/${filename}`;
      
      const { error: uploadErr } = await supabase.storage
        .from("task-attachments")
        .upload(filePath, file, { contentType: isCsv ? "text/csv" : file.type });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("task-attachments")
        .getPublicUrl(filePath);

      const { error: dbErr } = await supabase.from("project_documents").insert({
        project_id: id,
        name: file.name,
        file_url: urlData.publicUrl,
        file_type: isCsv ? "csv" : file.type.startsWith("image/") ? "image" : "pdf",
        uploaded_by: staffProfile?.id || null,
      });

      if (dbErr) throw dbErr;

      toast({ title: "File uploaded", description: `${file.name} saved successfully.` });
      refetchDocs();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  // Phase helper actions
  const openPhaseDialog = (phase?: Phase) => {
    if (phase) {
      setEditingPhase(phase);
      setPhaseName(phase.name);
      setPhaseStatus(phase.status);
      setPhaseProgress(phase.progress_percent);
      setPhaseStart(phase.start_date || "");
      setPhaseEnd(phase.end_date || "");
    } else {
      setEditingPhase(null);
      setPhaseName("");
      setPhaseStatus("Not Started");
      setPhaseProgress(0);
      setPhaseStart(format(new Date(), "yyyy-MM-dd"));
      setPhaseEnd("");
    }
    setPhaseDialogOpen(true);
  };

  const closePhaseDialog = () => {
    setPhaseDialogOpen(false);
    setEditingPhase(null);
  };

  // Helper for safe date parsing and formatting
  const formatDateSafely = (dateStr: string | null | undefined, formatStr: string) => {
    if (!dateStr) return "—";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        return format(date, formatStr);
      }
      return format(new Date(dateStr), formatStr);
    } catch {
      return "—";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Planning":
        return <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/5 gap-1"><Compass className="h-3 w-3" /> Planning</Badge>;
      case "Active":
        return <Badge variant="outline" className="text-green-600 border-green-500/30 bg-green-500/5 gap-1"><Play className="h-3 w-3 animate-pulse" /> Active</Badge>;
      case "Completed":
        return <Badge variant="outline" className="text-blue-600 border-blue-500/30 bg-blue-500/5 gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>;
      case "On Hold":
        return <Badge variant="outline" className="text-rose-600 border-rose-500/30 bg-rose-500/5 gap-1"><Pause className="h-3 w-3" /> On Hold</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
      case "Planning":
        return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      case "Completed":
        return "bg-blue-500/10 text-blue-600 border-blue-500/30";
      case "On Hold":
        return "bg-red-500/10 text-red-600 border-red-500/30";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/30";
    }
  };

  // Filter tasks needing verification
  const pendingApprovals = approvalTasks.filter((t) => t.approval_status === "Pending");
  const approvalHistory = approvalTasks.filter((t) => t.approval_status !== "Pending");

  // Project Invoices Math
  const validProjInvoices = projectInvoices.filter((inv: any) => inv.status !== "Draft" && inv.status !== "Void");
  const projTotalInvoiced = validProjInvoices.reduce((sum: number, inv: any) => sum + Number(inv.amount || 0), 0);
  const projTotalCollected = validProjInvoices.reduce((sum: number, inv: any) => {
    if (inv.payment_status === "Paid") return sum + Number(inv.amount || 0);
    if (inv.payment_status === "Partially Paid") return sum + (Number(inv.amount || 0) * 0.5);
    return sum;
  }, 0);

  const contractVal = Number(project?.contract_value) || 0;
  const invoicedRate = contractVal > 0 ? (projTotalInvoiced / contractVal) * 100 : 0;
  const collectionRate = projTotalInvoiced > 0 ? (projTotalCollected / projTotalInvoiced) * 100 : 0;

  // Derived values
  const assignedStaffIds = new Set(assignments.map((a) => a.staff_id));
  const availableStaff = allStaff.filter((s) => !assignedStaffIds.has(s.id));
  const overallProgress =
    phases.length > 0
      ? Math.round(phases.reduce((sum, p) => sum + p.progress_percent, 0) / phases.length)
      : 0;

  // Loading state
  if (projectLoading) {
    return (
      <DashboardLayout activeTab="projects" companyName={company?.name || ""} companyPrefix={company?.prefix || ""} companyId={company?.id || ""}>
        <div className="flex justify-center items-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Not found state
  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Project not found.</p>
        <Button variant="outline" onClick={() => navigate("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${project.name} | Project Workspace`}
        description={`Manage all aspects of ${project.name} from one central workspace.`}
        path={`/projects/${id}`}
        noIndex
      />
      <DashboardLayout
        activeTab={
          activeWorkspaceTab === "overview" ? "overview" :
          activeWorkspaceTab === "work-orders" ? "work-orders" :
          activeWorkspaceTab === "map" ? "map" :
          activeWorkspaceTab === "team" ? "staff" :
          activeWorkspaceTab === "billing" ? "invoices" :
          activeWorkspaceTab === "safety" ? "safety" :
          activeWorkspaceTab === "reports" ? "reports" :
          "projects"
        }
        companyName={company?.name || ""}
        companyPrefix={company?.prefix || ""}
        companyId={company?.id || ""}
      >
        <div className="p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
          {/* Breadcrumb & Header */}
          <div className="flex flex-col gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit gap-2 text-muted-foreground hover:text-foreground font-semibold"
              onClick={() => navigate("/projects")}
            >
              <ArrowLeft className="h-4 w-4" /> All Projects
            </Button>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                    {project.name}
                  </h1>
                  <Badge variant="outline" className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-primary" /> {project.ref_number}
                  </span>
                  {project.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> {project.address}
                    </span>
                  )}
                  {project.customer && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-primary" /> {project.customer.name}
                    </span>
                  )}
                  {project.start_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-primary" /> {project.start_date}
                      {project.end_date ? ` → ${project.end_date}` : ""}
                    </span>
                  )}
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground/80 max-w-2xl">{project.description}</p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex gap-3">
                <div className="bg-primary/10 rounded-xl p-3 text-center min-w-[90px]">
                  <p className="text-2xl font-bold text-primary">{jobCount}</p>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Jobs</p>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-3 text-center min-w-[90px]">
                  <p className="text-2xl font-bold text-emerald-600">{assignments.length}</p>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Crew</p>
                </div>
                <div className="bg-red-500/10 rounded-xl p-3 text-center min-w-[90px]">
                  <p className="text-2xl font-bold text-red-600">{incidentCount}</p>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Incidents</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Draft Banner */}
          {searchParams.get("review") === "ai_draft" && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 fade-in duration-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg shrink-0">
                  <BrainCircuit className="h-6 w-6 text-indigo-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-indigo-700 text-base">AI Draft Mode</h3>
                  <p className="text-xs text-indigo-600/80">This project, invoice, and team were drafted by the AI Operations Assistant. Review the tabs below to confirm accuracy.</p>
                </div>
              </div>
              <Button 
                onClick={() => {
                  searchParams.delete("review");
                  setSearchParams(searchParams);
                  toast({ title: "AI Plan Executed", description: "The project has been officially activated and teams dispatched." });
                }} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold whitespace-nowrap shrink-0"
              >
                Approve & Execute Plan
              </Button>
            </div>
          )}

          {/* Tabs */}
          <Tabs
            value={activeWorkspaceTab}
            onValueChange={(val) => setSearchParams({ tab: val })}
            className="space-y-6"
          >
            <style>{`
              .scrollbar-none::-webkit-scrollbar { display: none; }
              .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <TabsList className="bg-muted/60 p-1 h-10 w-full flex overflow-x-auto scrollbar-none gap-1 justify-start border-none">
              <TabsTrigger value="overview" className="gap-1.5 text-xs shrink-0">
                <Target className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-1.5 text-xs shrink-0">
                <Users className="h-3.5 w-3.5" /> Team
              </TabsTrigger>
              <TabsTrigger value="work-orders" className="gap-1.5 text-xs shrink-0">
                <ClipboardList className="h-3.5 w-3.5" /> Work Orders
              </TabsTrigger>
              <TabsTrigger value="approvals" className="gap-1.5 text-xs shrink-0">
                <ShieldCheck className="h-3.5 w-3.5" /> Approvals
                {pendingApprovals.length > 0 && (
                  <span className="h-4 w-4 text-[9px] font-bold rounded-full bg-rose-500 text-white flex items-center justify-center animate-pulse ml-1">
                    {pendingApprovals.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-1.5 text-xs shrink-0">
                <FileText className="h-3.5 w-3.5" /> Documents
              </TabsTrigger>
              <TabsTrigger value="billing" className="gap-1.5 text-xs shrink-0">
                <Receipt className="h-3.5 w-3.5" /> Billing
              </TabsTrigger>
              <TabsTrigger value="safety" className="gap-1.5 text-xs shrink-0">
                <ShieldAlert className="h-3.5 w-3.5" /> Safety
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-1.5 text-xs shrink-0">
                <BarChart3 className="h-3.5 w-3.5" /> Reports
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-1.5 text-xs shrink-0">
                <MapPin className="h-3.5 w-3.5" /> Map & Crew
              </TabsTrigger>
              <TabsTrigger value="costs" className="gap-1.5 text-xs shrink-0">
                <TrendingUp className="h-3.5 w-3.5" /> Budget & Costs
              </TabsTrigger>
            </TabsList>

            {/* ─── OVERVIEW TAB ─── */}
            <TabsContent value="overview" className="space-y-6">
              <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2 sm:grid sm:grid-cols-3 sm:pb-0">
                <Card className="border-border/50 min-w-[240px] shrink-0 sm:min-w-0">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Contract Value</p>
                      <p className="text-2xl font-bold">
                        ${Number(project.contract_value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 min-w-[240px] shrink-0 sm:min-w-0">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-lg text-amber-600">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Labour Budget</p>
                      <p className="text-2xl font-bold">
                        ${Number(project.budget_labour_cost).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 min-w-[240px] shrink-0 sm:min-w-0">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-600">
                      <Target className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Overall Progress</p>
                      <div className="flex items-center gap-3">
                        <p className="text-2xl font-bold">{overallProgress}%</p>
                        <Progress value={overallProgress} className="w-24 h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Progress Gauges (Modern 2026-style circular analytics) */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Invoiced Progress</CardTitle>
                      <CardDescription className="text-xs mt-0.5">Project contract value billed to date.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="h-[100px] w-[100px] relative shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          cx="50%"
                          cy="50%"
                          innerRadius="72%"
                          outerRadius="100%"
                          barSize={6}
                          data={[{ name: "Invoiced", value: invoicedRate, fill: "#3b82f6" }]}
                          startAngle={90}
                          endAngle={-270}
                        >
                          <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            angleAxisId={0}
                            tick={false}
                          />
                          <RadialBar
                            background={{ fill: "hsl(var(--muted)/0.3)" }}
                            dataKey="value"
                            cornerRadius={4}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-foreground">
                        {Math.round(invoicedRate)}%
                      </div>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center gap-6">
                        <span className="text-muted-foreground font-semibold">Total Invoiced:</span>
                        <span className="font-extrabold text-foreground">${projTotalInvoiced.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center gap-6">
                        <span className="text-muted-foreground font-semibold">Contract Budget:</span>
                        <span className="font-bold text-muted-foreground">${contractVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Collection Efficiency</CardTitle>
                      <CardDescription className="text-xs mt-0.5">Billed invoices collected in cash.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="h-[100px] w-[100px] relative shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          cx="50%"
                          cy="50%"
                          innerRadius="72%"
                          outerRadius="100%"
                          barSize={6}
                          data={[{ name: "Collected", value: collectionRate, fill: "#10b981" }]}
                          startAngle={90}
                          endAngle={-270}
                        >
                          <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            angleAxisId={0}
                            tick={false}
                          />
                          <RadialBar
                            background={{ fill: "hsl(var(--muted)/0.3)" }}
                            dataKey="value"
                            cornerRadius={4}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-foreground">
                        {Math.round(collectionRate)}%
                      </div>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center gap-6">
                        <span className="text-muted-foreground font-semibold">Collected Cash:</span>
                        <span className="font-extrabold text-emerald-600">${projTotalCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center gap-6">
                        <span className="text-muted-foreground font-semibold">Pending Balance:</span>
                        <span className="font-bold text-rose-600">${(projTotalInvoiced - projTotalCollected).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Repositioned Project Phases milestone editor */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Layers className="h-5 w-5 text-primary" />
                      Project Milestone Phases ({phases.length})
                    </CardTitle>
                    <CardDescription>Configure stage timelines and complete percentages.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openPhaseDialog()} className="gap-1.5 text-xs font-semibold">
                    <Plus className="h-3.5 w-3.5" /> Add Phase
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {phases.length === 0 ? (
                    <div className="text-center py-10 border rounded-lg border-dashed text-muted-foreground text-sm">
                      No phases configured. Click "Add Phase" to structure construction milestones.
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                       {phases.map((phase) => {
                        const phaseTasks = allProjectTasks.filter((t: any) => t.phase_id === phase.id);
                        const phaseEstHours = phaseTasks.reduce((sum, t) => sum + Number(t.est_hours || 0), 0);
                        const phaseEstLaborCost = phaseTasks.reduce((sum, t) => {
                          const rate = Number(t.assignee?.hourly_rate) || 25.00;
                          return sum + (Number(t.est_hours || 0) * rate);
                        }, 0);

                        return (
                          <div
                            key={phase.id}
                            className="p-4 border border-border/60 rounded-lg bg-card space-y-3 relative group"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-bold text-sm text-foreground">{phase.name}</h4>
                                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                                  {formatDateSafely(phase.start_date, "MMM d")}
                                  {" to "}
                                  {formatDateSafely(phase.end_date, "MMM d, yyyy")}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {getStatusBadge(phase.status)}
                                <div className="flex items-center gap-0.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openPhaseDialog(phase)}
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (confirm(`Delete phase "${phase.name}"?`)) {
                                        deletePhaseMutation.mutate(phase.id);
                                      }
                                    }}
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                                <span>Phase Progress</span>
                                <span>{phase.progress_percent}%</span>
                              </div>
                              <Progress value={phase.progress_percent} className="h-2" />
                            </div>

                            <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                              <span>{phaseTasks.length} task{phaseTasks.length === 1 ? "" : "s"} ({phaseEstHours.toFixed(1)} hrs)</span>
                              <span className="font-semibold text-foreground">
                                Est. Labor: ${phaseEstLaborCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {project.customer && (
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5" /> Client Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-3 text-sm">
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Name</p>
                          <p className="font-semibold">{project.customer.name}</p>
                        </div>
                        {project.customer.email && (
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Email</p>
                            <p className="font-semibold">{project.customer.email}</p>
                          </div>
                        )}
                        {project.customer.phone && (
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Phone</p>
                            <p className="font-semibold">{project.customer.phone}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {project.address && (
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5" /> Site Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-3 text-sm">
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Address</p>
                          <p className="font-semibold">{project.address}</p>
                        </div>
                        {project.latitude && project.longitude && (
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Coordinates</p>
                            <p className="font-semibold">
                              {project.latitude.toFixed(6)}, {project.longitude.toFixed(6)}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Geofence Radius</p>
                          <p className="font-semibold">{project.geofence_radius}m</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ─── BUDGETS & COSTS TAB ─── */}
            <TabsContent value="costs" className="space-y-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-indigo-400" /> Project Budgets & Expenses
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Track specific line item category budgets (e.g. Marketing, Foundation, Transportation) against actual spent amounts.
                    </CardDescription>
                  </div>
                  {!showAddRow && (
                    <Button 
                      onClick={() => setShowAddRow(true)}
                      size="sm" 
                      className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-[0_0_10px_rgba(37,99,235,0.2)]"
                    >
                      <Plus className="h-4 w-4" /> Add Cost Line
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Inline Adding Row */}
                  {showAddRow && (
                    <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-600/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <h4 className="text-xs font-bold text-blue-400">Add New Cost Line Item</h4>
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Category</label>
                          <Input 
                            placeholder="e.g. Marketing, Foundation" 
                            value={newCostCategory} 
                            onChange={(e) => setNewCostCategory(e.target.value)} 
                            className="h-9 text-xs" 
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">What is it for?</label>
                          <Input 
                            placeholder="e.g. Google Ads Campaign, Concrete Foundation" 
                            value={newCostTitle} 
                            onChange={(e) => setNewCostTitle(e.target.value)} 
                            className="h-9 text-xs" 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Budget ($)</label>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              value={newCostBudget} 
                              onChange={(e) => setNewCostBudget(e.target.value)} 
                              className="h-9 text-xs" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Actual Spent ($)</label>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              value={newCostActual} 
                              onChange={(e) => setNewCostActual(e.target.value)} 
                              className="h-9 text-xs" 
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-border/20">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setShowAddRow(false); }} 
                          className="h-8 text-xs font-semibold"
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleAddCost} 
                          disabled={savingCostRow}
                          className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {savingCostRow ? "Saving..." : "Save Cost Item"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {projectCosts.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-2xl bg-card/10">
                      <TrendingUp className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-xs font-semibold text-muted-foreground italic">No custom project costs added yet.</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Click the "Add Cost Line" button to record custom expenses.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projectCosts.map((item) => {
                        const budget = Number(item.budget_amount) || 0;
                        const actual = Number(item.actual_amount) || 0;
                        const pct = budget > 0 ? (actual / budget) * 100 : 0;
                        const isOverrun = actual > budget && budget > 0;
                        const overrunAmount = actual - budget;

                        let fillClass = "bg-emerald-500";
                        let borderClass = "border-emerald-500/20";
                        let bgClass = "bg-emerald-500/5";
                        let textClass = "text-emerald-400";

                        if (pct > 70 && pct <= 100) {
                          fillClass = "bg-amber-500";
                          borderClass = "border-amber-500/20";
                          bgClass = "bg-amber-500/5";
                          textClass = "text-amber-400";
                        } else if (pct > 100) {
                          fillClass = "bg-rose-500 animate-pulse";
                          borderClass = "border-rose-500/30";
                          bgClass = "bg-rose-500/5";
                          textClass = "text-rose-400";
                        }

                        return (
                          <div 
                            key={item.id} 
                            className={`p-4 rounded-xl border ${borderClass} ${bgClass} transition-all duration-300 hover:scale-[1.005]`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-slate-800 text-slate-200 border-border text-[10px] uppercase font-mono tracking-wider">
                                    {item.category}
                                  </Badge>
                                  <span className="text-xs font-bold text-slate-100">{item.title}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  Recorded on {format(new Date(item.created_at), "MMM d, yyyy")}
                                </p>
                              </div>
                              <div className="flex items-center gap-6 self-end sm:self-center">
                                <div className="text-right">
                                  <span className="text-[10px] font-bold text-muted-foreground block">BUDGET</span>
                                  <span className="text-xs font-mono font-bold text-slate-300">
                                    ${budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-bold text-muted-foreground block">ACTUAL SPENT</span>
                                  <span className="text-xs font-mono font-extrabold text-slate-100">
                                    ${actual.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0" 
                                  onClick={() => handleDeleteCost(item.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Filling-type Progress Bar Analytic */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-semibold text-muted-foreground">Budget Consumption</span>
                                <span className={`font-mono font-bold ${textClass}`}>
                                  {budget > 0 
                                    ? `${pct.toFixed(0)}% consumed` 
                                    : "No budget defined"
                                  }
                                  {isOverrun && ` (${overrunAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })} overrun)`}
                                </span>
                              </div>
                              <div className="h-3 w-full bg-slate-950/60 border border-[#233558]/40 rounded-full overflow-hidden relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                                <div 
                                  className={`h-full rounded-full transition-all duration-700 ease-out ${fillClass}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── TEAM TAB ─── */}
            <TabsContent value="team" className="space-y-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5" /> Assign Crew / Groups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Individual Assignment */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground block">Assign Individual Staff Member</label>
                      {availableStaff.length > 0 ? (
                        <div className="flex items-center gap-3">
                          <Select
                            onValueChange={(staffId) => assignStaffMutation.mutate(staffId)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a crew member..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableStaff.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.full_name} (@{s.username}) {s.job_title ? `· ${s.job_title}` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {assignStaffMutation.isPending && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic py-2">
                          All active crew members are assigned to this project.
                        </p>
                      )}
                    </div>

                    {/* Crew Group Assignment */}
                    <div className="space-y-2 border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                      <label className="text-xs font-semibold text-muted-foreground block">Assign Entire Crew Group</label>
                      {companyCrews.length > 0 ? (
                        <div className="flex items-center gap-3">
                          <Select
                            onValueChange={(crewId) => assignCrewMutation.mutate(crewId)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a crew group..." />
                            </SelectTrigger>
                            <SelectContent>
                              {companyCrews.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {assignCrewMutation.isPending && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic py-2">
                          No crew groups created yet. Create groups in the Staff panel.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" /> Assigned Crew ({assignments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignmentsLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : assignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No crew members assigned yet. Use the selector above to add team members.
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {assignments.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {a.staff?.full_name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">
                                {a.staff?.full_name || "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @{a.staff?.username} · ${a.staff?.hourly_rate}/hr
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {a.role}
                            </Badge>
                            {a.crew?.name && (
                              <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
                                {a.crew.name}
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => removeAssignmentMutation.mutate(a.id)}
                              disabled={removeAssignmentMutation.isPending}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── WORK ORDERS TAB ─── */}
            <TabsContent value="work-orders">
              <WorkOrdersPage projectId={id} />
            </TabsContent>

            {/* ─── APPROVALS TAB ─── */}
            <TabsContent value="approvals" className="space-y-6">
              {/* Pending Approvals Queue */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Pending Work Verifications ({pendingApprovals.length})
                  </CardTitle>
                  <CardDescription>
                    Review photo checklists and field notes submitted by field crew members before final sign-off.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {pendingApprovals.length === 0 ? (
                    <div className="text-center py-10 border rounded-lg border-dashed text-muted-foreground text-sm">
                      All field crew submissions are verified. No pending tasks in the review queue.
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {pendingApprovals.map((task) => (
                        <div
                          key={task.id}
                          className="p-5 rounded-lg border bg-card flex flex-col gap-4 shadow-sm"
                        >
                          {/* Info Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-base text-foreground">{task.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                Job: <span className="font-semibold text-foreground/80">{task.job?.title}</span> · 
                                Field Crew: <span className="font-semibold text-foreground/80">{task.assignee?.full_name || "Unassigned"}</span>
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                onClick={() => {
                                  setReworkTaskId(task.id);
                                  setReworkFeedback("");
                                  setReworkDialogOpen(true);
                                }}
                              >
                                Request Rework
                              </Button>
                              <Button
                                size="sm"
                                className="h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => approveTaskMutation.mutate(task.id)}
                                disabled={approveTaskMutation.isPending}
                              >
                                {approveTaskMutation.isPending ? (
                                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                                ) : (
                                  <Check className="h-4.5 w-4.5 mr-1" />
                                )}
                                Approve & Sign Off
                              </Button>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                              Field Crew Field Notes:
                            </span>
                            <p className="text-foreground/80 font-medium italic">
                              "{task.staff_notes || "No notes submitted."}"
                            </p>
                          </div>

                          {/* Side-by-Side Photos */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                <Eye className="h-3 w-3 text-primary" /> Before Photo
                              </span>
                              {task.before_photo_url ? (
                                <div
                                  className="relative rounded-lg overflow-hidden border aspect-video cursor-zoom-in bg-slate-900 group"
                                  onClick={() => setPreviewPhotoUrl(task.before_photo_url)}
                                >
                                  <img
                                    src={task.before_photo_url}
                                    alt="Before view"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </div>
                              ) : (
                                <div className="rounded-lg border aspect-video flex items-center justify-center bg-muted/30 text-xs text-muted-foreground">
                                  No photo uploaded
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                <Eye className="h-3 w-3 text-primary" /> After Photo
                              </span>
                              {task.after_photo_url ? (
                                <div
                                  className="relative rounded-lg overflow-hidden border aspect-video cursor-zoom-in bg-slate-900 group"
                                  onClick={() => setPreviewPhotoUrl(task.after_photo_url)}
                                >
                                  <img
                                    src={task.after_photo_url}
                                    alt="After view"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </div>
                              ) : (
                                <div className="rounded-lg border aspect-video flex items-center justify-center bg-muted/30 text-xs text-muted-foreground">
                                  No photo uploaded
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Historical Log */}
              {approvalHistory.length > 0 && (
                <Card className="border-border/50 shadow-sm opacity-85">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Verification History Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {approvalHistory.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/10 text-xs gap-4"
                        >
                          <div>
                            <p className="font-semibold text-sm">{task.name}</p>
                            <p className="text-muted-foreground mt-0.5">
                              Field Crew: {task.assignee?.full_name || "Unassigned"} · Completed:{" "}
                              {task.completed_at ? new Date(task.completed_at).toLocaleString() : "N/A"}
                            </p>
                            {task.manager_feedback && (
                              <p className="text-rose-600 font-semibold mt-1">
                                Rework feedback: "{task.manager_feedback}"
                              </p>
                            )}
                          </div>
                          <div>
                            {task.approval_status === "Approved" ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                                Verified Approved
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30">
                                Rejected Rework
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ─── DOCUMENTS TAB ─── */}
            <TabsContent value="documents" className="space-y-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Project File Repository</span>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        id="local-file-uploader"
                        className="hidden"
                        onChange={handleLocalFileUpload}
                        accept=".csv,.pdf,image/*"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-semibold gap-1.5"
                        onClick={() => document.getElementById("local-file-uploader")?.click()}
                      >
                        <Plus className="h-3.5 w-3.5" /> Upload File
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 text-xs font-semibold gap-1.5"
                        onClick={() => setScannerOpen(true)}
                      >
                        <FileText className="h-3.5 w-3.5" /> Scan Document
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    View scanned compliance files, invoices, receipts, and edit spreadsheets interactively.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {documents.length === 0 ? (
                    <div className="text-center py-10 border rounded-lg border-dashed text-muted-foreground text-sm">
                      No documents stored in this project folder yet.
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {documents.map((doc: any) => (
                        <Card
                          key={doc.id}
                          className="border-border/60 hover:border-primary/40 hover:bg-accent/10 transition-all cursor-default flex flex-col justify-between"
                        >
                          <CardHeader className="p-3 pb-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {doc.file_url.includes(".csv") ? (
                                  <FileSpreadsheet className="h-7 w-7 text-emerald-600 shrink-0" />
                                ) : (
                                  <FileText className="h-7 w-7 text-primary shrink-0" />
                                )}
                                <div className="truncate max-w-[170px]">
                                  <h4 className="font-bold text-xs truncate" title={doc.name}>
                                    {doc.name}
                                  </h4>
                                  <span className="text-[9px] text-muted-foreground block">
                                    By {doc.uploader?.full_name || "System"}
                                  </span>
                                </div>
                              </div>
                              <Badge className="text-[8px] h-4 font-bold tracking-wider capitalize" variant="secondary">
                                {doc.file_url.includes(".csv") ? "csv" : doc.file_type}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-2 text-[11px] text-muted-foreground flex-1 flex flex-col justify-between gap-3">
                            <p className="line-clamp-2 italic">{doc.notes || "No description logged."}</p>
                            <div className="flex items-center justify-end gap-1.5 pt-2 border-t mt-auto">
                              {doc.file_url.includes(".csv") ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="xs"
                                  className="h-7 text-[10px] font-bold"
                                  onClick={() => {
                                    setSelectedDoc(doc);
                                    setSpreadsheetOpen(true);
                                  }}
                                >
                                  Edit spreadsheet
                                </Button>
                              ) : (
                                <a href={doc.file_url} target="_blank" rel="noreferrer">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    className="h-7 text-[10px] font-bold gap-1.5"
                                  >
                                    View <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </a>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── BILLING TAB ─── */}
            <TabsContent value="billing">
              <InvoicesPage projectId={id} />
            </TabsContent>

            {/* ─── SAFETY TAB ─── */}
            <TabsContent value="safety">
              <SafetyPage projectId={id} />
            </TabsContent>

            {/* ─── REPORTS TAB ─── */}
            <TabsContent value="reports">
              <ReportsPage projectId={id} />
            </TabsContent>

            {/* ─── MAP & CREW TAB ─── */}
            <TabsContent value="map">
              {apiKey ? (
                <APIProvider apiKey={apiKey} libraries={["places"]}>
                  <LiveMap
                    apiKey={apiKey}
                    companyId={company?.id || ""}
                    projectId={id}
                    projectLatitude={project?.latitude || undefined}
                    projectLongitude={project?.longitude || undefined}
                  />
                </APIProvider>
              ) : (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                  <p className="text-sm text-muted-foreground">Loading map...</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>

      {/* ─── DOCUMENT SCANNER MODAL ─── */}
      <DocumentScanner
        projectId={id}
        onUploadSuccess={refetchDocs}
        open={scannerOpen}
        onOpenChange={setScannerOpen}
      />

      {/* ─── SPREADSHEET EDITOR MODAL ─── */}
      <Dialog open={spreadsheetOpen} onOpenChange={setSpreadsheetOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          {selectedDoc && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>{selectedDoc.name}</DialogTitle>
              </DialogHeader>
              <InteractiveSpreadsheet
                fileUrl={`${selectedDoc.file_url}?v=${Date.now()}`}
                onSave={handleSaveSpreadsheet}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── REWORK DIALOG BOARD ─── */}
      <Dialog open={reworkDialogOpen} onOpenChange={setReworkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Request Rework
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground font-semibold">
              Enter comments detailing what changes are required. The task will revert to the field crew member as Active with your remarks.
            </p>
            <Textarea
              placeholder="e.g. Please verify the HVAC connection fittings or take a clearer closeup photo..."
              value={reworkFeedback}
              onChange={(e) => setReworkFeedback(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReworkDialogOpen(false);
                setReworkTaskId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectTaskMutation.isPending || !reworkFeedback.trim()}
              onClick={() =>
                reworkTaskId &&
                rejectTaskMutation.mutate({
                  taskId: reworkTaskId,
                  feedback: reworkFeedback.trim(),
                })
              }
            >
              {rejectTaskMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Send to Crew
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── LIGHTBOX PHOTO PREVIEW ─── */}
      <Dialog open={!!previewPhotoUrl} onOpenChange={(open) => !open && setPreviewPhotoUrl(null)}>
        <DialogContent className="max-w-3xl p-1 bg-black overflow-hidden flex items-center justify-center border-none">
          <img
            src={previewPhotoUrl || ""}
            alt="Task snapshot"
            className="max-h-[85vh] w-auto object-contain rounded"
          />
        </DialogContent>
      </Dialog>

      {/* ─── ADD/EDIT PROJECT PHASE DIALOG ─── */}
      <Dialog open={phaseDialogOpen} onOpenChange={setPhaseDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              {editingPhase ? "Modify Phase Details" : "Construct Milestone Phase"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Phase Title Name *</label>
              <Input
                placeholder="e.g. Concrete Pouring, Inspection"
                value={phaseName}
                onChange={(e) => setPhaseName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Status</label>
                <Select value={phaseStatus} onValueChange={setPhaseStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Completion %</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={phaseProgress}
                  onChange={(e) => setPhaseProgress(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Start Date</label>
                <Input
                  type="date"
                  value={phaseStart}
                  onChange={(e) => setPhaseStart(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Target Completion</label>
                <Input
                  type="date"
                  value={phaseEnd}
                  onChange={(e) => setPhaseEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePhaseDialog}>
              Cancel
            </Button>
            <Button onClick={() => savePhaseMutation.mutate()} disabled={savePhaseMutation.isPending}>
              {savePhaseMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Phase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
