import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import StaffShiftManager from "./StaffShiftManager";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  UserPlus,
  Users,
  Trash2,
  Copy,
  X,
  CheckCircle,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Send,
  Clock,
  ShieldCheck,
  ShieldOff,
  Crown,
  AlertTriangle,
  MessageSquare,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import StaffPhotoUpload from "./StaffPhotoUpload";
import { usePermissions, Feature } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";

interface CreatedStaff {
  id: string;
  fullName: string;
  username: string;
  password: string;
}

// Modern 2026 color tokens mapped to role color keys
const ROLE_COLOR_MAP: Record<string, string> = {
  violet:  "bg-violet-500/15 text-violet-400 border-violet-500/25",
  sky:     "bg-sky-500/15 text-sky-400 border-sky-500/25",
  amber:   "bg-amber-500/15 text-amber-400 border-amber-500/25",
  emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  rose:    "bg-rose-500/15 text-rose-400 border-rose-500/25",
  cyan:    "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  pink:    "bg-pink-500/15 text-pink-400 border-pink-500/25",
  slate:   "bg-slate-500/15 text-slate-400 border-slate-500/25",
};

// Fallback for legacy hardcoded roles
const LEGACY_ROLE_COLORS: Record<string, string> = {
  Admin:        ROLE_COLOR_MAP.violet,
  Finance:      ROLE_COLOR_MAP.sky,
  Dispatcher:   ROLE_COLOR_MAP.amber,
  "Field Crew": ROLE_COLOR_MAP.emerald,
};

