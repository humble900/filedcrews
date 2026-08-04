import { useState, useEffect, useRef, useCallback, type RefObject } from "react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
  X,
} from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  name: string;
}

interface PhoneCountry {
  code: string;
  name: string;
  iso2: string;
}

const DEFAULT_PHONE_COUNTRY: PhoneCountry = { code: "+1", name: "United States", iso2: "US" };

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
  const [guidedError, setGuidedError] = useState("");

  // In-context setup cards keep the project draft intact while a dependency is created.
  const [quickClientOpen, setQuickClientOpen] = useState(false);
  const [quickClientSaving, setQuickClientSaving] = useState(false);
  const [quickClientName, setQuickClientName] = useState("");
  const [quickClientEmail, setQuickClientEmail] = useState("");
  const [quickClientPhone, setQuickClientPhone] = useState("");
  const [quickClientCountry, setQuickClientCountry] = useState(DEFAULT_PHONE_COUNTRY.iso2);
  const [phoneCountryOpen, setPhoneCountryOpen] = useState(false);
  const [phoneCountries, setPhoneCountries] = useState<PhoneCountry[]>([DEFAULT_PHONE_COUNTRY]);
  const [phoneCountriesLoading, setPhoneCountriesLoading] = useState(false);
  const [phoneCountriesRequested, setPhoneCountriesRequested] = useState(false);
  const [quickClientAddress, setQuickClientAddress] = useState("");
  const [quickCrewOpen, setQuickCrewOpen] = useState(false);
  const [quickCrewSaving, setQuickCrewSaving] = useState(false);
  const [quickCrewName, setQuickCrewName] = useState("");
  const [quickCrewUsername, setQuickCrewUsername] = useState("");
  const [quickCrewPassword, setQuickCrewPassword] = useState("");
  const [quickCrewJobTitle, setQuickCrewJobTitle] = useState("");
  const [mapsApiKey, setMapsApiKey] = useState("");
  const projectAddressInputRef = useRef<HTMLInputElement>(null);
  const quickClientAddressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    supabase.functions.invoke("get-maps-key")
      .then(({ data }) => {
        if (active && data?.key) setMapsApiKey(data.key);
      })
      .catch(() => {
        // Manual entry remains available if the maps integration is unavailable.
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!quickClientOpen || phoneCountries.length > 1 || phoneCountriesLoading || phoneCountriesRequested) return;

    let active = true;
    setPhoneCountriesLoading(true);
    setPhoneCountriesRequested(true);
    fetch("https://restcountries.com/v3.1/all?fields=name,idd,cca2")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load countries");
        return response.json();
      })
      .then((countries: Array<{ name?: { common?: string }; idd?: { root?: string; suffixes?: string[] }; cca2?: string }>) => {
        if (!active) return;
        const mapped = countries
          .map((country) => {
            const iso2 = country.cca2;
            const root = country.idd?.root;
            const suffix = country.idd?.suffixes?.[0] || "";
            if (!iso2 || !root || !country.name?.common) return null;
            const code = ["US", "CA", "RU", "KZ"].includes(iso2) ? root : `${root}${suffix}`;
            return { iso2, code, name: country.name.common };
          })
          .filter((country): country is PhoneCountry => country !== null)
          .sort((a, b) => a.name.localeCompare(b.name));
        if (mapped.length > 0) setPhoneCountries(mapped);
      })
      .catch(() => {
        // The United States fallback remains usable if the country directory is unavailable.
      })
      .finally(() => { if (active) setPhoneCountriesLoading(false); });

    return () => { active = false; };
  }, [quickClientOpen, phoneCountries.length, phoneCountriesLoading, phoneCountriesRequested]);

  const selectedPhoneCountry = phoneCountries.find((country) => country.iso2 === quickClientCountry) || DEFAULT_PHONE_COUNTRY;

  const handleProjectAddressSelect = useCallback((address: string, coordinates?: { lat: number; lng: number }) => {
    setPAddress(address);
    if (coordinates) {
      setPLat(coordinates.lat.toFixed(6));
      setPLng(coordinates.lng.toFixed(6));
    }
  }, []);

  const handleClientAddressSelect = useCallback((address: string) => {
    setQuickClientAddress(address);
  }, []);

  // Optional first work order fields
  const [addFirstWorkOrder, setAddFirstWorkOrder] = useState(false);
  const [woTitle, setWoTitle] = useState("");
  const [woDesc, setWoDesc] = useState("");
  const [woStart, setWoStart] = useState("");
  const [woEnd, setWoEnd] = useState("");

  // Step 6: Crew assignment
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([]);

  // Staff query for crew assignment step
  const {
    data: staffList = [],
    isLoading: staffLoading,
    isError: staffLoadError,
    refetch: refetchStaff,
  } = useQuery({
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
    { label: "Project basics", icon: Briefcase, desc: "Name the project and choose its client" },
    { label: "Site location", icon: MapPin, desc: "Optionally add an address and geofence" },
    { label: "Plan & value", icon: DollarSign, desc: "Optionally set budget, status, and dates" },
    { label: "Initial job", icon: Wrench, desc: "Optionally create the first work order" },
    { label: "Team", icon: Users, desc: "Optionally select crew members" },
    { label: "Review", icon: CheckCircle2, desc: "Confirm the details and create the project" },
  ];

  const guidedProgress = Math.round(((guidedStep + 1) / GUIDED_STEPS.length) * 100);

  const openGuidedFlow = () => {
    setGuidedStep(0);
    setGuidedSaving(false);
    setCreatedProjectId(null);
    setCreatedProjectName("");
    setGuidedError("");
    setPName("");
    setPCustId("");
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
    setAddFirstWorkOrder(false);
    setWoTitle("");
    setWoDesc("");
    setWoStart("");
    setWoEnd("");
    setSelectedCrewIds([]);
    setGuidedOpen(true);
  };

  const getGuidedStepError = (step = guidedStep) => {
    switch (step) {
      case 0:
        if (!pName.trim()) return "Enter a project name to continue.";
        if (!pCustId) return "Choose the client this project belongs to.";
        return "";
      case 1: {
        const hasLatitude = pLat.trim().length > 0;
        const hasLongitude = pLng.trim().length > 0;
        if (hasLatitude !== hasLongitude) return "Enter both latitude and longitude, or leave both blank.";
        if (hasLatitude && (!Number.isFinite(Number(pLat)) || Number(pLat) < -90 || Number(pLat) > 90)) return "Latitude must be between -90 and 90.";
        if (hasLongitude && (!Number.isFinite(Number(pLng)) || Number(pLng) < -180 || Number(pLng) > 180)) return "Longitude must be between -180 and 180.";
        if (pRadius && (!Number.isFinite(Number(pRadius)) || Number(pRadius) <= 0)) return "Geofence radius must be greater than zero.";
        return "";
      }
      case 2:
        if (pContract && (!Number.isFinite(Number(pContract)) || Number(pContract) < 0)) return "Contract value cannot be negative.";
        if (pBudget && (!Number.isFinite(Number(pBudget)) || Number(pBudget) < 0)) return "Labor budget cannot be negative.";
        if (pStart && pEnd && pEnd < pStart) return "End date must be on or after the start date.";
        return "";
      case 3:
        if (!addFirstWorkOrder) return "";
        if (!woTitle.trim()) return "Add a title for the first work order, or choose to create it later.";
        if (woStart && woEnd && new Date(woEnd) < new Date(woStart)) return "Work order end time must be after its start time.";
        return "";
      default:
        return "";
    }
  };

  const canAdvanceStep = () => !getGuidedStepError();

  const handleGuidedNext = () => {
    if (!canAdvanceStep()) return;
    setGuidedError("");
    if (guidedStep < GUIDED_STEPS.length - 1) setGuidedStep((step) => step + 1);
  };

  const handleGuidedLaunch = async () => {
    if (createdProjectId) {
      setGuidedOpen(false);
      navigate(`/projects/${createdProjectId}`);
      return;
    }

    for (const step of [0, 1, 2, 3]) {
      const error = getGuidedStepError(step);
      if (error) {
        setGuidedStep(step);
        setGuidedError(error);
        return;
      }
    }

    if (!company?.id) {
      setGuidedError("Your company profile is still loading. Please try again in a moment.");
      return;
    }

    setGuidedSaving(true);
    setGuidedError("");
    let projectId: string | null = null;
    try {
      const projectPayload = {
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
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert(projectPayload)
        .select("id, name")
        .single();
      if (projectError || !project) throw projectError || new Error("Project could not be created.");

      projectId = project.id;
      setCreatedProjectId(project.id);
      setCreatedProjectName(project.name);

      if (addFirstWorkOrder) {
        const { error: jobError } = await supabase.from("jobs").insert({
          project_id: project.id,
          customer_id: pCustId,
          title: woTitle.trim(),
          status: "Scheduled",
          description: woDesc.trim() || null,
          scheduled_start: woStart || null,
          scheduled_end: woEnd || null,
        });
        if (jobError) throw jobError;
      }

      if (selectedCrewIds.length > 0) {
        const assignments = selectedCrewIds.map((staffId) => ({
          project_id: project.id,
          staff_id: staffId,
          role: "Field Crew",
        }));
        const { error: assignmentError } = await supabase.from("project_assignments").insert(assignments);
        if (assignmentError) throw assignmentError;
      }

      queryClient.invalidateQueries({ queryKey: ["projects_list", company.id] });
      if (addFirstWorkOrder) queryClient.invalidateQueries({ queryKey: ["jobs", company.id] });
      toast({ title: "Project created", description: `${project.name} is ready in its workspace.` });
      setGuidedOpen(false);
      navigate(`/projects/${project.id}`);
    } catch (err: any) {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["projects_list", company.id] });
        if (addFirstWorkOrder) queryClient.invalidateQueries({ queryKey: ["jobs", company.id] });
      }
      const message = projectId
        ? "The project was created, but some optional setup could not finish. Open the workspace to complete it."
        : err.message || "We could not create this project. Please try again.";
      setGuidedError(message);
      toast({ title: projectId ? "Project needs follow-up" : "Unable to create project", description: message, variant: "destructive" });
    } finally {
      setGuidedSaving(false);
    }
  };

  const toggleCrewSelection = (id: string) => {
    setSelectedCrewIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const openQuickClientCard = () => {
    setQuickClientName("");
    setQuickClientEmail("");
    setQuickClientPhone("");
    setQuickClientCountry(DEFAULT_PHONE_COUNTRY.iso2);
    setQuickClientAddress("");
    setQuickClientOpen(true);
  };

  const handleQuickClientCreate = async () => {
    if (!company?.id || !quickClientName.trim()) return;
    setQuickClientSaving(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          company_id: company.id,
          name: quickClientName.trim(),
          email: quickClientEmail.trim() || null,
          phone: quickClientPhone.trim() ? `${selectedPhoneCountry.code} ${quickClientPhone.trim()}` : null,
          billing_address: quickClientAddress.trim() || null,
        })
        .select("id, name")
        .single();
      if (error || !data) throw error || new Error("Client could not be created.");

      setPCustId(data.id);
      queryClient.invalidateQueries({ queryKey: ["project_customers", company.id] });
      queryClient.invalidateQueries({ queryKey: ["customers", company.id] });
      setQuickClientOpen(false);
      toast({ title: "Client added", description: `${data.name} is now linked to this project.` });
    } catch (err: any) {
      toast({ title: "Unable to add client", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setQuickClientSaving(false);
    }
  };

  const openQuickCrewCard = () => {
    setQuickCrewName("");
    setQuickCrewUsername("");
    setQuickCrewPassword("");
    setQuickCrewJobTitle("");
    setQuickCrewOpen(true);
  };

  const handleQuickCrewCreate = async () => {
    if (!company?.id) return;
    const fullName = quickCrewName.trim();
    const usernameSuffix = quickCrewUsername.trim().replace(/\s/g, "").toUpperCase();
    if (!fullName || !usernameSuffix || quickCrewPassword.length < 8) return;

    const nameParts = fullName.split(/\s+/);
    setQuickCrewSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin_create_staff", {
        body: {
          username: `${company.prefix}${usernameSuffix}`.toUpperCase(),
          password: quickCrewPassword,
          full_name: fullName,
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(" ") || undefined,
          job_title: quickCrewJobTitle.trim() || undefined,
          company_id: company.id,
          global_role: "Field Crew",
        },
      });
      if (error) throw error;
      if (data?.error || !data?.staff_id) throw new Error(data?.error || "Crew member could not be created.");

      setSelectedCrewIds((ids) => ids.includes(data.staff_id) ? ids : [...ids, data.staff_id]);
      queryClient.invalidateQueries({ queryKey: ["guided_staff", company.id] });
      queryClient.invalidateQueries({ queryKey: ["staff_profiles", company.id] });
      setQuickCrewOpen(false);
      toast({ title: "Crew member added", description: `${fullName} is selected for this project.` });
    } catch (err: any) {
      toast({ title: "Unable to add crew member", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setQuickCrewSaving(false);
    }
  };
  // 1. Fetch Customers (for selection dropdown)
  const {
    data: customers = [],
    isLoading: customersLoading,
    isError: customersLoadError,
    refetch: refetchCustomers,
  } = useQuery({
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

  if (projectsLoading) {
    return (
      <DashboardLayout
        activeTab="projects"
        companyName={company?.name || ""}
        companyPrefix={company?.prefix || ""}
        companyId={company?.id || ""}
      >
        <div className="flex justify-center items-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
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
              <Plus className="h-4 w-4" /> New {t("Project")}
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
                                <Plus className="h-3.5 w-3.5" />
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
        <Dialog open={guidedOpen} onOpenChange={(open) => { if (!guidedSaving) setGuidedOpen(open); }}>
          <DialogContent className="w-screen max-w-none h-[100dvh] max-h-[100dvh] rounded-none border-none p-0 bg-background flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200 sm:w-[min(100vw-2rem,1040px)] sm:max-w-[1040px] sm:h-[min(860px,calc(100dvh-2rem))] sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl sm:border sm:border-border/70 sm:shadow-2xl">
            {/* Stepper Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border/40 pt-4 pb-4 sm:pt-6 sm:pb-5">
              <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg border border-border/60 bg-muted/45">
                      <Briefcase className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">Create a project</h3>
                      <p className="text-xs text-muted-foreground">Step {guidedStep + 1} of {GUIDED_STEPS.length} — {GUIDED_STEPS[guidedStep].desc}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setGuidedOpen(false)} disabled={guidedSaving} aria-label="Close project creation" className="rounded-full shrink-0">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-[11px] font-medium text-muted-foreground">Project setup</p>
                  <p className="text-[11px] tabular-nums text-muted-foreground">{guidedProgress}% complete</p>
                </div>
                <Progress value={guidedProgress} className="h-1 bg-muted mb-4" />
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
                            ? "bg-foreground text-background shadow-sm"
                            : isDone
                            ? "text-foreground bg-muted cursor-pointer hover:bg-muted/70"
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
            <div className="max-w-3xl mx-auto w-full flex-1 px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto space-y-6 min-h-[350px]">
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
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer / Client *</label>
                        <Button type="button" variant="ghost" size="sm" onClick={openQuickClientCard} className="h-7 px-2 text-xs font-semibold">
                          <Plus className="h-3.5 w-3.5 mr-1" /> New client
                        </Button>
                      </div>
                      {customersLoading ? (
                        <div className="flex h-12 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading clients…
                        </div>
                      ) : customersLoadError ? (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                          <p className="text-xs text-muted-foreground">We could not load clients.</p>
                          <Button variant="link" className="h-auto px-0 pt-1 text-xs" onClick={() => refetchCustomers()}>
                            Try again
                          </Button>
                        </div>
                      ) : customers.length > 0 ? (
                        <Select value={pCustId} onValueChange={setPCustId}>
                          <SelectTrigger className="py-6"><SelectValue placeholder="Select client" /></SelectTrigger>
                          <SelectContent>
                            {customers.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border bg-muted/25 p-4">
                          <p className="text-sm font-semibold">No clients yet</p>
                          <p className="mt-1 text-xs text-muted-foreground">Create the client here and it will be selected for this project automatically.</p>
                          <Button type="button" size="sm" onClick={openQuickClientCard} className="mt-3 h-8 gap-1.5">
                            <Plus className="h-3.5 w-3.5" /> Add client
                          </Button>
                        </div>
                      )}
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
                  <div className="p-4 rounded-xl bg-muted/35 border border-border/60">
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-foreground" />
                      Select a site address to fill its coordinates automatically. You can still adjust the geofence manually.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Job Site Address</label>
                    <Input
                      ref={projectAddressInputRef}
                      placeholder="Search for a site address"
                      value={pAddress}
                      onChange={(e) => setPAddress(e.target.value)}
                      className="py-6"
                    />
                    {mapsApiKey && guidedOpen && (
                      <APIProvider apiKey={mapsApiKey} libraries={["places"]}>
                        <AddressAutocomplete inputRef={projectAddressInputRef} onAddressSelect={handleProjectAddressSelect} />
                      </APIProvider>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {pLat && pLng ? `Coordinates linked: ${pLat}, ${pLng}` : "Start typing, then choose an address from the results."}
                    </p>
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
                </div>
              )}

              {/* Step 3: First Work Order */}
              {guidedStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-2">
                      <Wrench className="h-4 w-4 shrink-0 text-amber-500" />
                      Add an initial work order now, or create one from the project workspace when the work is ready to schedule.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddFirstWorkOrder((value) => !value)}
                    aria-pressed={addFirstWorkOrder}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                      addFirstWorkOrder ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded border-2 ${addFirstWorkOrder ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                      {addFirstWorkOrder && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">Create the first work order now</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">You can always add it later without changing the project.</span>
                    </span>
                  </button>
                  {addFirstWorkOrder && (
                    <div className="space-y-5 animate-in fade-in duration-200">
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
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Assign Crew */}
              {guidedStep === 4 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/25 p-4">
                    <div className="flex gap-3">
                      <Users className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground leading-5">
                        Assign crew members to the project workspace now. Dispatch them through a work order when the work is ready to schedule.
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={openQuickCrewCard} className="h-8 shrink-0 gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> Add crew
                    </Button>
                  </div>
                  {staffLoading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading available crew…
                    </div>
                  ) : staffLoadError ? (
                    <div className="text-center py-12 border border-destructive/30 bg-destructive/5 rounded-xl p-6">
                      <AlertTriangle className="h-8 w-8 text-destructive/70 mx-auto mb-3" />
                      <h4 className="font-bold text-sm">Crew could not be loaded</h4>
                      <Button variant="link" className="mt-1 text-xs" onClick={() => refetchStaff()}>Try again</Button>
                    </div>
                  ) : staffList.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-xl p-6 bg-muted/15">
                      <Users className="h-9 w-9 text-muted-foreground/40 mx-auto mb-3" />
                      <h4 className="font-bold text-sm">No active crew members</h4>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Add a field crew account here. It will be selected for this project after creation.</p>
                      <Button type="button" size="sm" onClick={openQuickCrewCard} className="mt-4 h-8 gap-1.5">
                        <Plus className="h-3.5 w-3.5" /> Add crew member
                      </Button>
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
                      <CheckCircle2 className="h-8 w-8 text-foreground" />
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-tight">Ready to create this project?</h3>
                    <p className="text-sm text-muted-foreground mt-1">Nothing has been saved yet. Review the setup, then create the project when you are ready.</p>
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

                    {(Number(pContract) > 0 || Number(pBudget) > 0) && (
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

                    {addFirstWorkOrder && woTitle && (
                      <div className="flex gap-4 p-4 rounded-xl border border-border/60 bg-muted/10">
                        <Wrench className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">First Work Order</p>
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
              {guidedError && (
                <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-300">
                  {guidedError}
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="sticky bottom-0 bg-card border-t border-border/40 py-4">
              <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 space-y-2">
                {guidedStep < GUIDED_STEPS.length - 1 && !canAdvanceStep() && (
                  <p role="alert" className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    {getGuidedStepError()}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3">
                {guidedStep > 0 ? (
                  <Button
                    variant="ghost"
                    onClick={() => setGuidedStep(guidedStep - 1)}
                    disabled={guidedSaving}
                    className="h-11 gap-2 px-5 font-semibold"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => setGuidedOpen(false)} disabled={guidedSaving} className="h-11 px-5 font-semibold">
                    Cancel
                  </Button>
                )}

                {guidedStep < GUIDED_STEPS.length - 1 ? (
                  <Button
                    onClick={handleGuidedNext}
                    disabled={!canAdvanceStep() || guidedSaving}
                    className="h-11 gap-2 bg-foreground hover:bg-foreground/90 text-background px-5 font-semibold shadow-sm"
                  >
                    {guidedSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleGuidedLaunch}
                    disabled={guidedSaving}
                    className="h-11 gap-2 bg-foreground hover:bg-foreground/90 px-5 font-semibold text-background shadow-sm"
                  >
                    {guidedSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {guidedSaving ? "Creating project…" : createdProjectId ? "Open saved project" : "Create project"}
                  </Button>
                )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={quickClientOpen} onOpenChange={(open) => { if (!quickClientSaving) setQuickClientOpen(open); }}>
          <DialogContent className="sm:max-w-md rounded-2xl border-border/70 p-0 overflow-hidden">
            <DialogHeader className="border-b border-border/60 px-6 py-5">
              <DialogTitle className="text-lg">Add a client</DialogTitle>
              <p className="text-sm text-muted-foreground">The client will be selected for this project as soon as it is saved.</p>
            </DialogHeader>
            <form
              className="space-y-4 px-6 py-5"
              onSubmit={(event) => { event.preventDefault(); handleQuickClientCreate(); }}
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Client name</label>
                <Input autoFocus placeholder="Company or client name" value={quickClientName} onChange={(event) => setQuickClientName(event.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email <span className="text-muted-foreground">(optional)</span></label>
                  <Input type="email" placeholder="name@company.com" value={quickClientEmail} onChange={(event) => setQuickClientEmail(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Phone <span className="text-muted-foreground">(optional)</span></label>
                  <div className="flex">
                    <Popover open={phoneCountryOpen} onOpenChange={setPhoneCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" aria-label="Choose phone country" className="h-10 w-[118px] justify-start gap-2 rounded-r-none border-r-0 bg-muted/45 px-2 font-mono text-xs hover:bg-muted">
                          <img
                            src={`https://flagcdn.com/w40/${selectedPhoneCountry.iso2.toLowerCase()}.png`}
                            alt=""
                            className="h-3.5 w-5 rounded-[2px] object-cover"
                          />
                          <span>{selectedPhoneCountry.code}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-[min(360px,calc(100vw-3rem))] p-0">
                        <Command>
                          <CommandInput placeholder="Search country or dial code" />
                          <CommandList>
                            <CommandEmpty>{phoneCountriesLoading ? "Loading countries…" : "No country found."}</CommandEmpty>
                            <CommandGroup heading="Countries">
                              {phoneCountries.map((country) => (
                                <CommandItem
                                  key={country.iso2}
                                  value={`${country.name} ${country.code}`}
                                  onSelect={() => {
                                    setQuickClientCountry(country.iso2);
                                    setPhoneCountryOpen(false);
                                  }}
                                  className="flex items-center justify-between gap-3"
                                >
                                  <span className="truncate">{country.name}</span>
                                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{country.code}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Input type="tel" inputMode="tel" className="rounded-l-none" placeholder="555 555 5555" value={quickClientPhone} onChange={(event) => setQuickClientPhone(event.target.value)} />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Billing address <span className="text-muted-foreground">(optional)</span></label>
                <Input ref={quickClientAddressInputRef} placeholder="Search for a billing address" value={quickClientAddress} onChange={(event) => setQuickClientAddress(event.target.value)} />
                {mapsApiKey && quickClientOpen && (
                  <APIProvider apiKey={mapsApiKey} libraries={["places"]}>
                    <AddressAutocomplete inputRef={quickClientAddressInputRef} onAddressSelect={handleClientAddressSelect} />
                  </APIProvider>
                )}
                <p className="text-xs text-muted-foreground">Choose a result to use its complete formatted address.</p>
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="ghost" onClick={() => setQuickClientOpen(false)} disabled={quickClientSaving}>Cancel</Button>
                <Button type="submit" disabled={!quickClientName.trim() || quickClientSaving} className="bg-foreground text-background hover:bg-foreground/90">
                  {quickClientSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save client
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={quickCrewOpen} onOpenChange={(open) => { if (!quickCrewSaving) setQuickCrewOpen(open); }}>
          <DialogContent className="sm:max-w-md rounded-2xl border-border/70 p-0 overflow-hidden">
            <DialogHeader className="border-b border-border/60 px-6 py-5">
              <DialogTitle className="text-lg">Add a crew member</DialogTitle>
              <p className="text-sm text-muted-foreground">This creates a Field Crew account and selects the person for this project.</p>
            </DialogHeader>
            <form
              className="space-y-4 px-6 py-5"
              onSubmit={(event) => { event.preventDefault(); handleQuickCrewCreate(); }}
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Full name</label>
                <Input autoFocus placeholder="Jordan Smith" value={quickCrewName} onChange={(event) => setQuickCrewName(event.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Username</label>
                  <div className="flex">
                    <span className="inline-flex h-10 items-center rounded-l-md border border-r-0 bg-muted px-2 text-xs font-mono text-muted-foreground">{company?.prefix}</span>
                    <Input className="rounded-l-none font-mono uppercase" placeholder="JSMITH" value={quickCrewUsername} onChange={(event) => setQuickCrewUsername(event.target.value.replace(/\s/g, "").toUpperCase())} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Temporary password</label>
                  <Input type="password" minLength={8} placeholder="At least 8 characters" value={quickCrewPassword} onChange={(event) => setQuickCrewPassword(event.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Job title <span className="text-muted-foreground">(optional)</span></label>
                <Input placeholder="e.g. Field Technician" value={quickCrewJobTitle} onChange={(event) => setQuickCrewJobTitle(event.target.value)} />
              </div>
              <p className="rounded-lg border border-border/60 bg-muted/35 px-3 py-2 text-xs leading-5 text-muted-foreground">
                Share the temporary password securely. The account can be completed and managed later from the staff directory.
              </p>
              <DialogFooter className="pt-2">
                <Button type="button" variant="ghost" onClick={() => setQuickCrewOpen(false)} disabled={quickCrewSaving}>Cancel</Button>
                <Button type="submit" disabled={!quickCrewName.trim() || !quickCrewUsername.trim() || quickCrewPassword.length < 8 || quickCrewSaving} className="bg-foreground text-background hover:bg-foreground/90">
                  {quickCrewSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create crew account
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}

function AddressAutocomplete({
  inputRef,
  onAddressSelect,
}: {
  inputRef: RefObject<HTMLInputElement>;
  onAddressSelect: (address: string, coordinates?: { lat: number; lng: number }) => void;
}) {
  const placesLibrary = useMapsLibrary("places");

  useEffect(() => {
    if (!placesLibrary || !inputRef.current) return;

    const autocomplete = new placesLibrary.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry"],
      types: ["address"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.formatted_address) return;

      const location = place.geometry?.location;
      onAddressSelect(
        place.formatted_address,
        location ? { lat: location.lat(), lng: location.lng() } : undefined,
      );
    });

    return () => listener.remove();
  }, [placesLibrary, inputRef, onAddressSelect]);

  return null;
}
