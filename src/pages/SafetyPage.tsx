import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { PaginatedTableFull } from "@/components/PaginatedTable";
import FilterChipBar, { FilterChip } from "@/components/FilterChipBar";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ShieldAlert,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Activity,
  User,
  Users,
  Search,
  BookOpen,
  Info,
  ClipboardCheck,
} from "lucide-react";
import { format } from "date-fns";

interface Project {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  full_name: string;
}

interface IncidentReport {
  id: string;
  project_id: string;
  reporter_id: string;
  type: string;
  severity: string;
  description: string;
  status: string;
  created_at: string;
  project?: Project;
  reporter?: Staff;
}

interface ToolboxTalk {
  id: string;
  project_id: string;
  topic: string;
  date: string;
  presenter_id: string;
  created_at: string;
  project?: Project;
  presenter?: Staff;
}

interface Attendee {
  id: string;
  talk_id: string;
  staff_id: string;
  signed_at: string;
  staff?: Staff;
}

export default function SafetyPage({ projectId }: { projectId?: string }) {
  const { user, company, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedTalkId, setSelectedTalkId] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Dialog States
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [talkDialogOpen, setTalkDialogOpen] = useState(false);
  const [attendeeDialogOpen, setAttendeeDialogOpen] = useState(false);

  // Incident Form States
  const [incProject, setIncProject] = useState("");
  const [incReporter, setIncReporter] = useState("");
  const [incType, setIncType] = useState("Injury");
  const [incSeverity, setIncSeverity] = useState("Low");
  const [incDesc, setIncDesc] = useState("");
  
  // Checklist Validations
  const [chkSupervisor, setChkSupervisor] = useState(false);
  const [chkEmergency, setChkEmergency] = useState(false);
  const [chkPhotos, setChkPhotos] = useState(false);
  const [chkHazardsSecured, setChkHazardsSecured] = useState(false);

  // Talk Form States
  const [talkProject, setTalkProject] = useState("");
  const [talkTopic, setTalkTopic] = useState("");
  const [talkPresenter, setTalkPresenter] = useState("");
  const [talkDate, setTalkDate] = useState("");

  // Attendee Form States
  const [attStaffId, setAttStaffId] = useState("");

  // 1. Fetch Projects
  const { data: projects = [] } = useQuery({
    queryKey: ["safety_projects", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("company_id", company.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!company?.id,
  });

  // 2. Fetch Staff
  const { data: staff = [] } = useQuery({
    queryKey: ["safety_staff", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, full_name")
        .eq("company_id", company.id)
        .eq("is_active", true)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data as Staff[];
    },
    enabled: !!company?.id,
  });

  // 3. Fetch Incident Reports
  const { data: incidents = [], isLoading: incsLoading } = useQuery({
    queryKey: ["incident_reports", company?.id, projectId],
    queryFn: async () => {
      if (!company?.id) return [];
      let query = supabase
        .from("incident_reports")
        .select(`
          *,
          project:projects(id, name),
          reporter:staff_profiles(id, full_name)
        `);
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((i: any) => ({
        ...i,
        project: i.project ? { id: i.project.id, name: i.project.name } : undefined,
        reporter: i.reporter ? { id: i.reporter.id, full_name: i.reporter.full_name } : undefined,
      })) as IncidentReport[];
    },
    enabled: !!company?.id,
  });

  // 4. Fetch Toolbox Talks
  const { data: talks = [], isLoading: talksLoading } = useQuery({
    queryKey: ["toolbox_talks", company?.id, projectId],
    queryFn: async () => {
      if (!company?.id) return [];
      let query = supabase
        .from("toolbox_talks")
        .select(`
          *,
          project:projects(id, name),
          presenter:staff_profiles(id, full_name)
        `);
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      const { data, error } = await query.order("date", { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        project: t.project ? { id: t.project.id, name: t.project.name } : undefined,
        presenter: t.presenter ? { id: t.presenter.id, full_name: t.presenter.full_name } : undefined,
      })) as ToolboxTalk[];
    },
    enabled: !!company?.id,
  });

  // 5. Fetch Attendees for selected toolbox talk
  const { data: attendees = [], isLoading: attsLoading } = useQuery({
    queryKey: ["toolbox_attendees", selectedTalkId],
    queryFn: async () => {
      if (!selectedTalkId) return [];
      const { data, error } = await supabase
        .from("toolbox_talk_attendees")
        .select(`
          *,
          staff:staff_profiles(id, full_name)
        `)
        .eq("talk_id", selectedTalkId);
      if (error) throw error;
      return (data || []).map((a: any) => ({
        ...a,
        staff: a.staff ? { id: a.staff.id, full_name: a.staff.full_name } : undefined,
      })) as Attendee[];
    },
    enabled: !!selectedTalkId,
  });

  // Incident Mutations
  const createIncidentMutation = useMutation({
    mutationFn: async () => {
      if (!incProject) throw new Error("Project selection is required");
      if (!incReporter) throw new Error("Reporter selection is required");
      if (!incDesc.trim()) throw new Error("Incident description is required");

      // Validate checklist
      if (!chkSupervisor) throw new Error("Supervisor must be notified before filing report.");
      if (incSeverity === "Critical" && !chkEmergency) {
        throw new Error("Emergency services check must be acknowledged for Critical incidents.");
      }

      const payload = {
        project_id: incProject,
        reporter_id: incReporter,
        type: incType,
        severity: incSeverity,
        description: incDesc.trim(),
        status: "Open",
      };

      const { error } = await supabase.from("incident_reports").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident_reports", company?.id] });
      toast({
        title: "Report filed",
        description: "Field safety incident successfully logged.",
      });
      closeIncidentDialog();
    },
    onError: (err: any) => {
      toast({
        title: "Validation / RLS Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateIncidentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("incident_reports")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident_reports", company?.id] });
      toast({ title: "Status updated", description: "Incident status has been shifted." });
    },
    onError: (err: any) => {
      toast({
        title: "Error updating status",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteIncidentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("incident_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident_reports", company?.id] });
      toast({ title: "Incident removed", description: "Report deleted successfully." });
    },
    onError: (err: any) => {
      toast({
        title: "Error deleting incident",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Toolbox Talk Mutations
  const createTalkMutation = useMutation({
    mutationFn: async () => {
      if (!talkProject) throw new Error("Project selection is required");
      if (!talkPresenter) throw new Error("Presenter selection is required");
      if (!talkTopic.trim()) throw new Error("Briefing topic is required");

      const payload = {
        project_id: talkProject,
        topic: talkTopic.trim(),
        presenter_id: talkPresenter,
        date: talkDate || format(new Date(), "yyyy-MM-dd"),
      };

      const { error } = await supabase.from("toolbox_talks").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["toolbox_talks", company?.id] });
      toast({
        title: "Safety briefing logged",
        description: "Toolbox briefing has been registered.",
      });
      setTalkDialogOpen(false);
    },
    onError: (err: any) => {
      toast({
        title: "Error logging briefing",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const addAttendeeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTalkId) throw new Error("No briefing selected");
      if (!attStaffId) throw new Error("Staff check-in selection is required");

      const payload = {
        talk_id: selectedTalkId,
        staff_id: attStaffId,
      };

      const { error } = await supabase.from("toolbox_talk_attendees").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["toolbox_attendees", selectedTalkId] });
      toast({
        title: "Attendee logged",
        description: "Crew member checked in to briefing.",
      });
      setAttendeeDialogOpen(false);
    },
    onError: (err: any) => {
      toast({
        title: "Error checking in crew",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const removeAttendeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("toolbox_talk_attendees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["toolbox_attendees", selectedTalkId] });
      toast({ title: "Attendee removed", description: "Crew check-in removed." });
    },
    onError: (err: any) => {
      toast({
        title: "Error removing attendee",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Helpers
  const openIncidentDialog = () => {
    setIncProject(projectId || (projects.length > 0 ? projects[0].id : ""));
    setIncReporter(staff.length > 0 ? staff[0].id : "");
    setIncType("Injury");
    setIncSeverity("Low");
    setIncDesc("");
    setChkSupervisor(false);
    setChkEmergency(false);
    setChkPhotos(false);
    setChkHazardsSecured(false);
    setIncidentDialogOpen(true);
  };

  const closeIncidentDialog = () => {
    setIncidentDialogOpen(false);
  };

  const openTalkDialog = () => {
    setTalkProject(projectId || (projects.length > 0 ? projects[0].id : ""));
    setTalkPresenter(staff.length > 0 ? staff[0].id : "");
    setTalkTopic("");
    setTalkDate(format(new Date(), "yyyy-MM-dd"));
    setTalkDialogOpen(true);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "Critical":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Critical</Badge>;
      case "High":
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">High</Badge>;
      case "Medium":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Medium</Badge>;
      case "Low":
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getIncidentStatusBadge = (stat: string) => {
    switch (stat) {
      case "Resolved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">Resolved</Badge>;
      case "Investigating":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Investigating</Badge>;
      case "Open":
      default:
        return <Badge variant="outline" className="text-red-500 border-red-200">Open</Badge>;
    }
  };

  const selectedTalk = talks.find((t) => t.id === selectedTalkId);

  // Filter incident reports
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.reporter?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.project?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === "ALL" || inc.severity === severityFilter;
    const matchesStatus = statusFilter === "ALL" || inc.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  if (incsLoading || talksLoading) {
    return (
      <DashboardLayout activeTab="safety" companyName={company?.name || ""} companyPrefix={company?.prefix || ""} companyId={company?.id || ""}>
        <div className="flex justify-center items-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const pageContent = (
    <>
      <div className="p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Safety & Incident Hub
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Acknowledge site briefings, complete safety checklists, and report field incidents with immediate notifications.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={openTalkDialog} className="gap-2 shrink-0">
                <Users className="h-4 w-4 text-primary" /> Log Toolbox Talk
              </Button>
              <Button onClick={openIncidentDialog} className="gap-2 shrink-0 bg-red-600 hover:bg-red-700 text-white">
                <ShieldAlert className="h-4 w-4" /> File Incident Report
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left/Middle Column: Incident Board */}
            <Card className="lg:col-span-2 border-border/50 card-shadow-md">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-500 animate-pulse" />
                    Site Incident Board
                  </CardTitle>
                  <FilterChipBar
                    hasActiveFilters={severityFilter !== "ALL" || statusFilter !== "ALL"}
                    onClearAll={() => {
                      setSeverityFilter("ALL");
                      setStatusFilter("ALL");
                    }}
                  >
                    <FilterChip
                      label="All Severities"
                      selectedValue={severityFilter}
                      options={[
                        { label: "Low", value: "Low" },
                        { label: "Medium", value: "Medium" },
                        { label: "High", value: "High" },
                        { label: "Critical", value: "Critical" },
                      ]}
                      onSelect={setSeverityFilter}
                      onClear={() => setSeverityFilter("ALL")}
                    />
                    <FilterChip
                      label="All Statuses"
                      selectedValue={statusFilter}
                      options={[
                        { label: "Open", value: "Open" },
                        { label: "Investigating", value: "Investigating" },
                        { label: "Resolved", value: "Resolved" },
                      ]}
                      onSelect={setStatusFilter}
                      onClear={() => setStatusFilter("ALL")}
                    />
                  </FilterChipBar>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search incidents by type, description, project, reporter..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <PaginatedTableFull
                  data={filteredIncidents}
                  renderTable={(paginatedIncidents) => (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Reporter</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedIncidents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                              No incident reports registered.
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedIncidents.map((inc) => (
                            <TableRow key={inc.id} className="hover:bg-muted/30">
                              <TableCell className="font-semibold text-foreground">{inc.type}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{inc.project?.name}</TableCell>
                              <TableCell>{getSeverityBadge(inc.severity)}</TableCell>
                              <TableCell className="text-xs font-semibold text-foreground">{inc.reporter?.full_name}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={inc.description}>
                                {inc.description}
                              </TableCell>
                              <TableCell>{getIncidentStatusBadge(inc.status)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {inc.status !== "Resolved" && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => updateIncidentStatusMutation.mutate({
                                        id: inc.id,
                                        status: inc.status === "Open" ? "Investigating" : "Resolved"
                                      })}
                                      className="h-8 w-8 text-green-600"
                                      title={inc.status === "Open" ? "Investigate" : "Mark Resolved"}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (confirm("Delete this incident report?")) {
                                        deleteIncidentMutation.mutate(inc.id);
                                      }
                                    }}
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
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
                  )}
                />
              </CardContent>
            </Card>

            {/* Right Column: Toolbox talks & Attendees */}
            <div className="space-y-6">
              {/* Briefings List */}
              <Card className="border-border/50 card-shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Safety Toolbox Briefs ({talks.length})
                  </CardTitle>
                  <CardDescription>Log files of safety guidelines acknowledged on sites.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
                  {talks.length === 0 ? (
                    <p className="text-center text-muted-foreground text-xs py-6">No briefing logs registered.</p>
                  ) : (
                    talks.map((talk) => (
                      <div
                        key={talk.id}
                        onClick={() => setSelectedTalkId(talk.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTalkId === talk.id ? "bg-muted/70 border-primary" : "bg-muted/10 border-border/40 hover:bg-muted/20"
                        }`}
                      >
                        <div className="font-bold text-sm text-foreground">{talk.topic}</div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 font-medium">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(talk.date + "T00:00:00"), "MMM dd, yyyy")}</span>
                          <span>By: {talk.presenter?.full_name}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Selected Briefing Attendee List */}
              {!selectedTalkId ? (
                <Card className="border-border/50 card-shadow-md">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                    <BookOpen className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-xs">Select a Toolbox Talk above to check-in attending crew members and verify sign-offs.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50 card-shadow-md">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base font-bold">Briefing Check-ins</CardTitle>
                      <CardDescription className="text-xs font-semibold text-primary">{selectedTalk?.topic}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setAttendeeDialogOpen(true)} className="gap-1 text-xs h-8">
                      <Plus className="h-3.5 w-3.5" /> Check-in
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {attsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : attendees.length === 0 ? (
                      <div className="text-center py-6 border border-dashed rounded-lg bg-muted/20">
                        <p className="text-xs text-muted-foreground">No crew members checked in to this talk.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {attendees.map((att) => (
                          <div key={att.id} className="p-2 border border-border/30 rounded bg-muted/15 flex items-center justify-between group">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-primary" />
                              {att.staff?.full_name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {format(new Date(att.signed_at), "h:mm a")}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Remove this attendee?")) {
                                    removeAttendeeMutation.mutate(att.id);
                                  }
                                }}
                                className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* File Incident Report Dialog */}
        <Dialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-600 animate-pulse" />
                Report Field Safety Incident
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className={projectId ? "space-y-4" : "grid grid-cols-2 gap-4"}>
                {!projectId && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Location / Project *</label>
                    <Select value={incProject} onValueChange={setIncProject}>
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
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Reporter / Field Crew *</label>
                  <Select value={incReporter} onValueChange={setIncReporter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reporter" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Incident Type</label>
                  <Select value={incType} onValueChange={setIncType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Injury">Injury / First Aid</SelectItem>
                      <SelectItem value="Near Miss">Near Miss</SelectItem>
                      <SelectItem value="Property Damage">Property Damage</SelectItem>
                      <SelectItem value="Environmental">Environmental Spill</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Severity level</label>
                  <Select value={incSeverity} onValueChange={setIncSeverity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Describe the Incident *</label>
                <Textarea
                  placeholder="Outline exactly what happened, hazards identified, and any immediate actions taken..."
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Safety Checklist validations */}
              <div className="border rounded-lg p-3 space-y-3 bg-muted/10">
                <div className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                  <ClipboardCheck className="h-4 w-4" /> Checklist Validation Required
                </div>
                
                <div className="flex items-start gap-2.5">
                  <Checkbox id="chkSupervisor" checked={chkSupervisor} onCheckedChange={(val) => setChkSupervisor(!!val)} />
                  <label htmlFor="chkSupervisor" className="text-xs text-muted-foreground leading-none cursor-pointer">
                    Site supervisor notified immediately
                  </label>
                </div>
                {incSeverity === "Critical" && (
                  <div className="flex items-start gap-2.5">
                    <Checkbox id="chkEmergency" checked={chkEmergency} onCheckedChange={(val) => setChkEmergency(!!val)} />
                    <label htmlFor="chkEmergency" className="text-xs text-muted-foreground leading-none cursor-pointer">
                      Emergency response services dispatched (911 / Medical)
                    </label>
                  </div>
                )}
                <div className="flex items-start gap-2.5">
                  <Checkbox id="chkPhotos" checked={chkPhotos} onCheckedChange={(val) => setChkPhotos(!!val)} />
                  <label htmlFor="chkPhotos" className="text-xs text-muted-foreground leading-none cursor-pointer">
                    Photo evidence captured for documentation (Optional)
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeIncidentDialog}>
                Cancel
              </Button>
              <Button onClick={() => createIncidentMutation.mutate()} disabled={createIncidentMutation.isPending}>
                {createIncidentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Log Safety Talk Dialog */}
        <Dialog open={talkDialogOpen} onOpenChange={setTalkDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Log Safety Toolbox Talk
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Toolbox Talk Topic *</label>
                <Input
                  placeholder="e.g. Electrical Safety, Scaffold Hazards"
                  value={talkTopic}
                  onChange={(e) => setTalkTopic(e.target.value)}
                />
              </div>

              {!projectId && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Location / Project Site *</label>
                  <Select value={talkProject} onValueChange={setTalkProject}>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Presenter / Lead *</label>
                  <Select value={talkPresenter} onValueChange={setTalkPresenter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select presenter" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Date</label>
                  <Input
                    type="date"
                    value={talkDate}
                    onChange={(e) => setTalkDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTalkDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => createTalkMutation.mutate()} disabled={createTalkMutation.isPending}>
                {createTalkMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Briefing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Check-in Attendee Dialog */}
        <Dialog open={attendeeDialogOpen} onOpenChange={setAttendeeDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Check-in Crew Member
              </DialogTitle>
              <CardDescription className="text-xs font-semibold text-primary">Briefing: {selectedTalk?.topic}</CardDescription>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Crew Member / Staff Profile *</label>
                <Select value={attStaffId} onValueChange={setAttStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select crew member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAttendeeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => addAttendeeMutation.mutate()} disabled={addAttendeeMutation.isPending}>
                {addAttendeeMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Check-in Attendee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </>
  );

  if (projectId) {
    return pageContent;
  }

  return (
    <>
      <SEO
        title="Safety Hub"
        description="Report field safety incidents, checklist validations, and log safety briefings."
        path="/safety"
        noIndex
      />
      <DashboardLayout
        activeTab="safety"
        companyName={company?.name || ""}
        companyPrefix={company?.prefix || ""}
        companyId={company?.id || ""}
      >
        {pageContent}
      </DashboardLayout>
    </>
  );
}