const FEATURES_LIST: { id: Feature; label: string }[] = [
  { id: 'overview',       label: 'Office Overview & Action Feed' },
  { id: 'projects',       label: 'Project Workspace & Stages' },
  { id: 'jobs',           label: 'Field Jobs & Tasks' },
  { id: 'map',            label: 'Live Maps & GPS Tracker' },
  { id: 'schedule',       label: 'Scheduling & Dispatch Board' },
  { id: 'crm',            label: 'CRM & Client Assets' },
  { id: 'staff',          label: 'Staff Directory & Management' },
  { id: 'invoices',       label: 'Invoices & Ledger' },
  { id: 'estimates',      label: 'Proposals & Estimates' },
  { id: 'change-orders',  label: 'Contract Change Orders' },
  { id: 'safety',         label: 'Safety Inspections' },
  { id: 'reports',        label: 'Predefined Report Library' },
  { id: 'tracker',        label: 'GPS Location Tracker' },
  { id: 'billing',        label: 'Billing & Settings' },
  { id: 'memberships',    label: 'Service Agreements' },
  { id: 'timesheets',     label: 'Timesheets & Attendance' },
  { id: 'compliance',     label: 'Tech Compliance Checklists' },
];

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const getGeocodedAddress = async (lat: number, lng: number, staffId: string) => {
  const cacheKey = `geo_address_${staffId}_${lat.toFixed(3)}_${lng.toFixed(3)}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "User-Agent": "FieldCrewsFSM/1.0",
        },
      }
    );
    const data = await res.json();
    if (data && data.address) {
      const city = data.address.city || data.address.town || data.address.village || data.address.suburb || "";
      const state = data.address.state || "";
      const country = data.address.country || "";
      
      let addressString = "";
      if (city && state) {
        addressString = `${city}, ${state}`;
      } else if (city) {
        addressString = city;
      } else if (state) {
        addressString = state;
      } else {
        addressString = country || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
      localStorage.setItem(cacheKey, addressString);
      return addressString;
    }
  } catch (err) {
    console.error("Geocoding failed:", err);
  }
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const StaffManagement = ({ companyId, prefix }: { companyId: string; prefix: string }) => {
  const { canManageRoles, canDelegateRoleManagement, isOwner } = usePermissions();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffAddress, setStaffAddress] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [password, setPassword] = useState("");
  const [gasSafeRegistered, setGasSafeRegistered] = useState(false);
  const [newStaffRole, setNewStaffRole] = useState<string>("Field Crew");
  const [creating, setCreating] = useState(false);
  const [lastCreatedStaff, setLastCreatedStaff] = useState<CreatedStaff | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [sendingTestPush, setSendingTestPush] = useState<string | null>(null);
  const [shiftStaff, setShiftStaff] = useState<{ id: string; name: string } | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit staff dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editHourlyRate, setEditHourlyRate] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editCanManageRoles, setEditCanManageRoles] = useState(false);
  const [editGasSafeRegistered, setEditGasSafeRegistered] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Limit warnings state
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [limitWarningRole, setLimitWarningRole] = useState("");

  const queryClient = useQueryClient();
  const [managementTab, setManagementTab] = useState<"directory" | "roles">("directory");
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [customRoleName, setCustomRoleName] = useState("");
  const [customRoleDesc, setCustomRoleDesc] = useState("");
  const [customRoleColor, setCustomRoleColor] = useState("slate");
  const [customRolePerms, setCustomRolePerms] = useState<Feature[]>([]);

  const addCustomRoleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("roles").insert({
        company_id: companyId,
        name: customRoleName.trim(),
        description: customRoleDesc.trim() || null,
        color: customRoleColor,
        permissions: customRolePerms,
        is_system: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", companyId] });
      setRoleDialogOpen(false);
      setCustomRoleName("");
      setCustomRoleDesc("");
      setCustomRoleColor("slate");
      setCustomRolePerms([]);
      toast.success("Custom role created successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create custom role");
    }
  });

  const deleteCustomRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", companyId] });
      toast.success("Custom role removed successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete role");
    }
  });

  const { company } = useAuth();
  const isUKCompany = company?.country === "GB";

  const openEditDialog = (staff: any) => {
    setEditingStaff(staff);
    setEditFirstName(staff.first_name || "");
    setEditLastName(staff.last_name || "");
    setEditEmail(staff.email || "");
    setEditPhone(staff.phone || "");
    setEditAddress(staff.address || "");
    setEditJobTitle(staff.job_title || "");
    setEditHourlyRate(staff.hourly_rate ? String(staff.hourly_rate) : "");
    setEditRole(staff.global_role || "Field Crew");
    setEditCanManageRoles(staff.can_manage_roles || false);
    setEditGasSafeRegistered(staff.gas_safe_registered || false);
    setEditDialogOpen(true);
  };

  const saveEditStaff = async () => {
    if (!editingStaff) return;
    setEditSaving(true);
    try {
      const updates: any = {
        first_name: editFirstName.trim() || null,
        last_name: editLastName.trim() || null,
        full_name: [editFirstName.trim(), editLastName.trim()].filter(Boolean).join(" ") || editingStaff.full_name,
        email: editEmail.trim() || null,
        phone: editPhone.trim() || null,
        address: editAddress.trim() || null,
        job_title: editJobTitle.trim() || null,
        hourly_rate: editHourlyRate ? parseFloat(editHourlyRate) : null,
        gas_safe_registered: editGasSafeRegistered,
      };
      if (canManageRoles) {
        updates.global_role = editRole;
      }
      if (canDelegateRoleManagement) {
        updates.can_manage_roles = editCanManageRoles;
      }
      const { error } = await supabase
        .from("staff_profiles")
        .update(updates)
        .eq("id", editingStaff.id);
      if (error) throw error;
      toast.success(`${updates.full_name}'s profile updated`);
      setEditDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update staff profile");
    } finally {
      setEditSaving(false);
    }
  };

  // Fetch active geofences
  const { data: geofences = [] } = useQuery({
    queryKey: ["geofences", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("geofences")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch staff with locations (poll every 8 seconds for real-time presence)
  const { data: staff, refetch } = useQuery({
    queryKey: ["staff_profiles", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select(`
          *,
          staff_locations (
            latitude,
            longitude,
            accuracy,
            updated_at
          )
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 8000,
  });

  const [resolvedAddresses, setResolvedAddresses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!staff) return;
    staff.forEach(async (s: any) => {
      const locData = s.staff_locations;
      const loc = Array.isArray(locData) ? locData[0] : locData;
      if (loc && loc.latitude && loc.longitude) {
        const key = `${s.id}_${loc.latitude.toFixed(3)}_${loc.longitude.toFixed(3)}`;
        if (resolvedAddresses[key]) return;
        
        const addr = await getGeocodedAddress(loc.latitude, loc.longitude, s.id);
        setResolvedAddresses(prev => ({ ...prev, [key]: addr }));
      }
    });
  }, [staff]);

  const getPresenceStatus = (s: any) => {
    if (!s.is_active) {
      return { 
        label: "Inactive", 
        color: "bg-rose-500/10 text-rose-400 border-rose-500/20" 
      };
    }

    const locData = s.staff_locations;
    const loc = Array.isArray(locData) ? locData[0] : locData;
    if (!loc || !loc.updated_at) {
      return { 
        label: "Offline", 
        color: "bg-slate-500/10 text-slate-400 border-slate-500/20" 
      };
    }

    // Check if updated in last 5 minutes
    const diffMs = new Date().getTime() - new Date(loc.updated_at).getTime();
    const isOnline = diffMs < 300000;

    if (!isOnline) {
      return { 
        label: "Offline", 
        color: "bg-slate-500/10 text-slate-400 border-slate-500/20" 
      };
    }

    // Check if inside any active geofence
    let insideGeofenceName = "";
    for (const gf of geofences) {
      const dist = haversineMeters(loc.latitude, loc.longitude, gf.latitude, gf.longitude);
      if (dist <= gf.radius_meters) {
        insideGeofenceName = gf.name;
        break;
      }
    }

    if (insideGeofenceName) {
      return { 
        label: `Active (On Site: ${insideGeofenceName})`, 
        color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 animate-pulse" 
      };
    }

    return { 
      label: "Active (Roaming)", 
      color: "bg-teal-500/15 text-teal-400 border-teal-500/25" 
    };
  };

  // Fetch roles from DB
  const { data: roles = [] } = useQuery({
    queryKey: ["roles", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .eq("company_id", companyId)
        .order("name");
      if (error) {
        console.warn("[Roles] Query error, using defaults:", error.message);
        return [
          { name: "Admin", description: "Full dashboard access", color: "violet" },
          { name: "Finance", description: "Access to CRM, invoices, and reports", color: "sky" },
          { name: "Dispatcher", description: "Access to work orders and scheduling", color: "amber" },
          { name: "Field Crew", description: "Mobile app only", color: "emerald" },
        ];
      }
      return data || [];
    },
  });

  const activeStaff = staff || [];
  const activeAdmins = activeStaff.filter(
    (s: any) => s.is_active && (s.global_role === "Admin" || s.global_role === "Finance" || s.global_role === "Dispatcher")
  ).length;
  const activeFieldCrew = activeStaff.filter(
    (s: any) => s.is_active && s.global_role === "Field Crew"
  ).length;

  const whatsappMessage = encodeURIComponent(
    `Hi there! We have reached our seat limit for ${limitWarningRole} on FiledCrews. Please send us details on how we can top up or upgrade.`
  );
  const whatsappUrl = `https://wa.me/14094229714?text=${whatsappMessage}`;

  // Filter staff by search
  const filteredStaff = activeStaff.filter((s) =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ((s as any).global_role || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (roleName: string) => {
    const dbRole = roles.find((r: any) => r.name === roleName);
    if (dbRole?.color && ROLE_COLOR_MAP[dbRole.color]) return ROLE_COLOR_MAP[dbRole.color];
    return LEGACY_ROLE_COLORS[roleName] || ROLE_COLOR_MAP.slate;
  };

  const getRoleDescription = (roleName: string) => {
    const dbRole = roles.find((r: any) => r.name === roleName);
    return dbRole?.description || "";
  };

  const resetForm = () => {
    setUsername("");
    setFirstName("");
    setLastName("");
    setStaffEmail("");
    setStaffPhone("");
    setStaffAddress("");
    setJobTitle("");
    setPassword("");
    setGasSafeRegistered(false);
    setNewStaffRole("Field Crew");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const computedFullName = [firstName, lastName].filter(Boolean).join(" ");
    if (!username || !computedFullName || !password) return;

    // Check seat limits (Enforced for all tiers based on DB quota or plan tier fallback)
    const tier = company?.subscription_tier || "free_trial";
    const isFP = tier === "founding_partner" || tier === "Founding Partner";
    if (newStaffRole === "Field Crew") {
      const maxFieldCrew = company?.max_field_crew_seats ?? (tier === "growth" ? 7 : (isFP ? 15 : (tier === "enterprise" ? 100 : 2)));
      if (activeFieldCrew >= maxFieldCrew) {
        setLimitWarningRole("Field Crew");
        setShowLimitWarning(true);
        return;
      }
    } else {
      const maxAdmins = company?.max_admin_seats ?? (tier === "growth" ? 3 : (isFP ? 5 : (tier === "enterprise" ? 50 : 1)));
      if (activeAdmins >= maxAdmins) {
        setLimitWarningRole("Office Seat");
        setShowLimitWarning(true);
        return;
      }
    }

    const fullUsername = `${prefix}${username}`.toUpperCase();
    setCreating(true);
    setLastCreatedStaff(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin_create_staff", {
        body: {
          username: fullUsername,
          password,
          full_name: computedFullName,
          first_name: firstName,
          last_name: lastName,
          email: staffEmail || undefined,
          phone: staffPhone || undefined,
          address: staffAddress || undefined,
          job_title: jobTitle || undefined,
          company_id: companyId,
          global_role: newStaffRole,
          gas_safe_registered: gasSafeRegistered,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setLastCreatedStaff({ id: data.staff_id, fullName: computedFullName, username: fullUsername, password });
      resetForm();
      setCreateDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create staff");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (staffId: string) => {
    setDeletingId(staffId);
    try {
      const { data, error } = await supabase.functions.invoke("admin_delete_staff", {
        body: { staff_id: staffId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Staff member deleted");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete staff");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRoleChange = async (staffId: string, staffName: string, newRole: string) => {
    if (!canManageRoles) return;
    setUpdatingRoleId(staffId);
    try {
      const { error } = await supabase
        .from("staff_profiles")
        .update({ global_role: newRole })
        .eq("id", staffId);
      if (error) throw error;
      toast.success(`${staffName}'s role updated to ${newRole}`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleToggleRoleDelegate = async (staffId: string, staffName: string, current: boolean) => {
    if (!canDelegateRoleManagement) return;
    try {
      const { error } = await supabase
        .from("staff_profiles")
        .update({ can_manage_roles: !current })
        .eq("id", staffId);
      if (error) throw error;
      toast.success(
        !current
          ? `${staffName} can now assign roles to other staff`
          : `${staffName}'s role management access revoked`
      );
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update role management access");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleSendTestPush = async (staffId: string, staffName: string) => {
    setSendingTestPush(staffId);
    try {
      const { data, error } = await supabase.functions.invoke("send_test_push", {
        body: { staffId },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Failed to send test push");
      toast.success(`Test push sent to ${staffName}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send test push");
    } finally {
      setSendingTestPush(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab toggle links */}
      <div className="flex gap-2 border-b border-border/20 pb-2">
        <Button
          variant={managementTab === "directory" ? "default" : "outline"}
          onClick={() => setManagementTab("directory")}
          size="sm"
          className="text-xs font-bold"
        >
          Staff Directory
        </Button>
        <Button
          variant={managementTab === "roles" ? "default" : "outline"}
          onClick={() => setManagementTab("roles")}
          size="sm"
          className="text-xs font-bold"
        >
          Roles & Permissions
        </Button>
      </div>

      {managementTab === "directory" ? (
        <div className="space-y-4">
      {/* ─── Success Banner ─── */}
      {lastCreatedStaff && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">
                    Staff "{lastCreatedStaff.fullName}" created successfully
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5">
                      Username: <code className="bg-background px-1.5 py-0.5 rounded font-mono text-foreground">{lastCreatedStaff.username}</code>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => copyToClipboard(lastCreatedStaff.username)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </span>
                    <span className="flex items-center gap-1.5">
                      Password: <code className="bg-background px-1.5 py-0.5 rounded font-mono text-foreground">{lastCreatedStaff.password}</code>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => copyToClipboard(lastCreatedStaff.password)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/25 ml-2"
                      onClick={() => setShiftStaff({ id: lastCreatedStaff.id, name: lastCreatedStaff.fullName })}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Schedule First Shift
                    </Button>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setLastCreatedStaff(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Staff Table ─── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" />
              Staff Directory
              <Badge variant="secondary" className="ml-1 text-xs">{activeStaff.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-48 pl-8 text-xs"
                />
              </div>
              <Button size="sm" className="h-8 gap-1.5" onClick={() => setCreateDialogOpen(true)}>
                <UserPlus className="h-3.5 w-3.5" />
                Add Staff
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-sm">
                      {searchQuery ? "No staff matching your search" : "No staff created yet. Click \"Add Staff\" to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((s) => {
                    const role = (s as any).global_role as string;
                    const canDelegate = (s as any).can_manage_roles as boolean;
                    const roleColor = getRoleColor(role);

                    // Presence calculation
                    const presence = getPresenceStatus(s);

                    // Location lookup
                    const locData = (s as any).staff_locations;
                    const loc = Array.isArray(locData) ? locData[0] : locData;
                    const geoKey = loc ? `${s.id}_${loc.latitude.toFixed(3)}_${loc.longitude.toFixed(3)}` : "";
                    const address = loc ? resolvedAddresses[geoKey] || "Resolving location..." : "Never seen";
                    const seenTime = loc?.updated_at ? timeAgo(loc.updated_at) : "";

                    return (
                      <TableRow key={s.id} className={cn(!s.is_active ? "opacity-50" : "", "cursor-pointer hover:bg-muted/50 transition-colors")} onClick={() => openEditDialog(s)}>
                        {/* Avatar */}
                        <TableCell className="w-12 pr-0">
                          <StaffPhotoUpload
                            staffId={s.id}
                            fullName={s.full_name}
                            currentPhotoUrl={(s as any).photo_url}
                            onPhotoUpdated={refetch}
                          />
                        </TableCell>

                        {/* Name */}
                        <TableCell>
                          <div>
                            <p className="font-semibold text-sm">{s.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {format(new Date(s.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        </TableCell>

                        {/* Username */}
                        <TableCell>
                          <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">@{s.username}</code>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${presence.color}`}>
                            {presence.label}
                          </span>
                        </TableCell>

                        {/* Last Seen */}
                        <TableCell>
                          <div>
                            <p className="text-xs font-semibold text-foreground/90">{address}</p>
                            {seenTime && <p className="text-[10px] text-muted-foreground">{seenTime}</p>}
                          </div>
                        </TableCell>

                        {/* Role */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-1">
                            {canManageRoles ? (
                              <Select
                                value={role}
                                onValueChange={(val) => handleRoleChange(s.id, s.full_name, val)}
                                disabled={updatingRoleId === s.id}
                              >
                                <SelectTrigger className="h-7 text-xs w-32 bg-transparent border-0 p-0 shadow-none">
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColor}`}>
                                    {role === "Admin" && <Crown className="h-2.5 w-2.5" />}
                                    {role}
                                  </span>
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((r: any) => (
                                    <SelectItem key={r.name} value={r.name} className="text-xs">
                                      <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getRoleColor(r.name)}`}>
                                          {r.name}
                                        </span>
                                        <span className="text-muted-foreground text-[10px] truncate max-w-[160px]">{r.description}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${roleColor}`}>
                                {role === "Admin" && <Crown className="h-2.5 w-2.5" />}
                                {role}
                              </span>
                            )}
                            {canDelegate && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20 w-fit">
                                <ShieldCheck className="h-2 w-2" /> Role Mgr
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Job Title */}
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{(s as any).job_title || "—"}</span>
                        </TableCell>

                        {/* Contact */}
                        <TableCell>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {(s as any).email && <p>{(s as any).email}</p>}
                            {(s as any).phone && <p>{(s as any).phone}</p>}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center mr-2">
                                    <Switch
                                      checked={s.is_active}
                                      onCheckedChange={async (checked) => {
                                        const { error } = await supabase
                                          .from("staff_profiles")
                                          .update({ is_active: checked })
                                          .eq("id", s.id);
                                        if (error) {
                                          toast.error("Failed to update staff status");
                                        } else {
                                          toast.success(`${s.full_name} ${checked ? "activated" : "deactivated"}`);
                                          refetch();
                                        }
                                      }}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {s.is_active ? "Suspend account" : "Activate account"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                              onClick={() => setShiftStaff({ id: s.id, name: s.full_name })} title="Manage shifts">
                              <Clock className="h-3.5 w-3.5" />
                            </Button>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center">
                                    {(s as any).expo_push_token ? (
                                      <Bell className="h-3.5 w-3.5 text-emerald-400" />
                                    ) : (
                                      <BellOff className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {(s as any).expo_push_token ? "Push token registered" : "No push token"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {(s as any).expo_push_token && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                                disabled={sendingTestPush === s.id}
                                onClick={() => handleSendTestPush(s.id, s.full_name)} title="Send test push">
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            {canDelegateRoleManagement && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm"
                                      className={`h-7 w-7 p-0 ${canDelegate ? "text-amber-400" : "text-muted-foreground"}`}
                                      onClick={() => handleToggleRoleDelegate(s.id, s.full_name, canDelegate)}>
                                      {canDelegate ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    {canDelegate
                                      ? "Revoke role management"
                                      : "Grant role management"}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete {s.full_name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete this staff member, their location history, and all related data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={deletingId === s.id}
                                    onClick={() => handleDelete(s.id)}>
                                    {deletingId === s.id ? "Deleting…" : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Create Staff Dialog ─── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create Staff Account
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">First Name *</label>
                <Input placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Last Name *</label>
                <Input placeholder="Smith" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Username *</label>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2 h-9 bg-muted border border-r-0 rounded-l-md text-xs font-mono text-muted-foreground">{prefix}</span>
                  <Input
                    placeholder="JSMITH"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").toUpperCase())}
                    className="rounded-l-none font-mono"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Password *</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button type="button" variant="ghost" size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Role</label>
                <Select value={newStaffRole} onValueChange={setNewStaffRole}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r: any) => (
                      <SelectItem key={r.name} value={r.name} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getRoleColor(r.name)}`}>
                            {r.name}
                          </span>
                          <span className="text-muted-foreground text-[10px]">{r.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Job Title</label>
                <Input placeholder="Electrician" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Email</label>
                <Input type="email" placeholder="john@example.com" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Phone</label>
                <Input placeholder="+1 555-1234" value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Address</label>
                <Input placeholder="123 Main St" value={staffAddress} onChange={(e) => setStaffAddress(e.target.value)} />
              </div>
            </div>

            {isUKCompany && (
              <div className="flex items-center justify-between p-3 border border-border/40 rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold">UK Gas Safe Registered</label>
                  <p className="text-[10px] text-muted-foreground">Technician is legally certified to work on gas appliances in the UK.</p>
                </div>
                <Switch checked={gasSafeRegistered} onCheckedChange={setGasSafeRegistered} />
              </div>
            )}

            {/* Role description hint */}
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 border border-border/40">
              <span className="font-semibold text-foreground">{newStaffRole}:</span>{" "}
              {getRoleDescription(newStaffRole)}
            </p>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating…" : "Create Staff"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Custom Roles Registry
              </CardTitle>
              <Button size="sm" className="h-8 gap-1.5" onClick={() => setRoleDialogOpen(true)}>
                <UserPlus className="h-3.5 w-3.5" />
                Add Custom Role
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Active Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground italic">
                      No custom roles defined.
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role: any) => (
                    <TableRow key={role.id || role.name}>
                      <TableCell className="font-bold">
                        <Badge className={getRoleColor(role.name)}>
                          {role.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {role.description || "No description provided."}
                      </TableCell>
                      <TableCell className="text-xs max-w-[300px]">
                        <div className="flex flex-wrap gap-1">
                          {role.is_system ? (
                            <Badge variant="outline" className="text-[10px] py-0 px-1">
                              System Predefined (Full/Scoped Access)
                            </Badge>
                          ) : Array.isArray(role.permissions) && role.permissions.length > 0 ? (
                            role.permissions.map((p: string) => (
                              <Badge key={p} variant="outline" className="text-[9px] py-0 px-1 uppercase">
                                {p}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">No features checked</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {role.is_system ? (
                          <span className="text-[10px] text-muted-foreground italic">Locked</span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Remove custom role: "${role.name}"?`)) {
                                deleteCustomRoleMutation.mutate(role.id);
                              }
                            }}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      )}

      {/* ─── Custom Role Creator Dialog ─── */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Custom Corporate Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Role Name *</label>
              <Input
                placeholder="e.g. Field Supervisor"
                value={customRoleName}
                onChange={(e) => setCustomRoleName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Description</label>
              <Input
                placeholder="e.g. Supervise safety checksheets and approve timesheets"
                value={customRoleDesc}
                onChange={(e) => setCustomRoleDesc(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Badge Theme Color</label>
              <Select value={customRoleColor} onValueChange={setCustomRoleColor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="slate">Slate</SelectItem>
                  <SelectItem value="violet">Violet</SelectItem>
                  <SelectItem value="sky">Sky</SelectItem>
                  <SelectItem value="amber">Amber</SelectItem>
                  <SelectItem value="emerald">Emerald</SelectItem>
                  <SelectItem value="rose">Rose</SelectItem>
                  <SelectItem value="indigo">Indigo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground block">Exposed Workspace Features</label>
              <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto border border-border/30 rounded-xl p-3 bg-muted/10">
                {FEATURES_LIST.map((feat) => {
                  const checked = customRolePerms.includes(feat.id);
                  return (
                    <div key={feat.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCustomRolePerms([...customRolePerms, feat.id]);
                          } else {
                            setCustomRolePerms(customRolePerms.filter((p) => p !== feat.id));
                          }
                        }}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                        id={`perm-${feat.id}`}
                      />
                      <label htmlFor={`perm-${feat.id}`} className="text-xs text-foreground cursor-pointer select-none leading-none">
                        {feat.label}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addCustomRoleMutation.mutate()}
              disabled={addCustomRoleMutation.isPending || !customRoleName.trim()}
              className="bg-primary text-white hover:bg-primary/95 font-bold"
            >
              {addCustomRoleMutation.isPending ? "Creating…" : "Save Custom Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Seat Limit Warning ─── */}
      <AlertDialog open={showLimitWarning} onOpenChange={setShowLimitWarning}>
        <AlertDialogContent className="sm:max-w-md bg-background border-border/80">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-500 font-bold">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Seat Limit Reached
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-slate-300">
              <p className="text-sm font-medium text-foreground">
                You have reached your limit of active <span className="font-bold text-rose-500">{limitWarningRole}</span> seats.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                To allocate more seats, please contact your platform administrator to adjust your seat cap or upgrade your plan.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <AlertDialogCancel className="w-full sm:w-auto">Close</AlertDialogCancel>
            <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold" asChild>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="gap-1.5 flex items-center">
                <MessageSquare className="h-4 w-4" /> Contact via WhatsApp
              </a>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Shift Manager Modal ─── */}
      {shiftStaff && (
        <StaffShiftManager
          staffId={shiftStaff.id}
          staffName={shiftStaff.name}
          open={!!shiftStaff}
          onOpenChange={(open) => { if (!open) setShiftStaff(null); }}
        />
      )}

      {/* ─── Edit Staff Profile Dialog ─── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Edit Staff Profile
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">First Name</label>
                <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Last Name</label>
                <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} placeholder="Last name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Job Title</label>
              <Input value={editJobTitle} onChange={(e) => setEditJobTitle(e.target.value)} placeholder="e.g. Lead Technician" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Email</label>
                <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="email@company.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Phone</label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Address</label>
              <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Street address" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Hourly Rate ($)</label>
              <Input type="number" step="0.01" value={editHourlyRate} onChange={(e) => setEditHourlyRate(e.target.value)} placeholder="0.00" />
            </div>
            {canManageRoles && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Role</label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r: any) => (
                      <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {canDelegateRoleManagement && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20">
                <div>
                  <p className="text-sm font-semibold">Can Manage Roles</p>
                  <p className="text-xs text-muted-foreground">Allow this staff member to assign roles to others</p>
                </div>
                <Switch checked={editCanManageRoles} onCheckedChange={setEditCanManageRoles} />
              </div>
            )}
            
            {isUKCompany && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20">
                <div>
                  <p className="text-sm font-semibold">UK Gas Safe Registered</p>
                  <p className="text-xs text-muted-foreground">Technician is legally certified to work on gas appliances in the UK.</p>
                </div>
                <Switch checked={editGasSafeRegistered} onCheckedChange={setEditGasSafeRegistered} />
              </div>
            )}
            {/* Read-only Payment Details (submitted by crew) */}
            {editingStaff && (editingStaff.bank_name || editingStaff.routing_number || editingStaff.account_number) && (
              <div className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Direct Deposit Details</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Bank</span>
                    <span className="font-semibold">{editingStaff.bank_name || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Routing</span>
                    <span className="font-semibold font-mono">{editingStaff.routing_number || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Account</span>
                    <span className="font-semibold font-mono">{editingStaff.account_number ? `•••${editingStaff.account_number.slice(-4)}` : "—"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveEditStaff} disabled={editSaving}>
              {editSaving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement;
