import { useState } from "react";
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
            <Button onClick={() => openProjectDialog()} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Add {t("Project")}
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
                                onClick={() => openProjectDialog()}
                                className="mt-3 text-xs gap-1.5"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add Project
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
      </DashboardLayout>
    </>
  );
}
