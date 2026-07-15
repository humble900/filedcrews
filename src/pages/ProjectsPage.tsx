import { useState, useEffect } from "react";
import { PaginatedTableFull } from "@/components/PaginatedTable";
import FilterChipBar, { FilterChip } from "@/components/FilterChipBar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useTerminology } from "@/hooks/useTerminology";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  Plus,
  Briefcase,
  Layers,
  MapPin,
  Calendar,
  Building,
  DollarSign,
  TrendingUp,
  Trash2,
  Edit2,
  Compass,
  CheckCircle2,
  Play,
  Pause,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  Users,
  FileText,
  Receipt,
  Target,
  Shield,
  Wrench,
  Sparkles,
  Rocket,
  X,
} from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  name: string;
}

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
  customer?: Customer;
}

export default function ProjectsPage() {
  const { user, company, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTerminology();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Dialog states for Project
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [pName, setPName] = useState("");
  const [pCustId, setPCustId] = useState("");
  const [pRef, setPRef] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pAddress, setPAddress] = useState("");
  const [pLat, setPLat] = useState("");
  const [pLng, setPLng] = useState("");
  const [pRadius, setPRadius] = useState("150");
  const [pBudget, setPBudget] = useState("0");
  const [pContract, setPContract] = useState("0");
  const [pStatus, setPStatus] = useState("Planning");
  const [pStart, setPStart] = useState("");
  const [pEnd, setPEnd] = useState("");

  // ─── Guided Project Creation Flow ────────────────────────────────
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [guidedStep, setGuidedStep] = useState(0);
  const [guidedSaving, setGuidedSaving] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [createdProjectName, setCreatedProjectName] = useState("");

  // Step 5: Work Order fields
  const [woTitle, setWoTitle] = useState("");
  const [woDesc, setWoDesc] = useState("");
  const [woStart, setWoStart] = useState("");
  const [woEnd, setWoEnd] = useState("");
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);

  // Step 6: Crew assignment
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([]);

  // Staff query for crew assignment step
  const { data: staffList = [] } = useQuery({
    queryKey: ["guided_staff", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, full_name, username, job_title, photo_url")
        .eq("company_id", company.id)
        .eq("is_active", true)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  // Guided flow step definitions
  const GUIDED_STEPS = [
    { label: "Project Info", icon: Briefcase, desc: "Name your project and link a client" },
    { label: "Site Location", icon: MapPin, desc: "Set the job site address & geofence" },
    { label: "Budget & Timeline", icon: DollarSign, desc: "Define contract value and dates" },
    { label: "First Work Order", icon: Wrench, desc: "Create the first job for this project" },
    { label: "Assign Crew", icon: Users, desc: "Pick team members to deploy on site" },
    { label: "Launch", icon: Rocket, desc: "Review and launch your project" },
  ];

  const guidedProgress = Math.round(((guidedStep) / (GUIDED_STEPS.length - 1)) * 100);

  const openGuidedFlow = () => {
    setGuidedStep(0);
    setGuidedSaving(false);
    setCreatedProjectId(null);
    setCreatedProjectName("");
    setCreatedJobId(null);
    setPName("");
    setPCustId(customers.length > 0 ? customers[0].id : "");
    setPRef("");
    setPDesc("");
    setPAddress("");
    setPLat("");
    setPLng("");
    setPRadius("150");
    setPBudget("0");
    setPContract("0");
    setPStatus("Planning");
    setPStart(format(new Date(), "yyyy-MM-dd"));
    setPEnd("");
    setWoTitle("");
    setWoDesc("");
    setWoStart("");
    setWoEnd("");
    setSelectedCrewIds([]);
    setGuidedOpen(true);
  };

  const canAdvanceStep = () => {
    switch (guidedStep) {
      case 0: return pName.trim().length > 0 && !!pCustId;
      case 1: return true; // location optional
      case 2: return true; // budget optional
      case 3: return woTitle.trim().length > 0;
      case 4: return true; // crew optional
      case 5: return true; // launch always valid
      default: return false;
    }
  };

  const handleGuidedNext = async () => {
    if (guidedStep === 2 && !createdProjectId) {
      // Save project on completing budget step
      setGuidedSaving(true);
      try {
        const payload = {
          company_id: company!.id,
          customer_id: pCustId,
          name: pName.trim(),
          ref_number: pRef.trim() || `PRJ-${Date.now().toString().slice(-6)}`,
          description: pDesc.trim() || null,
          address: pAddress.trim() || null,
          latitude: pLat ? parseFloat(pLat) : null,
          longitude: pLng ? parseFloat(pLng) : null,
          geofence_radius: parseFloat(pRadius) || 150.0,
          budget_labour_cost: parseFloat(pBudget) || 0.00,
          contract_value: parseFloat(pContract) || 0.00,
          status: pStatus,
          start_date: pStart || null,
          end_date: pEnd || null,
        };
        const { data, error } = await supabase.from("projects").insert(payload).select("id, name").single();
        if (error) throw error;
        setCreatedProjectId(data.id);
        setCreatedProjectName(data.name);
        queryClient.invalidateQueries({ queryKey: ["projects_list", company?.id] });
        toast({ title: "Project created!", description: `${data.name} has been saved.` });
      } catch (err: any) {
        toast({ title: "Error creating project", description: err.message, variant: "destructive" });
        setGuidedSaving(false);
        return;
      }
      setGuidedSaving(false);
    }

    if (guidedStep === 3 && !createdJobId && createdProjectId) {
      // Save work order on completing WO step
      setGuidedSaving(true);
      try {
        const payload = {
          project_id: createdProjectId,
          customer_id: pCustId,
          title: woTitle.trim(),
          status: "Scheduled",
          description: woDesc.trim() || null,
          scheduled_start: woStart || null,
          scheduled_end: woEnd || null,
        };
        const { data, error } = await supabase.from("jobs").insert(payload).select("id").single();
        if (error) throw error;
        setCreatedJobId(data.id);
        queryClient.invalidateQueries({ queryKey: ["jobs", company?.id] });
        toast({ title: "Work order created!", description: `"${woTitle}" has been scheduled.` });
      } catch (err: any) {
        toast({ title: "Error creating work order", description: err.message, variant: "destructive" });
        setGuidedSaving(false);
        return;
      }
      setGuidedSaving(false);
    }

    if (guidedStep === 4 && createdProjectId && selectedCrewIds.length > 0) {
      // Assign crew to project
      setGuidedSaving(true);
      try {
        const assignments = selectedCrewIds.map((staffId) => ({
          project_id: createdProjectId,
          staff_id: staffId,
          role: "Field Crew",
        }));
        const { error } = await supabase.from("project_assignments").insert(assignments);
        if (error) throw error;
        toast({ title: "Crew assigned!", description: `${selectedCrewIds.length} team member(s) deployed.` });
      } catch (err: any) {
        toast({ title: "Error assigning crew", description: err.message, variant: "destructive" });
      }
      setGuidedSaving(false);
    }

    if (guidedStep < GUIDED_STEPS.length - 1) {
      setGuidedStep(guidedStep + 1);
    }
  };

  const handleGuidedLaunch = () => {
    setGuidedOpen(false);
    if (createdProjectId) {
      navigate(`/projects/${createdProjectId}`);
    }
  };

  const toggleCrewSelection = (id: string) => {
    setSelectedCrewIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  // 1. Fetch Customers (for selection dropdown)
  const { data: customers = [] } = useQuery({
    queryKey: ["project_customers", company?.id],
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

  // 2. Fetch Projects list
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects_list", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          customer:customers(id, name)
        `)
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return (data || []).map((p: any) => ({
        ...p,
        customer: p.customer ? { id: p.customer.id, name: p.customer.name } : undefined,
      })) as Project[];
    },
    enabled: !!company?.id,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "true") {
      window.history.replaceState({}, document.title, window.location.pathname);
      openGuidedFlow();
    }
  }, [customers]);

  // 3. Project Mutations
  const saveProjectMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) throw new Error("No company linked");
      if (!pName.trim()) throw new Error("Project name is required");
      if (!pCustId) throw new Error("Customer link is required");

      const payload = {
        company_id: company.id,
        customer_id: pCustId,
        name: pName.trim(),
        ref_number: pRef.trim() || `PRJ-${Date.now().toString().slice(-6)}`,
        description: pDesc.trim() || null,
        address: pAddress.trim() || null,
        latitude: pLat ? parseFloat(pLat) : null,
        longitude: pLng ? parseFloat(pLng) : null,
        geofence_radius: parseFloat(pRadius) || 150.0,
        budget_labour_cost: parseFloat(pBudget) || 0.00,
        contract_value: parseFloat(pContract) || 0.00,
        status: pStatus,
        start_date: pStart || null,
        end_date: pEnd || null,
      };

      if (editingProject) {
        const { error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", editingProject.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("projects").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects_list", company?.id] });
      toast({
        title: editingProject ? `${t("Project")} updated` : `${t("Project")} created`,
        description: `Successfully saved ${t("project").toLowerCase()} ${pName}.`,
      });
      closeProjectDialog();
    },
    onError: (err: any) => {
      toast({
        title: `Error saving ${t("project").toLowerCase()}`,
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects_list", company?.id] });
      toast({
        title: `${t("Project")} deleted`,
        description: `The ${t("project").toLowerCase()} and all linked stages were removed.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: `Error deleting ${t("project").toLowerCase()}`,
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Helper for safe date parsing and formatting
  const formatDateSafely = (dateStr: string | null | undefined, formatStr: string) => {
    if (!dateStr) return "—";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        return format(date, formatStr);
      }
      return format(new Date(dateStr), formatStr);
    } catch {
      return "—";
    }
  };

  // Helpers
  const openProjectDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setPName(project.name);
      setPCustId(project.customer_id);
      setPRef(project.ref_number);
      setPDesc(project.description || "");
      setPAddress(project.address || "");
      setPLat(project.latitude !== null ? project.latitude.toString() : "");
      setPLng(project.longitude !== null ? project.longitude.toString() : "");
      setPRadius(project.geofence_radius.toString());
      setPBudget(project.budget_labour_cost.toString());
      setPContract(project.contract_value.toString());
      setPStatus(project.status);
      setPStart(project.start_date || "");
      setPEnd(project.end_date || "");
    } else {
      setEditingProject(null);
      setPName("");
      setPCustId(customers.length > 0 ? customers[0].id : "");
      setPRef("");
      setPDesc("");
      setPAddress("");
      setPLat("");
      setPLng("");
      setPRadius("150");
      setPBudget("0");
      setPContract("0");
      setPStatus("Planning");
      setPStart(format(new Date(), "yyyy-MM-dd"));
      setPEnd("");
    }
    setProjectDialogOpen(true);
  };

  const closeProjectDialog = () => {
    setProjectDialogOpen(false);
    setEditingProject(null);
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

  // Filter projects list
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ref_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.address || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (authLoading || projectsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${t("Project")} Workspaces Tracker`}
        description={`Track commercial construct ${t("projects").toLowerCase()}, locations geofence perimeters, and active milestone metrics.`}
        path="/projects"
        noIndex
      />
      <DashboardLayout
        activeTab="projects"
        companyName={company?.name || ""}
        companyPrefix={company?.prefix || ""}
        companyId={company?.id || ""}
      >
        <div className="p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                {t("Project")} Tracker
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Establish client contract limits, geofence radius sites, and launch isolated workspaces for your {t("projects").toLowerCase()}.
              </p>
            </div>
            <Button onClick={openGuidedFlow} className="gap-2 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
              <Sparkles className="h-4 w-4" /> New {t("Project")}
            </Button>
          </div>

          {/* Quick Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50 card-shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Total {t("Projects")}</p>
                  <p className="text-2xl font-bold text-foreground">{projects.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Briefcase className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 card-shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Active Work</p>
                  <p className="text-2xl font-bold text-foreground">
                    {projects.filter((p) => p.status === "Active").length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 text-green-600">
                  <Play className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 card-shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${projects
                      .reduce((sum, p) => sum + (Number(p.contract_value) || 0), 0)
                      .toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <DollarSign className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 card-shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Labor Budget</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${projects
                      .reduce((sum, p) => sum + (Number(p.budget_labour_cost) || 0), 0)
                      .toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Full-width Projects Table */}
            <Card className="border-border/50 card-shadow-md">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold">Active Projects Registry</CardTitle>
                    <CardDescription>
                      Click on a project to open its dedicated workspaces.
                    </CardDescription>
                  </div>
                  <FilterChipBar
                    hasActiveFilters={statusFilter !== "ALL"}
                    onClearAll={() => setStatusFilter("ALL")}
                  >
                    <FilterChip
                      label="All Statuses"
                      selectedValue={statusFilter}
                      options={[
                        { label: "Planning", value: "Planning" },
                        { label: "Active", value: "Active" },
                        { label: "Completed", value: "Completed" },
                      ]}
                      onSelect={setStatusFilter}
                      onClear={() => setStatusFilter("ALL")}
                    />
                  </FilterChipBar>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by project name, client, ref #..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <PaginatedTableFull data={filteredProjects} renderTable={(paginatedItems) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ref #</TableHead>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Timeline</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-16 hover:bg-transparent">
                            <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
                              <Briefcase className="h-10 w-10 text-muted-foreground/30" />
                              <h4 className="font-bold text-sm">No Projects Registered</h4>
                              <p className="text-xs text-muted-foreground">
                                Projects act as isolated workspaces to link crew assignments, geofence site logs, shift schedules, and safety inspections.
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={openGuidedFlow}
                                className="mt-3 text-xs gap-1.5"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                Create Your First Project
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedItems.map((proj) => (
                          <TableRow
                            key={proj.id}
                            className="cursor-pointer transition-colors hover:bg-muted/30"
                            onClick={() => navigate(`/projects/${proj.id}`)}
                          >
                            <TableCell className="font-mono text-xs">{proj.ref_number}</TableCell>
                            <TableCell className="font-semibold text-foreground">{proj.name}</TableCell>
                            <TableCell className="text-muted-foreground">{proj.customer?.name || "—"}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {formatDateSafely(proj.start_date, "MMM d")}
                              {" → "}
                              {formatDateSafely(proj.end_date, "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>{getStatusBadge(proj.status)}</TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openProjectDialog(proj)}
                                  title="Edit project"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm(`Delete project "${proj.name}" and all its phases?`)) {
                                      deleteProjectMutation.mutate(proj.id);
                                    }
                                  }}
                                  className="text-destructive hover:bg-destructive/10"
                                  title="Delete project"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Project Dialog */}
        <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                {editingProject ? `Modify ${t("Project")} Workspace` : `Launch New ${t("Project")}`}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">{t("Project")} Name *</label>
                  <Input
                    placeholder="e.g. Oak Street Commercial"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Customer / Client *</label>
                  <Select value={pCustId} onValueChange={setPCustId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Ref Number</label>
                  <Input
                    placeholder="e.g. PRJ-101"
                    value={pRef}
                    onChange={(e) => setPRef(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Contract Value ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={pContract}
                    onChange={(e) => setPContract(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Labor Budget ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={pBudget}
                    onChange={(e) => setPBudget(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Project Site Address</label>
                <Input
                  placeholder="e.g. 100 Oak St, San Francisco, CA"
                  value={pAddress}
                  onChange={(e) => setPAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-1.5 space-y-1">
                  <label className="text-xs font-semibold">Latitude</label>
                  <Input
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 37.7749"
                    value={pLat}
                    onChange={(e) => setPLat(e.target.value)}
                  />
                </div>
                <div className="col-span-1.5 space-y-1">
                  <label className="text-xs font-semibold">Longitude</label>
                  <Input
                    type="number"
                    step="0.000001"
                    placeholder="e.g. -122.4194"
                    value={pLng}
                    onChange={(e) => setPLng(e.target.value)}
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-xs font-semibold">Geofence (m)</label>
                  <Input
                    type="number"
                    placeholder="150"
                    value={pRadius}
                    onChange={(e) => setPRadius(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Start Date</label>
                  <Input
                    type="date"
                    value={pStart}
                    onChange={(e) => setPStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">End Date</label>
                  <Input
                    type="date"
                    value={pEnd}
                    onChange={(e) => setPEnd(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Status</label>
                  <Select value={pStatus} onValueChange={setPStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Description Notes</label>
                <Textarea
                  placeholder="Summarize project requirements, scope of work, etc."
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeProjectDialog}>
                Cancel
              </Button>
              <Button onClick={() => saveProjectMutation.mutate()} disabled={saveProjectMutation.isPending}>
                {saveProjectMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Guided Project Creation Flow ─── */}
        <Dialog open={guidedOpen} onOpenChange={setGuidedOpen}>
          <DialogContent className="max-w-full w-screen h-[100dvh] max-h-[100dvh] rounded-none border-none p-0 bg-background flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-300">
            {/* Stepper Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border/40 pt-6 pb-5">
              <div className="max-w-3xl mx-auto w-full px-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15">
                      <Sparkles className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold tracking-tight">New Project Setup Flow</h3>
                      <p className="text-xs text-muted-foreground">Step {guidedStep + 1} of {GUIDED_STEPS.length} — {GUIDED_STEPS[guidedStep].desc}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setGuidedOpen(false)} className="rounded-full">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <Progress value={guidedProgress} className="h-1.5 bg-muted/40 mb-4" />
                {/* Step indicators */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {GUIDED_STEPS.map((s, i) => {
                    const StepIcon = s.icon;
                    const isActive = i === guidedStep;
                    const isDone = i < guidedStep;
                    return (
                      <button
                        key={i}
                        onClick={() => { if (isDone) setGuidedStep(i); }}
                        disabled={!isDone}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                            : isDone
                            ? "text-green-600 bg-green-500/10 cursor-pointer hover:bg-green-500/15"
                            : "text-muted-foreground/40 bg-muted/20"
                        }`}
                      >
                        {isDone ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <StepIcon className="h-3.5 w-3.5" />
                        )}
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="max-w-3xl mx-auto w-full flex-1 px-6 py-8 overflow-y-auto space-y-6 min-h-[350px]">
              {/* Step 0: Project Info */}
              {guidedStep === 0 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("Project")} Name *</label>
                    <Input
                      placeholder="e.g. Oak Street Commercial Build"
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      className="text-lg py-6 font-semibold"
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer / Client *</label>
                      <Select value={pCustId} onValueChange={setPCustId}>
                        <SelectTrigger className="py-6"><SelectValue placeholder="Select client" /></SelectTrigger>
                        <SelectContent>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ref Number</label>
                      <Input
                        placeholder="Auto-generated if blank"
                        value={pRef}
                        onChange={(e) => setPRef(e.target.value)}
                        className="py-6 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description Notes</label>
                    <Textarea
                      placeholder="Summarize project scope, deliverables, and key milestones..."
                      value={pDesc}
                      onChange={(e) => setPDesc(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Site Location */}
              {guidedStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
                      The address is used for GPS navigation. Lat/Lng sets the geofence check-in boundary.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Job Site Address</label>
                    <Input
                      placeholder="e.g. 100 Oak St, San Francisco, CA 94102"
                      value={pAddress}
                      onChange={(e) => setPAddress(e.target.value)}
                      className="py-6"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Latitude</label>
                      <Input type="number" step="0.000001" placeholder="37.7749" value={pLat} onChange={(e) => setPLat(e.target.value)} className="py-6" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Longitude</label>
                      <Input type="number" step="0.000001" placeholder="-122.4194" value={pLng} onChange={(e) => setPLng(e.target.value)} className="py-6" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Geofence Radius (meters)</label>
                      <Input type="number" placeholder="150" value={pRadius} onChange={(e) => setPRadius(e.target.value)} className="py-6" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Budget & Timeline */}
              {guidedStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contract Value ($)</label>
                      <Input type="number" placeholder="0.00" value={pContract} onChange={(e) => setPContract(e.target.value)} className="py-6" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Labor Budget ($)</label>
                      <Input type="number" placeholder="0.00" value={pBudget} onChange={(e) => setPBudget(e.target.value)} className="py-6" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Start Date</label>
                      <Input type="date" value={pStart} onChange={(e) => setPStart(e.target.value)} className="py-6" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">End Date</label>
                      <Input type="date" value={pEnd} onChange={(e) => setPEnd(e.target.value)} className="py-6" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Initial Status</label>
                    <Select value={pStatus} onValueChange={setPStatus}>
                      <SelectTrigger className="py-6"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planning">Planning</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {createdProjectId && (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                      <div className="p-1 rounded-full bg-green-500 text-white">
                        <Check className="h-4 w-4" />
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-400 font-semibold">Project "{createdProjectName}" saved successfully!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: First Work Order */}
              {guidedStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-2">
                      <Wrench className="h-4 w-4 shrink-0 text-amber-500" />
                      Create the first work order to deploy your crew. You can issue more work orders inside this project workspace later.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Work Order Title *</label>
                    <Input
                      placeholder="e.g. Initial Inspection & Foundation Survey"
                      value={woTitle}
                      onChange={(e) => setWoTitle(e.target.value)}
                      className="py-6 text-base font-semibold"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description of Tasks</label>
                    <Textarea
                      placeholder="Detail instructions for the field workers..."
                      value={woDesc}
                      onChange={(e) => setWoDesc(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scheduled Start</label>
                      <Input type="datetime-local" value={woStart} onChange={(e) => setWoStart(e.target.value)} className="py-6" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scheduled End</label>
                      <Input type="datetime-local" value={woEnd} onChange={(e) => setWoEnd(e.target.value)} className="py-6" />
                    </div>
                  </div>
                  {createdJobId && (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                      <div className="p-1 rounded-full bg-green-500 text-white">
                        <Check className="h-4 w-4" />
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-400 font-semibold">First job scheduled successfully!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Assign Crew */}
              {guidedStep === 4 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <p className="text-xs text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0 text-indigo-500" />
                      Assign crew members to the workspace. This adds them to the project directory and dispatches the task.
                    </p>
                  </div>
                  {staffList.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-xl p-6">
                      <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <h4 className="font-bold text-sm">No Active Crew Members</h4>
                      <p className="text-xs text-muted-foreground mt-1">Please add staff members in your main directory tab first.</p>
                    </div>
                  ) : (
                    <div className="grid gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                      {staffList.map((s: any) => {
                        const selected = selectedCrewIds.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggleCrewSelection(s.id)}
                            className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all w-full ${
                              selected
                                ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                                : "border-border hover:border-border-hover hover:bg-muted/40"
                            }`}
                          >
                            {s.photo_url ? (
                              <img src={s.photo_url} alt="" className="h-10 w-10 rounded-full object-cover border border-border/40 shrink-0" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                                {(s.full_name || "?").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{s.full_name}</p>
                              <p className="text-xs text-muted-foreground">{s.job_title || `@${s.username}`}</p>
                            </div>
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30"
                            }`}>
                              {selected && <Check className="h-3 w-3" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Launch Summary */}
              {guidedStep === 5 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="text-center py-4">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/15 to-emerald-500/15 flex items-center justify-center mb-4 shadow-sm">
                      <Rocket className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-tight">Project Ready to Deploy!</h3>
                    <p className="text-sm text-muted-foreground mt-1">Verify details below before opening the workspace.</p>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex gap-4 p-4 rounded-xl border border-border/60 bg-muted/10">
                      <Briefcase className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workspace Project</p>
                        <p className="text-base font-bold text-foreground mt-0.5">{createdProjectName || pName}</p>
                        {pAddress && <p className="text-xs text-muted-foreground mt-1">{pAddress}</p>}
                      </div>
                    </div>

                    {(pContract !== "0" || pBudget !== "0") && (
                      <div className="flex gap-4 p-4 rounded-xl border border-border/60 bg-muted/10">
                        <DollarSign className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Financial Allocations</p>
                          <p className="text-sm font-semibold mt-0.5">
                            Contract Value: <span className="font-mono">${Number(pContract).toLocaleString()}</span>
                          </p>
                          <p className="text-sm font-semibold text-muted-foreground">
                            Labor Cost Cap: <span className="font-mono">${Number(pBudget).toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {woTitle && (
                      <div className="flex gap-4 p-4 rounded-xl border border-border/60 bg-muted/10">
                        <Wrench className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Dispatched Job</p>
                          <p className="text-sm font-semibold mt-0.5">{woTitle}</p>
                        </div>
                      </div>
                    )}

                    {selectedCrewIds.length > 0 && (
                      <div className="flex gap-4 p-4 rounded-xl border border-border/60 bg-muted/10">
                        <Users className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deployed Staff Members</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {selectedCrewIds.map((id) => {
                              const s = staffList.find((x: any) => x.id === id);
                              return s ? (
                                <Badge key={id} variant="secondary" className="px-2 py-1 text-xs">
                                  {s.full_name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="sticky bottom-0 bg-card border-t border-border/40 py-5">
              <div className="max-w-3xl mx-auto w-full px-6 flex items-center justify-between gap-3">
                {guidedStep > 0 ? (
                  <Button
                    variant="ghost"
                    onClick={() => setGuidedStep(guidedStep - 1)}
                    className="gap-2 px-5 py-6 font-semibold"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => setGuidedOpen(false)} className="px-5 py-6 font-semibold">
                    Cancel
                  </Button>
                )}

                {guidedStep < GUIDED_STEPS.length - 1 ? (
                  <Button
                    onClick={handleGuidedNext}
                    disabled={!canAdvanceStep() || guidedSaving}
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-6 font-bold shadow-md shadow-primary/10"
                  >
                    {guidedSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {guidedStep === 2 && !createdProjectId ? "Create & Save" : "Continue"}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleGuidedLaunch}
                    className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-6 py-6 font-bold text-white shadow-md shadow-green-500/10"
                  >
                    <Rocket className="h-4 w-4" />
                    Open Project Workspace
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}
