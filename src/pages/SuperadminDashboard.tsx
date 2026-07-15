import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
} from "@/components/ui/dialog";
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
  max_field_crew_seats: number;
  max_admin_seats: number;
  staff_profiles: { count: number }[];
}

interface PlatformAdmin {
  id: string;
  user_id: string;
  created_at: string;
}

interface StaffUser {
  id: string;
  full_name: string;
  username: string;
  global_role: string;
  job_title: string | null;
  is_active: boolean;
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

  // Search terms
  const [companySearch, setCompanySearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Edit Subscription Modal States
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editTier, setEditTier] = useState("Free");
  const [editMaxAdmins, setEditMaxAdmins] = useState(3);
  const [editMaxFieldCrew, setEditMaxFieldCrew] = useState(10);

  // Add platform admin state
  const [newAdminUserId, setNewAdminUserId] = useState("");

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
          max_admin_seats,
          max_field_crew_seats,
          staff_profiles(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((c: any) => ({
        ...c,
        staff_profiles: Array.isArray(c.staff_profiles) ? c.staff_profiles : [{ count: 0 }],
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
          full_name,
          username,
          global_role,
          job_title,
          is_active,
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
      maxAdmins,
      maxFieldCrew,
    }: {
      companyId: string;
      tier: string;
      maxAdmins: number;
      maxFieldCrew: number;
    }) => {
      const { error } = await supabase
        .from("companies")
        .update({
          subscription_tier: tier,
          max_admin_seats: maxAdmins,
          max_field_crew_seats: maxFieldCrew,
        })
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

  // Filtered lists
  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
    c.prefix.toLowerCase().includes(companySearch.toLowerCase())
  );

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
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary animate-pulse" />
          <span className="font-extrabold text-xl tracking-tight text-foreground">OnSite SaaS Superadmin</span>
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 ml-2">
            Superuser operations
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
            SaaS Platform Analytics & Management
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Admin console for monitoring tenants, user credentials, active configurations, and platform controls.
          </p>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Tenancies</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Building2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-3xl font-black text-foreground">{stats?.companies}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Crew profiles</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-3xl font-black text-foreground">{stats?.staff}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Active Worksite Geofences</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                <Circle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-3xl font-black text-foreground">{stats?.geofences}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Location Events Recorded</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Activity className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-3xl font-black text-foreground">{stats?.events}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Superadmin Tab Section */}
        <Tabs defaultValue="tenants" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-[500px] bg-background border border-border/50 shadow-sm">
            <TabsTrigger value="tenants" className="text-xs font-bold">Companies (Tenants)</TabsTrigger>
            <TabsTrigger value="users" className="text-xs font-bold">Platform Users</TabsTrigger>
            <TabsTrigger value="admins" className="text-xs font-bold">System Admins</TabsTrigger>
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
                    Monitor and review all companies using the OnSite platform.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search company or prefix..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="pl-9 bg-background"
                  />
                </div>
              </CardHeader>

              <CardContent className="pt-6">
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
                          <TableHead>Owner Auth ID</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingCompanies ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                            </TableCell>
                          </TableRow>
                        ) : paginatedItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                              No companies match search criteria.
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedItems.map((c) => (
                            <TableRow key={c.id} className="hover:bg-muted/15 transition-colors">
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
                                {c.staff_profiles?.[0]?.count ?? 0} members
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={c.subscription_tier === "Founding Partner" ? "default" : "outline"}
                                  className={
                                    c.subscription_tier === "Founding Partner"
                                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold"
                                      : "font-semibold"
                                  }
                                >
                                  {c.subscription_tier}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs font-semibold">
                                {c.max_admin_seats} seats
                              </TableCell>
                              <TableCell className="font-mono text-xs font-semibold">
                                {c.max_field_crew_seats} seats
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {c.auth_user_id}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                      setEditingCompanyId(c.id);
                                      setEditTier(c.subscription_tier);
                                      setEditMaxAdmins(c.max_admin_seats);
                                      setEditMaxFieldCrew(c.max_field_crew_seats);
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingUsers ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                            </TableCell>
                          </TableRow>
                        ) : paginatedItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground text-sm">
                              No platform user accounts found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedItems.map((u) => (
                            <TableRow key={u.id} className="hover:bg-muted/15 transition-colors">
                              <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(u.created_at), "yyyy-MM-dd HH:mm")}
                              </TableCell>
                              <TableCell className="font-bold text-foreground">
                                {u.full_name}
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
                        <div key={a.id} className="flex items-center justify-between p-4 hover:bg-muted/5 transition-colors">
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
        </Tabs>
      </main>

      {/* Edit Subscription Modal Dialog */}
      <Dialog
        open={!!editingCompanyId}
        onOpenChange={(open) => !open && setEditingCompanyId(null)}
      >
        <DialogContent className="sm:max-w-md bg-background">
          <DialogHeader>
            <DialogTitle>Update Tenancy Subscription & Seats</DialogTitle>
            <DialogDescription>
              Assign the active tier and maximum seat licenses allowed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Subscription Tier</label>
              <Select value={editTier} onValueChange={setEditTier}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Free">Free (Standard Limits)</SelectItem>
                  <SelectItem value="Founding Partner">Founding Partner (Lifetime VIP)</SelectItem>
                </SelectContent>
              </Select>
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
                  maxAdmins: editMaxAdmins,
                  maxFieldCrew: editMaxFieldCrew,
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
    </div>
  );
}
