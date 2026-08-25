import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PaginatedTableFull } from "@/components/PaginatedTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Users,
  Circle,
  Activity,
  ShieldCheck,
  Search,
  LogOut,
  Trash2,
  Key,
  UserCheck,
  UserX,
  Plus,
  Loader2,
  Globe,
  Settings,
  Edit2,
  DollarSign,
  MousePointer,
  TrendingUp,
  Eye,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  ArrowUpRight,
  Copy,
  Check,
  CalendarDays,
  AlertTriangle,
  BarChart3,
  Crown,
  MessageSquare,
  Filter,
  Layers,
  Sparkles,
  ShieldAlert,
  PieChart,
  Zap,
  Radio,
  FileText,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  Briefcase,
  MapPin,
  Coins,
  ChevronRight,
  Flame,
  Mail,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Company {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  auth_user_id: string;
  subscription_tier: string;
  subscription_status: string;
  subscription_started_at?: string | null;
  subscription_ends_at?: string | null;
  max_field_crew_seats: number;
  max_admin_seats: number;
  address?: string | null;
  annual_revenue?: string | null;
  currency?: string | null;
  enabled_modules?: any;
  industry?: string | null;
  staff_count?: string | null;
  website?: string | null;
  staff_profiles?: any[];
}

interface PlatformAdmin {
  id: string;
  user_id: string;
  created_at: string;
}

interface StaffUser {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  username: string;
  global_role: string;
  job_title: string | null;
  is_active: boolean;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  created_at: string;
  company: {
    name: string;
  } | null;
}

export default function SuperadminDashboard() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [isSuperadmin, setIsSuperadmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Search & Filter terms
  const [companySearch, setCompanySearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [companyTierFilter, setCompanyTierFilter] = useState<"all" | "council" | "paid" | "trial" | "pending">("all");

  // 360° Company Inspector Drawer State
  const [selectedCompany360, setSelectedCompany360] = useState<Company | null>(null);
  const [drawerTab, setDrawerTab] = useState<"profile" | "roster" | "modules">("profile");

  // Edit Subscription Modal States
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editTier, setEditTier] = useState("Free");
  const [editStatus, setEditStatus] = useState("active");
  const [editMaxAdmins, setEditMaxAdmins] = useState(3);
  const [editMaxFieldCrew, setEditMaxFieldCrew] = useState(10);
  const [editSubStartDate, setEditSubStartDate] = useState("");
  const [editSubEndDate, setEditSubEndDate] = useState("");

  // Add platform admin state
  const [newAdminUserId, setNewAdminUserId] = useState("");

  // Edit User Modal States
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editGlobalRole, setEditGlobalRole] = useState("Field Crew");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleOpenEditUser = (u: any) => {
    setEditingUser(u);
    setEditFullName(u.full_name || "");
    setEditUsername(u.username || "");
    setEditJobTitle(u.job_title || "");
    setEditGlobalRole(u.global_role || "Field Crew");
    setEditEmail(u.email || "");
    setEditPhone(u.phone || "");
    setEditAddress(u.address || "");
    setNewPassword("");
  };

  // Affiliate States
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [affiliateStatusFilter, setAffiliateStatusFilter] = useState("all");
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(null);
  const [copiedAffCode, setCopiedAffCode] = useState<string | null>(null);
  const [affiliatesList, setAffiliatesList] = useState([
    {
      id: "1", name: "Sarah Jenkins", email: "sarah@jenkinsco.com", company: "Jenkins HVAC Consulting",
      code: "JENKINS10", website: "https://jenkinsco.com", status: "pending", manager: "Unassigned",
      created_at: "2026-07-18T10:00:00Z", commissionRate: 20, avatar: "SJ", avatarBg: "bg-rose-100 text-rose-700",
      stats: { clicks: 0, referrals: 0, activePaid: 0, totalEarned: 0, pendingPayout: 0, conversionRate: 0 },
      referredCrews: [] as { name: string; trade: string; date: string; status: string; plan: string; seats: number; commission: string }[],
    },
    {
      id: "2", name: "Marcus Vance", email: "marcus@vanceadvisory.com", company: "Vance Trade Advisory",
      code: "VANCE20", website: "https://vanceadvisory.com", status: "approved", manager: "Operator Admin",
      created_at: "2026-07-15T12:30:00Z", commissionRate: 20, avatar: "MV", avatarBg: "bg-indigo-100 text-indigo-700",
      stats: { clicks: 1248, referrals: 12, activePaid: 8, totalEarned: 4850, pendingPayout: 920, conversionRate: 3.04 },
      referredCrews: [
        { name: "Anderson Heating & AC", trade: "HVAC", date: "July 12, 2026", status: "Active Paid", plan: "Growth Plan", seats: 8, commission: "+$85.00/mo" },
        { name: "Apex Plumbing Solutions", trade: "Plumbing", date: "July 18, 2026", status: "Trial Period", plan: "Starter Plan", seats: 3, commission: "$0.00" },
        { name: "GreenTech Landscaping", trade: "Landscaping", date: "June 28, 2026", status: "Active Paid", plan: "Growth Plan", seats: 5, commission: "+$54.00/mo" },
        { name: "Summit HVAC Services", trade: "HVAC", date: "July 19, 2026", status: "Active Paid", plan: "Growth Plan", seats: 12, commission: "+$120.00/mo" },
        { name: "Rivera Construction Co", trade: "Construction", date: "June 05, 2026", status: "Active Paid", plan: "Pro Plan", seats: 20, commission: "+$190.00/mo" },
        { name: "Vance Electrical Corp", trade: "Electrical", date: "May 10, 2026", status: "Churned", plan: "Lite Plan", seats: 1, commission: "Voided" },
        { name: "Blue Wave Plumbing", trade: "Plumbing", date: "July 20, 2026", status: "Pending Setup", plan: "Starter Plan", seats: 2, commission: "$0.00" },
        { name: "ProFlow Fire & Safety", trade: "Fire Protection", date: "April 22, 2026", status: "Active Paid", plan: "Growth Plan", seats: 6, commission: "+$72.00/mo" },
      ],
    },
    {
      id: "3", name: "Alex Mercer", email: "alex@mercerplumbing.com", company: "Mercer Contracting Group",
      code: "MERCER15", website: "https://mercerplumbing.com", status: "pending", manager: "Unassigned",
      created_at: "2026-07-20T14:45:00Z", commissionRate: 20, avatar: "AM", avatarBg: "bg-emerald-100 text-emerald-700",
      stats: { clicks: 0, referrals: 0, activePaid: 0, totalEarned: 0, pendingPayout: 0, conversionRate: 0 },
      referredCrews: [],
    },
    {
      id: "4", name: "David Miller", email: "david@millermedia.com", company: "Miller Marketing Solutions",
      code: "MILLER5", website: "https://millermedia.com", status: "suspended", manager: "Operator Admin",
      created_at: "2026-07-10T08:15:00Z", commissionRate: 15, avatar: "DM", avatarBg: "bg-amber-100 text-amber-700",
      stats: { clicks: 342, referrals: 3, activePaid: 1, totalEarned: 280, pendingPayout: 0, conversionRate: 0.87 },
      referredCrews: [
        { name: "Miller Plumbing Co", trade: "Plumbing", date: "June 20, 2026", status: "Active Paid", plan: "Starter Plan", seats: 4, commission: "+$35.00/mo" },
        { name: "Quick Fix HVAC", trade: "HVAC", date: "June 25, 2026", status: "Churned", plan: "Lite Plan", seats: 2, commission: "Voided" },
        { name: "Evergreen Landscaping", trade: "Landscaping", date: "July 01, 2026", status: "Trial Period", plan: "Growth Plan", seats: 7, commission: "$0.00" },
      ],
    },
    {
      id: "5", name: "Linda Torres", email: "linda@torresgroup.com", company: "Torres Trade Consulting",
      code: "TORRES25", website: "https://torresgroup.com", status: "approved", manager: "Lead Account Manager",
      created_at: "2026-06-28T09:15:00Z", commissionRate: 20, avatar: "LT", avatarBg: "bg-purple-100 text-purple-700",
      stats: { clicks: 876, referrals: 6, activePaid: 4, totalEarned: 1920, pendingPayout: 440, conversionRate: 2.16 },
      referredCrews: [
        { name: "Torres Electric LLC", trade: "Electrical", date: "July 05, 2026", status: "Active Paid", plan: "Growth Plan", seats: 10, commission: "+$95.00/mo" },
        { name: "Pacific Plumbing & Gas", trade: "Plumbing", date: "July 08, 2026", status: "Active Paid", plan: "Pro Plan", seats: 15, commission: "+$145.00/mo" },
        { name: "Sunshine HVAC", trade: "HVAC", date: "July 12, 2026", status: "Trial Period", plan: "Starter Plan", seats: 4, commission: "$0.00" },
        { name: "Valley Landscaping Inc", trade: "Landscaping", date: "July 14, 2026", status: "Active Paid", plan: "Growth Plan", seats: 8, commission: "+$85.00/mo" },
      ],
    },
  ]);

  const handleApproveAffiliate = (id: string) => {
    setAffiliatesList((prev) =>
      prev.map((aff) => (aff.id === id ? { ...aff, status: "approved" } : aff))
    );
    toast.success("Affiliate application approved successfully!");
  };

  const handleReactivateAffiliate = (id: string) => {
    setAffiliatesList((prev) =>
      prev.map((aff) => (aff.id === id ? { ...aff, status: "approved" } : aff))
    );
    toast.success("Affiliate account reactivated!");
  };

  const handleSuspendAffiliate = (id: string) => {
    setAffiliatesList((prev) =>
      prev.map((aff) => (aff.id === id ? { ...aff, status: "suspended" } : aff))
    );
    toast.success("Affiliate account suspended.");
  };

  const handleAssignManager = (id: string, managerName: string) => {
    setAffiliatesList((prev) =>
      prev.map((aff) => (aff.id === id ? { ...aff, manager: managerName } : aff))
    );
    toast.success(`Assigned ${managerName} as affiliate manager.`);
  };

  const handleCopyAffCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedAffCode(code);
    toast.success(`Referral code "${code}" copied to clipboard`);
    setTimeout(() => setCopiedAffCode(null), 2000);
  };

  const selectedAffiliate = affiliatesList.find((a) => a.id === selectedAffiliateId);

  const filteredAffiliates = affiliatesList.filter((aff) => {
    const matchSearch =
      aff.name.toLowerCase().includes(affiliateSearch.toLowerCase()) ||
      aff.company.toLowerCase().includes(affiliateSearch.toLowerCase()) ||
      aff.code.toLowerCase().includes(affiliateSearch.toLowerCase()) ||
      aff.email.toLowerCase().includes(affiliateSearch.toLowerCase());
    const matchStatus = affiliateStatusFilter === "all" || aff.status === affiliateStatusFilter;
    return matchSearch && matchStatus;
  });

  const affiliateTotals = {
    total: affiliatesList.length,
    pending: affiliatesList.filter((a) => a.status === "pending").length,
    approved: affiliatesList.filter((a) => a.status === "approved").length,
    suspended: affiliatesList.filter((a) => a.status === "suspended").length,
    totalReferrals: affiliatesList.reduce((sum, a) => sum + a.stats.referrals, 0),
    totalEarnings: affiliatesList.reduce((sum, a) => sum + a.stats.totalEarned, 0),
    totalPending: affiliatesList.reduce((sum, a) => sum + a.stats.pendingPayout, 0),
  };

  // Check if current user is listed in platform_admins
  useEffect(() => {
    if (!user) {
      setIsSuperadmin(false);
      setCheckingAdmin(false);
      return;
    }

    const checkSuperadmin = async () => {
      try {
        const { data, error } = await supabase
          .from("platform_admins")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        setIsSuperadmin(!!data);
      } catch (err) {
        console.error("Superadmin verification error:", err);
        setIsSuperadmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkSuperadmin();
  }, [user]);

  // 1. Fetch Platform Stats (all companies)
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["superadmin_stats"],
    queryFn: async () => {
      const { count: companyCount } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true });

      const { count: staffCount } = await supabase
        .from("staff_profiles")
        .select("*", { count: "exact", head: true });

      const { count: geofenceCount } = await supabase
        .from("geofences")
        .select("*", { count: "exact", head: true });

      const { count: eventsCount } = await supabase
        .from("geofence_events")
        .select("*", { count: "exact", head: true });

      return {
        companies: companyCount || 0,
        staff: staffCount || 0,
        geofences: geofenceCount || 0,
        events: eventsCount || 0,
      };
    },
    enabled: !!isSuperadmin,
  });

  // Fetch signup_mode platform setting
  const { data: signupMode = "founders_partner" } = useQuery({
    queryKey: ["platform_signup_mode"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("platform_settings")
        .select("value")
        .eq("key", "signup_mode")
        .maybeSingle();
      if (error) throw error;
      return data?.value || "founders_partner";
    },
    enabled: !!isSuperadmin,
  });

  const toggleSignupModeMutation = useMutation({
    mutationFn: async (newMode: string) => {
      const { error } = await (supabase as any)
        .from("platform_settings")
        .upsert({ key: "signup_mode", value: newMode, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform_signup_mode"] });
      toast.success("Platform signup mode updated!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update signup mode");
    }
  });

  const approveCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const now = new Date().toISOString();
      const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("companies")
        .update({
          subscription_status: "active",
          subscription_tier: "Founding Partner",
          subscription_started_at: now,
          subscription_ends_at: oneYearLater,
          max_admin_seats: 20,
          max_field_crew_seats: 20
        })
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin_companies"] });
      toast.success("Company application approved successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to approve company");
    }
  });

  // 2. Fetch Companies List with Staff Counts joined
  const { data: companies = [], isLoading: isLoadingCompanies, refetch: refetchCompanies } = useQuery({
    queryKey: ["superadmin_companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select(`
          id,
          name,
          prefix,
          created_at,
          auth_user_id,
          subscription_tier,
          subscription_status,
          subscription_started_at,
          subscription_ends_at,
          max_admin_seats,
          max_field_crew_seats,
          address,
          annual_revenue,
          currency,
          enabled_modules,
          industry,
          staff_count,
          website,
          staff_profiles(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((c: any) => ({
        ...c,
        staff_profiles: Array.isArray(c.staff_profiles) ? c.staff_profiles : [],
      })) as Company[];
    },
    enabled: !!isSuperadmin,
  });

  // 3. Fetch Platform Users List
  const { data: platformUsers = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ["superadmin_users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select(`
          id,
          auth_user_id,
          full_name,
          username,
          global_role,
          job_title,
          is_active,
          email,
          phone,
          address,
          created_at,
          company:companies(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any as StaffUser[];
    },
    enabled: !!isSuperadmin,
  });

  // 4. Fetch Platform Admins List
  const { data: platformAdmins = [], isLoading: isLoadingAdmins, refetch: refetchAdmins } = useQuery({
    queryKey: ["superadmin_platform_admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_admins")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PlatformAdmin[];
    },
    enabled: !!isSuperadmin,
  });

  // 5. Delete Company Action
  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`Are you absolutely sure you want to delete "${companyName}"? This will delete all staff, shifts, geofences, and locations. This action is irreversible.`)) {
      return;
    }

    try {
      const { error } = await supabase.from("companies").delete().eq("id", companyId);
      if (error) throw error;

      toast.success(`Company "${companyName}" deleted`);
      refetchCompanies();
      queryClient.invalidateQueries({ queryKey: ["superadmin_stats"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete company");
    }
  };

  // 6. Toggle User Active Status Mutation
  const toggleUserActiveMutation = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { error } = await supabase
        .from("staff_profiles")
        .update({ is_active: active })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin_users"] });
      toast.success("User status updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update user status");
    },
  });

  // Edit User Profile & Password Mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({
      userId,
      authUserId,
      fullName,
      username,
      jobTitle,
      globalRole,
      email,
      phone,
      address,
      newPassword,
    }: {
      userId: string;
      authUserId: string | null;
      fullName: string;
      username: string;
      jobTitle: string;
      globalRole: string;
      email?: string;
      phone?: string;
      address?: string;
      newPassword?: string;
    }) => {
      // 1. Update staff profile details
      const { error: profileErr } = await supabase
        .from("staff_profiles")
        .update({
          full_name: fullName,
          username: username.toUpperCase(),
          job_title: jobTitle,
          global_role: globalRole,
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          address: address?.trim() || null,
        })
        .eq("id", userId);
      if (profileErr) throw profileErr;

      // 2. Update password if provided
      if (newPassword && newPassword.trim().length > 0) {
        if (!authUserId) {
          throw new Error("Cannot reset password for a user without an auth link");
        }
        const { data, error: funcErr } = await supabase.functions.invoke("superadmin_manage_user", {
          body: {
            action: "update_password",
            target_user_id: authUserId,
            password: newPassword.trim(),
          },
        });
        if (funcErr || (data && data.error)) {
          throw new Error(funcErr?.message || data?.error || "Failed to update user password");
        }
      }
    },
    onSuccess: () => {
      refetchUsers();
      setEditingUser(null);
      toast.success("User profile updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update user profile");
    },
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (authUserId: string) => {
      const { data, error: funcErr } = await supabase.functions.invoke("superadmin_manage_user", {
        body: {
          action: "delete_user",
          target_user_id: authUserId,
        },
      });
      if (funcErr || (data && data.error)) {
        throw new Error(funcErr?.message || data?.error || "Failed to delete user");
      }
    },
    onSuccess: () => {
      refetchUsers();
      toast.success("User account deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["superadmin_stats"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete user account");
    },
  });

  const handleDeleteUser = (authUserId: string | null, fullName: string) => {
    if (!authUserId) {
      toast.error("Cannot delete a user that is not linked to auth credentials.");
      return;
    }
    if (confirm(`Are you absolutely sure you want to permanently delete user "${fullName}"? This will delete their shift records, geofence logs, and auth identity.`)) {
      deleteUserMutation.mutate(authUserId);
    }
  };

  // 7. Add Platform Admin Mutation
  const addAdminMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!targetUserId.trim()) throw new Error("User ID is required");
      const { error } = await supabase
        .from("platform_admins")
        .insert({ user_id: targetUserId.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin_platform_admins"] });
      setNewAdminUserId("");
      toast.success("New platform admin added");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add admin");
    },
  });

  // 8. Remove Platform Admin Mutation
  const removeAdminMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (targetUserId === user?.id) {
        throw new Error("You cannot remove yourself as platform admin.");
      }
      const { error } = await supabase
        .from("platform_admins")
        .delete()
        .eq("user_id", targetUserId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin_platform_admins"] });
      toast.success("Platform admin removed");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove admin");
    },
  });

  // 9. Update Subscription Mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({
      companyId,
      tier,
      status,
      maxAdmins,
      maxFieldCrew,
      subStartDate,
      subEndDate,
    }: {
      companyId: string;
      tier: string;
      status: string;
      maxAdmins: number;
      maxFieldCrew: number;
      subStartDate: string;
      subEndDate: string;
    }) => {
      const updatePayload: any = {
        subscription_tier: tier,
        subscription_status: status,
        max_admin_seats: maxAdmins,
        max_field_crew_seats: maxFieldCrew,
      };
      if (subStartDate) updatePayload.subscription_started_at = new Date(subStartDate).toISOString();
      if (subEndDate) updatePayload.subscription_ends_at = new Date(subEndDate).toISOString();
      const { error } = await supabase
        .from("companies")
        .update(updatePayload)
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin_companies"] });
      toast.success("Subscription details updated");
      setEditingCompanyId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update subscription details");
    },
  });

  // Computed Financial & Segmentation Metrics
  const councilCompanies = companies.filter((c) =>
    c.subscription_tier === "Founding Partner" || c.subscription_tier === "founding_partner"
  );
  const paidCompanies = companies.filter((c) =>
    c.subscription_tier !== "free_trial" && c.subscription_tier !== "Free"
  );
  const trialCompanies = companies.filter((c) =>
    c.subscription_tier === "free_trial" || c.subscription_tier === "Free"
  );
  const pendingCompanies = companies.filter((c) =>
    c.subscription_status === "pending_approval"
  );

  const estimatedMRR = companies.reduce((acc, c) => {
    const tier = c.subscription_tier;
    if (tier === "Founding Partner" || tier === "founding_partner") return acc + 241.58;
    if (tier === "growth") return acc + 495;
    if (tier === "enterprise") return acc + 1200;
    return acc;
  }, 0);

  const estimatedARR = estimatedMRR * 12;

  // Filtered lists
  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.prefix.toLowerCase().includes(companySearch.toLowerCase()) ||
      (c.industry || "").toLowerCase().includes(companySearch.toLowerCase()) ||
      (c.auth_user_id || "").toLowerCase().includes(companySearch.toLowerCase());

    if (!matchesSearch) return false;

    if (companyTierFilter === "council") {
      return c.subscription_tier === "Founding Partner" || c.subscription_tier === "founding_partner";
    }
    if (companyTierFilter === "paid") {
      return c.subscription_tier !== "free_trial" && c.subscription_tier !== "Free";
    }
    if (companyTierFilter === "trial") {
      return c.subscription_tier === "free_trial" || c.subscription_tier === "Free";
    }
    if (companyTierFilter === "pending") {
      return c.subscription_status === "pending_approval";
    }
    return true;
  });

  const filteredUsers = platformUsers.filter((u) =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.company?.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (checkingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSuperadmin === false) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b bg-background px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <img src="/favicon.png" alt="FiledCrews" className="h-8 w-8 rounded-lg shadow-sm" />
          <span className="font-extrabold text-xl tracking-tight text-foreground">FiledCrews Control Plane</span>
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 ml-1 text-[10px] font-bold uppercase tracking-wider">
            Superadmin
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Client Dashboard
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-destructive hover:bg-destructive/10">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main container wrapper */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            FiledCrews Platform Intelligence
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enterprise control plane for monitoring tenants, subscriptions, workforce capacity, and platform operations.
          </p>
        </div>

        {/* Global Statistics & Telemetry Bar (2026 Enterprise Console Design) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60 shadow-sm bg-card hover:shadow-md transition-all relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Tenancies</CardTitle>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Building2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <div>
                  <div className="text-3xl font-extrabold text-foreground tracking-tight">{stats?.companies}</div>
                  <div className="flex items-center gap-2 mt-2 text-[11px] font-medium text-muted-foreground">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{paidCompanies.length} Paid</span>
                    <span>·</span>
                    <span>{trialCompanies.length} Trial</span>
                    {pendingCompanies.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{pendingCompanies.length} Waitlist</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card hover:shadow-md transition-all relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Est. Platform MRR / ARR</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <div>
                  <div className="text-3xl font-extrabold text-foreground tracking-tight">${Math.round(estimatedMRR).toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> ARR: ${Math.round(estimatedARR).toLocaleString()}/yr
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/[0.04] via-card to-card shadow-sm hover:shadow-md transition-all relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">Founding Partner Council</CardTitle>
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Crown className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <div>
                  <div className="text-3xl font-extrabold text-foreground tracking-tight flex items-baseline gap-1">
                    <span>{councilCompanies.length}</span>
                    <span className="text-xs font-semibold text-muted-foreground">/ 20 Slots</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-2">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${(councilCompanies.length / 20) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">{20 - councilCompanies.length} Council seats available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card hover:shadow-md transition-all relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Workforce</CardTitle>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <div>
                  <div className="text-3xl font-extrabold text-foreground tracking-tight">{stats?.staff}</div>
                  <p className="text-[11px] font-medium text-muted-foreground mt-1">
                    {stats?.geofences} Geofences · {stats?.events} GPS Events
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Global Platform Signup Configuration */}
        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Settings className="h-4.5 w-4.5 text-primary" />
              Global Platform Signup Configuration
            </CardTitle>
            <CardDescription>
              Toggle how new signups are onboarded. Founding Partner Council mode restricts new organizations behind a waitlist approval wall. Lite Mode allows immediate setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Active Signup Mode</p>
              <Badge variant="outline" className={signupMode === "founders_partner" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-green-500/10 text-green-500 border-green-500/20"}>
                {signupMode === "founders_partner" ? "Founding Partner Council (Manual Vetting)" : "Lite Mode (Instant Self-Service Wizard)"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Toggle Mode:</span>
              <Button
                variant={signupMode === "founders_partner" ? "default" : "outline"}
                size="sm"
                disabled={toggleSignupModeMutation.isPending}
                onClick={() => toggleSignupModeMutation.mutate(signupMode === "founders_partner" ? "lite" : "founders_partner")}
                className="gap-2"
              >
                {toggleSignupModeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Switch to {signupMode === "founders_partner" ? "Lite Mode" : "Founding Partner Council Mode"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Superadmin Tab Section */}
        <Tabs defaultValue="tenants" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-[850px] bg-background border border-border/50 shadow-sm">
            <TabsTrigger value="tenants" className="text-xs font-bold">Companies (Tenants)</TabsTrigger>
            <TabsTrigger value="council" className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5" /> Founding Council ({councilCompanies.length}/20)
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs font-bold">Platform Users</TabsTrigger>
            <TabsTrigger value="admins" className="text-xs font-bold">System Admins</TabsTrigger>
            <TabsTrigger value="affiliates" className="text-xs font-bold">Affiliates & Partners</TabsTrigger>
          </TabsList>

          {/* Tenants tab */}
          <TabsContent value="tenants">
            <Card className="border-border/50 card-shadow-md">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4 border-b">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Active SaaS Tenants
                  </CardTitle>
                  <CardDescription>
                    Monitor and review all companies using the FiledCrews platform.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search company, prefix, or industry..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="pl-9 bg-background"
                  />
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-4">
                {/* Subscription Segmentation Filter Chips Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-muted/30 border border-border/40 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5 font-semibold">
                    <span className="text-muted-foreground mr-1 flex items-center gap-1"><Filter className="h-3.5 w-3.5" /> Filter Tier:</span>
                    <button
                      onClick={() => setCompanyTierFilter("all")}
                      className={cn(
                        "px-3 py-1 rounded-lg transition-colors",
                        companyTierFilter === "all" ? "bg-primary text-primary-foreground font-bold shadow-xs" : "bg-background text-muted-foreground hover:text-foreground border border-border/40"
                      )}
                    >
                      All Orgs ({companies.length})
                    </button>
                    <button
                      onClick={() => setCompanyTierFilter("council")}
                      className={cn(
                        "px-3 py-1 rounded-lg transition-colors flex items-center gap-1",
                        companyTierFilter === "council" ? "bg-amber-500 text-slate-950 font-bold shadow-xs" : "bg-background text-amber-600 dark:text-amber-400 hover:text-foreground border border-amber-500/30"
                      )}
                    >
                      <Crown className="h-3 w-3" /> Council VIP ({councilCompanies.length})
                    </button>
                    <button
                      onClick={() => setCompanyTierFilter("paid")}
                      className={cn(
                        "px-3 py-1 rounded-lg transition-colors",
                        companyTierFilter === "paid" ? "bg-emerald-600 text-white font-bold shadow-xs" : "bg-background text-muted-foreground hover:text-foreground border border-border/40"
                      )}
                    >
                      Paid ({paidCompanies.length})
                    </button>
                    <button
                      onClick={() => setCompanyTierFilter("trial")}
                      className={cn(
                        "px-3 py-1 rounded-lg transition-colors",
                        companyTierFilter === "trial" ? "bg-blue-600 text-white font-bold shadow-xs" : "bg-background text-muted-foreground hover:text-foreground border border-border/40"
                      )}
                    >
                      Free Trial ({trialCompanies.length})
                    </button>
                    {pendingCompanies.length > 0 && (
                      <button
                        onClick={() => setCompanyTierFilter("pending")}
                        className={cn(
                          "px-3 py-1 rounded-lg transition-colors flex items-center gap-1 animate-pulse",
                          companyTierFilter === "pending" ? "bg-rose-600 text-white font-bold shadow-xs" : "bg-rose-500/10 text-rose-600 border border-rose-500/30"
                        )}
                      >
                        Waitlist ({pendingCompanies.length})
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">Showing {filteredCompanies.length} organizations</span>
                </div>

                <PaginatedTableFull
                  data={filteredCompanies}
                  renderTable={(paginatedItems) => (
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead>Registration Date</TableHead>
                          <TableHead>Company Name</TableHead>
                          <TableHead>Prefix</TableHead>
                          <TableHead>Active Crew Size</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Office Seats</TableHead>
                          <TableHead>Crew Seats</TableHead>
                          <TableHead>Owner Email</TableHead>
                          <TableHead className="w-[120px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingCompanies ? (
                          <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                            </TableCell>
                          </TableRow>
                        ) : paginatedItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground text-sm">
                              No companies match search or filter criteria.
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedItems.map((c) => (
                            <TableRow key={c.id} className="hover:bg-muted/15 transition-colors cursor-pointer" onClick={() => setSelectedCompany360(c)}>
                              <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(c.created_at), "yyyy-MM-dd HH:mm")}
                              </TableCell>
                              <TableCell className="font-bold text-foreground">
                                {c.name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono uppercase tracking-wider text-[10px] bg-secondary/30">
                                  {c.prefix}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold text-sm">
                                {c.staff_profiles?.length || 0} members
                              </TableCell>
                              <TableCell className="space-y-1">
                                <div>
                                  <Badge
                                    variant={c.subscription_tier === "Founding Partner" || c.subscription_tier === "founding_partner" ? "default" : "outline"}
                                    className={
                                      c.subscription_tier === "Founding Partner" || c.subscription_tier === "founding_partner"
                                        ? "bg-amber-500 text-slate-950 border-none font-bold"
                                        : "font-semibold"
                                    }
                                  >
                                    {c.subscription_tier}
                                  </Badge>
                                </div>
                                {c.subscription_status === "pending_approval" ? (
                                  <div>
                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold text-[9px] px-1.5 py-0.5 animate-pulse uppercase tracking-wider">
                                      Waitlisted
                                    </Badge>
                                  </div>
                                ) : (
                                  <div>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 font-semibold text-[9px] px-1.5 py-0.5 uppercase tracking-wider">
                                      {c.subscription_status}
                                    </Badge>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-xs font-semibold">
                                {c.max_admin_seats} seats
                              </TableCell>
                              <TableCell className="font-mono text-xs font-semibold">
                                {c.max_field_crew_seats} seats
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground truncate max-w-[180px]">
                                {(() => {
                                  const ownerProfile = c.staff_profiles?.find((s: any) => s.auth_user_id === c.auth_user_id);
                                  return ownerProfile?.email || <span className="italic">No email</span>;
                                })()}
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                    onClick={() => setSelectedCompany360(c)}
                                    title="View 360° Profile & Roster"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {c.subscription_status === "pending_approval" && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs gap-1 px-2.5 py-1 h-auto shrink-0"
                                      onClick={() => approveCompanyMutation.mutate(c.id)}
                                      disabled={approveCompanyMutation.isPending}
                                    >
                                      {approveCompanyMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                                      Approve
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                      setEditingCompanyId(c.id);
                                      setEditTier(c.subscription_tier);
                                      setEditStatus(c.subscription_status);
                                      setEditMaxAdmins(c.max_admin_seats);
                                      setEditMaxFieldCrew(c.max_field_crew_seats);
                                      setEditSubStartDate(c.subscription_started_at ? new Date(c.subscription_started_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                                      setEditSubEndDate(c.subscription_ends_at ? new Date(c.subscription_ends_at).toISOString().split('T')[0] : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                                    }}
                                    title="Edit Subscription"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50/50"
                                    onClick={() => handleDeleteCompany(c.id, c.name)}
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
          </TabsContent>

          {/* Founding Partner Council Hub Tab */}
          <TabsContent value="council" className="space-y-6">
            {/* Slot Occupancy Hero Gauge */}
            <Card className="border-amber-500/40 bg-gradient-to-r from-amber-500/[0.08] via-amber-500/[0.03] to-amber-500/[0.08] shadow-md">
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Crown className="h-6 w-6 text-amber-500" />
                    <h2 className="text-2xl font-black text-foreground tracking-tight">Founding Partner Council Hub</h2>
                    <Badge className="bg-amber-500 text-slate-950 font-bold border-none text-xs">20 Slot Cap</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                    Exclusive invitation-only charter for 20 home service leaders. Council members receive 20 unified licenses, white-glove onboarding, and direct WhatsApp co-design access.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-card border border-amber-500/30 text-center shrink-0 w-full sm:w-56 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Slots Claimed</span>
                  <div className="text-3xl font-black text-foreground flex items-baseline justify-center gap-1">
                    <span>{councilCompanies.length}</span>
                    <span className="text-xs font-semibold text-muted-foreground">/ 20</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${(councilCompanies.length / 20) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-semibold">{20 - councilCompanies.length} Open Slots Remaining</p>
                </div>
              </CardContent>
            </Card>

            {/* Approved Founding Partner Council Roster */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Approved Founding Partner Council Members ({councilCompanies.length})
                </CardTitle>
                <CardDescription>
                  Companies currently enrolled in the Founding Partner Council with active $2,899/yr memberships.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {councilCompanies.length === 0 ? (
                  <div className="text-center p-8 border border-dashed rounded-2xl space-y-2">
                    <Crown className="h-8 w-8 text-amber-500/40 mx-auto" />
                    <p className="text-sm font-semibold text-foreground">No Approved Founding Partners Yet</p>
                    <p className="text-xs text-muted-foreground">Approve waitlisted applications below to enroll companies into the Council.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {councilCompanies.map((c) => (
                      <div key={c.id} className="p-5 rounded-2xl bg-card border border-amber-500/30 hover:border-amber-500/60 shadow-xs transition-all space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-base text-foreground">{c.name}</h3>
                              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold">
                                {c.prefix}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{c.industry || "Home Service Provider"} · {c.staff_count || "20 Seats"}</p>
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] font-bold">
                            VIP Active
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/40">
                          <div>
                            <span className="text-muted-foreground">Office Seats:</span>
                            <p className="font-bold text-foreground">{c.max_admin_seats} Seats</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Field Seats:</span>
                            <p className="font-bold text-foreground">{c.max_field_crew_seats} Seats</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCompany360(c)}
                            className="text-xs font-semibold gap-1.5 h-8"
                          >
                            <Eye className="h-3.5 w-3.5" /> View 360° Profile
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-semibold h-8"
                          >
                            <a href="https://wa.me/14094229714" target="_blank" rel="noreferrer" className="flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5" /> Founder WhatsApp
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Waitlisted Applicant Queue */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Founding Partner Waitlist Queue ({pendingCompanies.length})
                </CardTitle>
                <CardDescription>
                  Organizations that submitted applications during signup awaiting superadmin verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {pendingCompanies.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-4 text-center border border-dashed rounded-xl">
                    No pending waitlist applications at this time.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingCompanies.map((c) => (
                      <div key={c.id} className="p-4 rounded-xl bg-card border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{c.name}</span>
                            <Badge variant="outline" className="font-mono text-[10px]">{c.prefix}</Badge>
                            <Badge className="bg-amber-500/10 text-amber-600 text-[10px]">Waitlisted</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Size: <strong className="text-foreground">{c.staff_count || "Not listed"}</strong> · Industry: <strong className="text-foreground">{c.industry || "General"}</strong> · Registered: {format(new Date(c.created_at), "PPP")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCompany360(c)}
                            className="text-xs font-semibold"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Inspect
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs gap-1.5"
                            onClick={() => approveCompanyMutation.mutate(c.id)}
                            disabled={approveCompanyMutation.isPending}
                          >
                            {approveCompanyMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                            Approve for Council (20 Seats)
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Users tab */}
          <TabsContent value="users">
            <Card className="border-border/50 card-shadow-md">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4 border-b">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Platform User Directory
                  </CardTitle>
                  <CardDescription>
                    Enable, disable, or audit status flags for user profiles.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, username, company..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 bg-background"
                  />
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <PaginatedTableFull
                  data={filteredUsers}
                  renderTable={(paginatedItems) => (
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead>Created At</TableHead>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>System Role</TableHead>
                          <TableHead>Job Title</TableHead>
                          <TableHead>Active Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingUsers ? (
                          <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                            </TableCell>
                          </TableRow>
                        ) : paginatedItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground text-sm">
                              No platform user accounts found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedItems.map((u) => (
                            <TableRow key={u.id} className="hover:bg-muted/15 transition-colors">
                              <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(u.created_at), "yyyy-MM-dd HH:mm")}
                              </TableCell>
                              <TableCell>
                                <div className="font-bold text-foreground">{u.full_name}</div>
                                {(u.email || u.phone || u.address) && (
                                  <div className="flex flex-col gap-0.5 mt-0.5 text-[10px] text-muted-foreground">
                                    {u.email && <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {u.email}</span>}
                                    {u.phone && <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {u.phone}</span>}
                                    {u.address && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {u.address}</span>}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                @{u.username}
                              </TableCell>
                              <TableCell className="font-semibold text-sm">
                                {u.company?.name || "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px] font-bold">
                                  {u.global_role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground italic">
                                {u.job_title || "None"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={u.is_active}
                                    onCheckedChange={(checked) =>
                                      toggleUserActiveMutation.mutate({ userId: u.id, active: checked })
                                    }
                                    disabled={toggleUserActiveMutation.isPending}
                                  />
                                  <span className={`text-[10px] font-bold ${u.is_active ? "text-emerald-500" : "text-rose-500"}`}>
                                    {u.is_active ? "Active" : "Disabled"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end items-center gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground h-7 w-7"
                                    onClick={() => handleOpenEditUser(u)}
                                    title="Edit Profile"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 h-7 w-7"
                                    onClick={() => handleDeleteUser(u.auth_user_id, u.full_name)}
                                    title="Delete User"
                                    disabled={deleteUserMutation.isPending}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
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
          </TabsContent>

          <TabsContent value="admins">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Add Admin Panel */}
              <Card className="border-border/50 shadow-sm bg-card lg:col-span-1 h-fit">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Designate System Admin
                  </CardTitle>
                  <CardDescription>
                    Add a User ID (from Supabase Auth users list) as a platform operator.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addAdminMutation.mutate(newAdminUserId);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Auth User UUID</label>
                      <Input
                        placeholder="e.g. 5b0bf810-5efa-4dbb-a8bf-..."
                        value={newAdminUserId}
                        onChange={(e) => setNewAdminUserId(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={addAdminMutation.isPending}
                      className="w-full gap-1.5"
                    >
                      {addAdminMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Add System Admin
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Admins Table */}
              <Card className="border-border/50 shadow-sm bg-card lg:col-span-2">
                <CardHeader className="border-b border-border/50 pb-4">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Operator Directory
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingAdmins ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : platformAdmins.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No system admin designations registered.
                    </p>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {platformAdmins.map((a) => (
                        <div key={a.user_id} className="flex items-center justify-between p-4 hover:bg-muted/5 transition-colors">
                          <div className="space-y-1">
                            <p className="font-mono text-xs text-foreground font-bold">
                              User ID: {a.user_id}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Designated on: {format(new Date(a.created_at), "yyyy-MM-dd HH:mm")}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50/50"
                            onClick={() => removeAdminMutation.mutate(a.user_id)}
                            disabled={removeAdminMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Affiliates & Partners Tab */}
          <TabsContent value="affiliates">
            <div className="space-y-6">

              {/* ─── Affiliate Program KPI Summary ─── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Partners", value: affiliateTotals.total, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                  { label: "Pending Applications", value: affiliateTotals.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
                  { label: "Total Referrals Made", value: affiliateTotals.totalReferrals, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  { label: "Total Commissions Paid", value: `$${affiliateTotals.totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-purple-500", bg: "bg-purple-500/10" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <Card key={label} className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">{label}</CardTitle>
                      <div className={`p-2 rounded-lg ${bg} ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-black text-foreground">{value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ─── Affiliate Partner Management Table ─── */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4 border-b">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Affiliate & Referral Partner Network
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Review applications, view partner performance, track referrals, manage commissions, and assign managers.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search partners..."
                        value={affiliateSearch}
                        onChange={(e) => setAffiliateSearch(e.target.value)}
                        className="pl-9 h-9 text-xs w-full sm:w-56"
                      />
                    </div>
                    <div className="flex gap-1">
                      {[
                        { id: "all", label: "All" },
                        { id: "pending", label: `Pending (${affiliateTotals.pending})` },
                        { id: "approved", label: "Active" },
                        { id: "suspended", label: "Suspended" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setAffiliateStatusFilter(f.id)}
                          className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all ${
                            affiliateStatusFilter === f.id
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 480px)", minHeight: "280px" }}>
                    <Table>
                      <TableHeader className="bg-muted/30 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider pl-5">Partner</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider">Promo Code</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider">Status</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider text-center">Referrals</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider text-center">Clicks</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider text-right">Earned</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider">Manager</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-wider text-right pr-5">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAffiliates.map((aff) => (
                          <TableRow key={aff.id} className="hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => setSelectedAffiliateId(aff.id)}>
                            <TableCell className="pl-5">
                              <div className="flex items-center gap-3">
                                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${aff.avatarBg} group-hover:scale-105 transition-transform`}>
                                  {aff.avatar}
                                </span>
                                <div className="min-w-0">
                                  <span className="font-bold text-xs text-foreground block truncate max-w-[160px]">{aff.name}</span>
                                  <span className="text-[10px] text-muted-foreground truncate block max-w-[160px]">{aff.company}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/50 px-2 py-0.5 rounded">
                                  {aff.code}
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCopyAffCode(aff.code); }}
                                  className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                  {copiedAffCode === aff.code ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                </button>
                              </div>
                            </TableCell>
                            <TableCell>
                              {aff.status === "approved" ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold uppercase tracking-wider">
                                  Active
                                </Badge>
                              ) : aff.status === "pending" ? (
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                  Pending
                                </Badge>
                              ) : (
                                <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[9px] font-bold uppercase tracking-wider">
                                  Suspended
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center justify-center h-7 min-w-[28px] px-1 rounded-lg bg-muted/50 border border-border/40 text-xs font-bold text-foreground">
                                {aff.stats.referrals}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-xs font-semibold text-muted-foreground">{aff.stats.clicks.toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`text-xs font-bold ${aff.stats.totalEarned > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                                ${aff.stats.totalEarned.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="w-40" onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={aff.manager}
                                  onValueChange={(val) => handleAssignManager(aff.id, val)}
                                >
                                  <SelectTrigger className="h-7 text-[10px] border-stone-200 focus:ring-primary rounded-lg">
                                    <SelectValue placeholder="Assign..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background border-stone-200">
                                    <SelectItem value="Unassigned">Unassigned</SelectItem>
                                    <SelectItem value="Operator Admin">Operator Admin</SelectItem>
                                    <SelectItem value="Lead Account Manager">Lead Account Manager</SelectItem>
                                    <SelectItem value="Head of Partnerships">Head of Partnerships</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-5">
                              <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedAffiliateId(aff.id)}
                                  className="h-7 px-2 text-[10px] font-semibold rounded-lg gap-1"
                                >
                                  <Eye className="h-3 w-3" /> View
                                </Button>
                                {aff.status === "pending" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveAffiliate(aff.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold rounded-lg h-7 px-2.5"
                                  >
                                    Approve
                                  </Button>
                                )}
                                {aff.status === "approved" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSuspendAffiliate(aff.id)}
                                    className="border-stone-200 text-rose-600 hover:bg-rose-50 text-[10px] font-semibold rounded-lg h-7 px-2.5"
                                  >
                                    Suspend
                                  </Button>
                                )}
                                {aff.status === "suspended" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleReactivateAffiliate(aff.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold rounded-lg h-7 px-2.5"
                                  >
                                    Reactivate
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredAffiliates.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12">
                              <div className="space-y-2">
                                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                                <p className="text-sm font-semibold text-muted-foreground">No affiliates match your search</p>
                                <p className="text-xs text-muted-foreground/60">Try adjusting filters or search terms</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="border-t border-border/40 px-5 py-3 flex items-center justify-between bg-muted/20">
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      Showing {filteredAffiliates.length} of {affiliatesList.length} partners ·
                      Total pending payout: <span className="text-amber-600 font-bold">${affiliateTotals.totalPending.toLocaleString()}</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ─── Affiliate Detail View Dialog ─── */}
            <Dialog open={!!selectedAffiliateId} onOpenChange={(open) => !open && setSelectedAffiliateId(null)}>
              <DialogContent className="sm:max-w-3xl bg-background max-h-[90vh] overflow-hidden flex flex-col">
                {selectedAffiliate && (
                  <>
                    <DialogHeader className="pb-4 border-b shrink-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${selectedAffiliate.avatarBg}`}>
                            {selectedAffiliate.avatar}
                          </span>
                          <div>
                            <DialogTitle className="text-base font-bold">{selectedAffiliate.name}</DialogTitle>
                            <DialogDescription className="text-xs">
                              {selectedAffiliate.company} · {selectedAffiliate.email}
                            </DialogDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {selectedAffiliate.status === "approved" ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold uppercase">Active</Badge>
                          ) : selectedAffiliate.status === "pending" ? (
                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold uppercase">Pending</Badge>
                          ) : (
                            <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold uppercase">Suspended</Badge>
                          )}
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="overflow-y-auto flex-1 space-y-5 py-4 pr-1">
                      {/* Partner Info Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Promo Code</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono font-bold text-amber-700">{selectedAffiliate.code}</span>
                            <button onClick={() => handleCopyAffCode(selectedAffiliate.code)} className="text-muted-foreground hover:text-foreground">
                              {copiedAffCode === selectedAffiliate.code ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Commission Rate</span>
                          <span className="text-xs font-bold text-foreground block">{selectedAffiliate.commissionRate}%</span>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Joined</span>
                          <span className="text-xs font-semibold text-foreground block">{format(new Date(selectedAffiliate.created_at), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Website</span>
                          <a href={selectedAffiliate.website} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline truncate">
                            {selectedAffiliate.website.replace("https://", "")} <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          </a>
                        </div>
                      </div>

                      {/* Performance KPIs */}
                      <div>
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-3">
                          <BarChart3 className="h-3.5 w-3.5 text-primary" /> Performance Metrics
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {[
                            { label: "Clicks", value: selectedAffiliate.stats.clicks.toLocaleString(), icon: MousePointer },
                            { label: "Referrals", value: selectedAffiliate.stats.referrals, icon: Users },
                            { label: "Active Paid", value: selectedAffiliate.stats.activePaid, icon: UserCheck },
                            { label: "Conv. Rate", value: `${selectedAffiliate.stats.conversionRate}%`, icon: TrendingUp },
                            { label: "Total Earned", value: `$${selectedAffiliate.stats.totalEarned.toLocaleString()}`, icon: DollarSign },
                            { label: "Pending", value: `$${selectedAffiliate.stats.pendingPayout.toLocaleString()}`, icon: Clock },
                          ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="bg-muted/20 border border-border/40 rounded-xl p-2.5 text-center space-y-1">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                              <div className="text-sm font-black text-foreground">{value}</div>
                              <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Referred Crews Table */}
                      <div>
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-3">
                          <Building2 className="h-3.5 w-3.5 text-primary" /> Referred Crews ({selectedAffiliate.referredCrews.length})
                        </h4>
                        {selectedAffiliate.referredCrews.length > 0 ? (
                          <div className="rounded-xl border border-border/40 overflow-hidden">
                            <div className="overflow-auto" style={{ maxHeight: "300px" }}>
                              <Table>
                                <TableHeader className="bg-muted/30 sticky top-0 z-10">
                                  <TableRow>
                                    <TableHead className="text-[9px] font-bold uppercase tracking-wider">Crew Name</TableHead>
                                    <TableHead className="text-[9px] font-bold uppercase tracking-wider">Trade</TableHead>
                                    <TableHead className="text-[9px] font-bold uppercase tracking-wider">Date</TableHead>
                                    <TableHead className="text-[9px] font-bold uppercase tracking-wider">Plan</TableHead>
                                    <TableHead className="text-[9px] font-bold uppercase tracking-wider text-center">Seats</TableHead>
                                    <TableHead className="text-[9px] font-bold uppercase tracking-wider">Status</TableHead>
                                    <TableHead className="text-[9px] font-bold uppercase tracking-wider text-right">Commission</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedAffiliate.referredCrews.map((crew, idx) => (
                                    <TableRow key={idx} className="hover:bg-muted/10">
                                      <TableCell className="font-semibold text-xs text-foreground">{crew.name}</TableCell>
                                      <TableCell>
                                        <span className="text-[9px] font-semibold bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded">{crew.trade}</span>
                                      </TableCell>
                                      <TableCell className="text-xs text-muted-foreground">{crew.date}</TableCell>
                                      <TableCell>
                                        <span className="text-[9px] font-bold text-foreground">{crew.plan}</span>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-muted/50 text-[9px] font-bold">{crew.seats}</span>
                                      </TableCell>
                                      <TableCell>
                                        <Badge className={`text-[8px] font-bold uppercase tracking-wider ${
                                          crew.status === "Active Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                          crew.status === "Trial Period" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                                          crew.status === "Pending Setup" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                          "bg-rose-50 text-rose-600 border-rose-200"
                                        }`}>
                                          {crew.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <span className={`text-xs font-bold ${
                                          crew.commission.startsWith("+") ? "text-emerald-600" :
                                          crew.commission === "Voided" ? "text-rose-400 line-through" :
                                          "text-muted-foreground"
                                        }`}>
                                          {crew.commission}
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-border/40 rounded-xl py-8 text-center">
                            <Users className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-muted-foreground">No referrals yet</p>
                            <p className="text-[10px] text-muted-foreground/60">{selectedAffiliate.status === "pending" ? "This partner's application hasn't been approved yet" : "This partner hasn't made any referrals"}</p>
                          </div>
                        )}
                      </div>

                      {/* Management Actions */}
                      <div className="border-t border-border/40 pt-4">
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-3">
                          <Settings className="h-3.5 w-3.5 text-primary" /> Management Controls
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Assigned Manager</label>
                            <Select
                              value={selectedAffiliate.manager}
                              onValueChange={(val) => handleAssignManager(selectedAffiliate.id, val)}
                            >
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Assign manager..." />
                              </SelectTrigger>
                              <SelectContent className="bg-background">
                                <SelectItem value="Unassigned">Unassigned</SelectItem>
                                <SelectItem value="Operator Admin">Operator Admin</SelectItem>
                                <SelectItem value="Lead Account Manager">Lead Account Manager</SelectItem>
                                <SelectItem value="Head of Partnerships">Head of Partnerships</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Partner Status</label>
                            <div className="flex gap-2">
                              {selectedAffiliate.status !== "approved" && (
                                <Button
                                  size="sm"
                                  onClick={() => { handleApproveAffiliate(selectedAffiliate.id); }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex-1 h-9"
                                >
                                  <UserCheck className="h-3.5 w-3.5 mr-1" /> Approve
                                </Button>
                              )}
                              {selectedAffiliate.status === "approved" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { handleSuspendAffiliate(selectedAffiliate.id); }}
                                  className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg flex-1 h-9"
                                >
                                  <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Suspend
                                </Button>
                              )}
                              {selectedAffiliate.status === "suspended" && (
                                <Button
                                  size="sm"
                                  onClick={() => { handleReactivateAffiliate(selectedAffiliate.id); }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex-1 h-9"
                                >
                                  <UserCheck className="h-3.5 w-3.5 mr-1" /> Reactivate
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Subscription Modal Dialog */}
      <Dialog
        open={!!editingCompanyId}
        onOpenChange={(open) => !open && setEditingCompanyId(null)}
      >
        <DialogContent className="sm:max-w-lg bg-background">
          <DialogHeader>
            <DialogTitle>Update Tenancy Subscription & Seats</DialogTitle>
            <DialogDescription>
              Assign the active tier, subscription period, and maximum seat licenses allowed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Subscription Tier</label>
                <Select value={editTier} onValueChange={setEditTier}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free">Free Trial (Standard Limits)</SelectItem>
                    <SelectItem value="free_trial">Free Trial (Legacy)</SelectItem>
                    <SelectItem value="growth">Growth ($495/mo · 10 Seats)</SelectItem>
                    <SelectItem value="Founding Partner">Founding Partner Council ($2,899/yr · 20 Seats)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (Custom SLA · Unlimited)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Subscription Status</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trialing">Trialing</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval (Waitlisted)</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" /> Subscription Start
                </label>
                <Input
                  type="date"
                  value={editSubStartDate}
                  onChange={(e) => setEditSubStartDate(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">When the paid subscription begins</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-rose-500" /> Subscription End
                </label>
                <Input
                  type="date"
                  value={editSubEndDate}
                  onChange={(e) => setEditSubEndDate(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">Account locks after this date</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Office Seats Limit</label>
                <Input
                  type="number"
                  min={1}
                  value={editMaxAdmins}
                  onChange={(e) => setEditMaxAdmins(parseInt(e.target.value) || 1)}
                />
                <p className="text-[10px] text-muted-foreground">Admins/Dispatchers/Finance</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Field Seats Limit</label>
                <Input
                  type="number"
                  min={1}
                  value={editMaxFieldCrew}
                  onChange={(e) => setEditMaxFieldCrew(parseInt(e.target.value) || 1)}
                />
                <p className="text-[10px] text-muted-foreground">Mobile check-in crew members</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCompanyId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                updateSubscriptionMutation.mutate({
                  companyId: editingCompanyId!,
                  tier: editTier,
                  status: editStatus,
                  maxAdmins: editMaxAdmins,
                  maxFieldCrew: editMaxFieldCrew,
                  subStartDate: editSubStartDate,
                  subEndDate: editSubEndDate,
                })
              }
              disabled={updateSubscriptionMutation.isPending}
              className="gap-1.5"
            >
              {updateSubscriptionMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent className="sm:max-w-md bg-background">
          <DialogHeader>
            <DialogTitle>Edit User Profile & Credentials</DialogTitle>
            <DialogDescription>
              Modify profile details or override credentials for this platform account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Full Name</label>
                <Input
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="e.g. Liam Sterling"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Username</label>
                <Input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="e.g. LIAM123"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Job Title</label>
                <Input
                  value={editJobTitle}
                  onChange={(e) => setEditJobTitle(e.target.value)}
                  placeholder="e.g. Technician"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">System Role</label>
                <Select value={editGlobalRole} onValueChange={setEditGlobalRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Dispatcher">Dispatcher</SelectItem>
                    <SelectItem value="Field Crew">Field Crew</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Email</label>
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="e.g. staff@company.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. +1 555-0199"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</label>
              <Input
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="e.g. 123 Main St, Austin, TX"
              />
            </div>

            <div className="space-y-1.5 border-t pt-3">
              <label className="text-xs font-semibold text-rose-400">Override Password (Optional)</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password to reset"
              />
              <p className="text-[10px] text-muted-foreground">Leave blank to keep their current password. Must be at least 6 characters.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                updateUserMutation.mutate({
                  userId: editingUser.id,
                  authUserId: editingUser.auth_user_id,
                  fullName: editFullName,
                  username: editUsername,
                  jobTitle: editJobTitle,
                  globalRole: editGlobalRole,
                  email: editEmail,
                  phone: editPhone,
                  address: editAddress,
                  newPassword: newPassword,
                })
              }
              disabled={updateUserMutation.isPending}
              className="gap-1.5"
            >
              {updateUserMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 360° Company Inspector Slide-Over Drawer */}
      <Sheet open={!!selectedCompany360} onOpenChange={(open) => !open && setSelectedCompany360(null)}>
        <SheetContent side="right" className="sm:max-w-xl w-full bg-background border-l border-border shadow-2xl p-0 flex flex-col h-full overflow-hidden">
          {selectedCompany360 && (
            <>
              {/* Drawer Top Header Banner */}
              <div className="p-6 bg-slate-950 text-slate-100 space-y-3 relative shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 uppercase tracking-wider text-[10px] font-bold">
                      {selectedCompany360.prefix}
                    </Badge>
                    <Badge variant="outline" className={
                      selectedCompany360.subscription_tier === "Founding Partner" || selectedCompany360.subscription_tier === "founding_partner"
                        ? "bg-amber-500 text-slate-950 border-none font-bold text-[10px]"
                        : "bg-slate-800 text-slate-300 border-slate-700 text-[10px]"
                    }>
                      {selectedCompany360.subscription_tier}
                    </Badge>
                  </div>
                  <Badge variant="outline" className={selectedCompany360.subscription_status === "pending_approval" ? "bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]"}>
                    {selectedCompany360.subscription_status}
                  </Badge>
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white">{selectedCompany360.name}</h2>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-mono">
                    <span>ID: {selectedCompany360.id.slice(0, 18)}...</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCompany360.id);
                        toast.success("Organization ID copied!");
                      }}
                      className="hover:text-white"
                      title="Copy Org ID"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </p>
                </div>

                {/* Sub Tab Switcher */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => setDrawerTab("profile")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
                      drawerTab === "profile" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <Building2 className="h-3.5 w-3.5" /> 360° Profile
                  </button>
                  <button
                    onClick={() => setDrawerTab("roster")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
                      drawerTab === "roster" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <Users className="h-3.5 w-3.5" /> Workforce ({selectedCompany360.staff_profiles?.length || 0})
                  </button>
                  <button
                    onClick={() => setDrawerTab("modules")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
                      drawerTab === "modules" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" /> Quotas & Modules
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {drawerTab === "profile" && (
                  <div className="space-y-6">
                    {/* Submitted Signup Metadata Section */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-primary" /> Submitted Onboarding Profile
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                          <span className="text-muted-foreground font-semibold flex items-center gap-1"><Users className="h-3 w-3" /> Company Size</span>
                          <p className="font-bold text-foreground">{selectedCompany360.staff_count || "Not specified"}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                          <span className="text-muted-foreground font-semibold flex items-center gap-1"><Briefcase className="h-3 w-3" /> Trade / Industry</span>
                          <p className="font-bold text-foreground">{selectedCompany360.industry || "General Services"}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                          <span className="text-muted-foreground font-semibold flex items-center gap-1"><Coins className="h-3 w-3" /> Annual Revenue</span>
                          <p className="font-bold text-foreground">{selectedCompany360.annual_revenue || "Undisclosed"}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                          <span className="text-muted-foreground font-semibold flex items-center gap-1"><Globe className="h-3 w-3" /> Primary Website</span>
                          {selectedCompany360.website ? (
                            <a href={selectedCompany360.website.startsWith("http") ? selectedCompany360.website : `https://${selectedCompany360.website}`} target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline flex items-center gap-1 truncate">
                              {selectedCompany360.website} <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                            </a>
                          ) : (
                            <p className="font-bold text-muted-foreground">None listed</p>
                          )}
                        </div>
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1 col-span-2">
                          <span className="text-muted-foreground font-semibold flex items-center gap-1"><MapPin className="h-3 w-3" /> Operating Address</span>
                          <p className="font-bold text-foreground">{selectedCompany360.address || "No address provided"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Owner / Admin Contact */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-primary" /> Owner / Admin Contact
                      </h3>
                      {(() => {
                        const ownerProfile = selectedCompany360.staff_profiles?.find((s: any) => s.auth_user_id === selectedCompany360.auth_user_id);
                        return (
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                              <span className="text-muted-foreground font-semibold flex items-center gap-1"><Mail className="h-3 w-3" /> Owner Email</span>
                              <p className="font-bold text-foreground">{ownerProfile?.email || "Not provided"}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                              <span className="text-muted-foreground font-semibold flex items-center gap-1"><Phone className="h-3 w-3" /> Owner Phone</span>
                              <p className="font-bold text-foreground">{ownerProfile?.phone || "Not provided"}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Operational Details */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-primary" /> Technical & Registration Details
                      </h3>
                      <div className="p-4 rounded-xl bg-card border border-border/60 space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Registration Timestamp</span>
                          <span className="font-mono font-semibold">{format(new Date(selectedCompany360.created_at), "PPP 'at' p")}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Auth Owner UID</span>
                          <span className="font-mono font-semibold text-[11px]">{selectedCompany360.auth_user_id}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Billing Currency</span>
                          <span className="font-semibold">{selectedCompany360.currency || "USD ($)"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Subscribed Tier</span>
                          <span className="font-bold text-primary">{selectedCompany360.subscription_tier}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Subscription Start</span>
                          <span className="font-semibold">{selectedCompany360.subscription_started_at ? format(new Date(selectedCompany360.subscription_started_at), "PPP") : "Not set"}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-muted-foreground">Subscription End</span>
                          <span className={`font-semibold ${selectedCompany360.subscription_ends_at && new Date(selectedCompany360.subscription_ends_at) < new Date() ? "text-rose-500" : ""}`}>
                            {selectedCompany360.subscription_ends_at ? format(new Date(selectedCompany360.subscription_ends_at), "PPP") : "Not set"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {drawerTab === "roster" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Registered Team Profiles ({selectedCompany360.staff_profiles?.length || 0})
                      </h3>
                    </div>
                    {(!selectedCompany360.staff_profiles || selectedCompany360.staff_profiles.length === 0) ? (
                      <p className="text-xs text-muted-foreground italic p-4 text-center border border-dashed rounded-xl">
                        No team profiles created yet for this organization.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedCompany360.staff_profiles.map((staff: any) => (
                          <div key={staff.id} className="p-3 rounded-xl bg-card border border-border/50 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-foreground">{staff.full_name || staff.username}</p>
                                <p className="text-[11px] text-muted-foreground font-mono">@{staff.username} · {staff.job_title || staff.global_role}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={staff.global_role === "Admin" ? "bg-purple-500/10 text-purple-600" : "bg-blue-500/10 text-blue-600"}>
                                  {staff.global_role}
                                </Badge>
                                <Badge className={staff.is_active ? "bg-emerald-500/10 text-emerald-600 border-none" : "bg-rose-500/10 text-rose-600 border-none"}>
                                  {staff.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                            {(staff.email || staff.phone || staff.address) && (
                              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/30 text-[10px] text-muted-foreground">
                                {staff.email && (
                                  <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {staff.email}</span>
                                )}
                                {staff.phone && (
                                  <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {staff.phone}</span>
                                )}
                                {staff.address && (
                                  <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {staff.address}</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {drawerTab === "modules" && (
                  <div className="space-y-6">
                    {/* Seat Allocations Bar */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Seat Allocations</h3>
                      <div className="p-4 rounded-xl bg-card border border-border/60 space-y-4 text-xs">
                        <div>
                          <div className="flex justify-between font-semibold mb-1">
                            <span>Office Seats Cap</span>
                            <span className="text-primary font-bold">{selectedCompany360.max_admin_seats} Seats</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: "100%" }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between font-semibold mb-1">
                            <span>Field Crew Seats Cap</span>
                            <span className="text-primary font-bold">{selectedCompany360.max_field_crew_seats} Seats</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-purple-600 rounded-full" style={{ width: "100%" }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enabled Modules Badges */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Enabled Modules & Features</h3>
                      <div className="flex flex-wrap gap-2">
                        {["geofencing", "aiAgent", "invoices", "estimates", "timesheets", "crm", "safety", "compliance"].map((mod) => {
                          const isEnabled = (selectedCompany360.enabled_modules as any)?.[mod] !== false;
                          return (
                            <Badge
                              key={mod}
                              variant={isEnabled ? "default" : "outline"}
                              className={isEnabled ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" : "text-muted-foreground opacity-50"}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {mod.toUpperCase()}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Sticky Footer Actions */}
              <div className="p-4 bg-muted/40 border-t border-border flex items-center justify-between gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingCompanyId(selectedCompany360.id);
                    setEditTier(selectedCompany360.subscription_tier);
                    setEditStatus(selectedCompany360.subscription_status);
                    setEditMaxAdmins(selectedCompany360.max_admin_seats);
                    setEditMaxFieldCrew(selectedCompany360.max_field_crew_seats);
                    setEditSubStartDate(selectedCompany360.subscription_started_at ? new Date(selectedCompany360.subscription_started_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                    setEditSubEndDate(selectedCompany360.subscription_ends_at ? new Date(selectedCompany360.subscription_ends_at).toISOString().split('T')[0] : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                    setSelectedCompany360(null);
                  }}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Subscription & Seats
                </Button>
                {selectedCompany360.subscription_status === "pending_approval" && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs gap-1.5"
                    onClick={() => {
                      approveCompanyMutation.mutate(selectedCompany360.id);
                      setSelectedCompany360(null);
                    }}
                  >
                    <UserCheck className="h-3.5 w-3.5" /> Approve Company
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
