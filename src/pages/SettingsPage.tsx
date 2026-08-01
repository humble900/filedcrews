import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CreditCard, Crown, CheckCircle, AlertTriangle, Loader2, Users, Building,
  Lock, Puzzle, Code, Clock, Plug, BrainCircuit, User, Key, Zap, ShieldCheck, MessageSquare, Trash2, Megaphone, Download,
} from "lucide-react";
import { format } from "date-fns";

import {
  saveCompanyIntegration,
  disconnectCompanyIntegration,
  testIntegrationConnection,
  maskApiKey,
} from "@/lib/integrations";

type SettingsTab = "profile" | "company" | "billing" | "modules" | "integrations" | "developer";

const TABS: { id: SettingsTab; label: string; icon: any; ownerOnly?: boolean }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "company", label: "Company", icon: Building, ownerOnly: true },
  { id: "billing", label: "Billing & Plans", icon: CreditCard },
  { id: "modules", label: "Modules", icon: Puzzle, ownerOnly: true },
  { id: "integrations", label: "Integrations & Sync", icon: Plug, ownerOnly: true },
  { id: "developer", label: "Developer", icon: Code, ownerOnly: true },
];

export default function SettingsPage() {
  const { company, user, staffProfile, isTrialExpired, daysRemaining, refetchCompany } = useAuth();
  const { isOwner, userRole } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as SettingsTab) || "profile";
  const setActiveTab = (tab: SettingsTab) => setSearchParams({ tab });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [companyName, setCompanyName] = useState(company?.name || "");
  const [companyIndustry, setCompanyIndustry] = useState((company as any)?.industry || "");
  const [savingCompany, setSavingCompany] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignSource, setNewCampaignSource] = useState("Google");
  const [exporting, setExporting] = useState(false);
  const [apiKeyName, setApiKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  // BYOK Credentials State
  const autoSettings = (company as any)?.automation_settings || {};

  const stripeIntegration = autoSettings.stripe || {};
  const qbIntegration = autoSettings.quickbooks || {};

  const [stripePubKey, setStripePubKey] = useState(
    stripeIntegration.publishable_key || autoSettings.stripe_publishable_key || ""
  );
  const [stripeSecKey, setStripeSecKey] = useState(
    stripeIntegration.secret_key_masked || (autoSettings.stripe_secret_key ? maskApiKey(autoSettings.stripe_secret_key) : "")
  );

  const [qbClientId, setQbClientId] = useState(
    qbIntegration.client_id || autoSettings.quickbooks_client_id || ""
  );
  const [qbClientSecret, setQbClientSecret] = useState(
    qbIntegration.client_secret_masked || (autoSettings.quickbooks_client_secret ? maskApiKey(autoSettings.quickbooks_client_secret) : "")
  );

  const [savingBYOK, setSavingBYOK] = useState(false);
  const [testingStripe, setTestingStripe] = useState(false);
  const [testingQB, setTestingQB] = useState(false);

  const handleSaveBYOKKeys = async () => {
    if (!company?.id) return;
    setSavingBYOK(true);
    try {
      let currentSettings = { ...autoSettings };

      if (stripePubKey.trim() || stripeSecKey.trim()) {
        currentSettings = await saveCompanyIntegration(
          company.id,
          "stripe",
          { publishable_key: stripePubKey.trim(), secret_key: stripeSecKey.trim() },
          currentSettings
        );
      }

      if (qbClientId.trim() || qbClientSecret.trim()) {
        currentSettings = await saveCompanyIntegration(
          company.id,
          "quickbooks",
          { client_id: qbClientId.trim(), client_secret: qbClientSecret.trim() },
          currentSettings
        );
      }

      toast({ title: "BYOK Credentials Saved", description: "Integration API credentials saved securely and masked." });
      refetchCompany();
    } catch (err: any) {
      toast({ title: "Failed to save API keys", description: err.message, variant: "destructive" });
    } finally {
      setSavingBYOK(false);
    }
  };

  const handleDisconnect = async (provider: "stripe" | "quickbooks") => {
    if (!company?.id) return;
    try {
      await disconnectCompanyIntegration(company.id, provider, autoSettings);
      if (provider === "stripe") {
        setStripePubKey("");
        setStripeSecKey("");
      } else {
        setQbClientId("");
        setQbClientSecret("");
      }
      toast({ title: `${provider.toUpperCase()} Disconnected`, description: "Stored API keys purged successfully." });
      refetchCompany();
    } catch (err: any) {
      toast({ title: "Disconnect Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleTestConnection = async (provider: "stripe" | "quickbooks") => {
    if (provider === "stripe") {
      setTestingStripe(true);
      const res = await testIntegrationConnection("stripe", { publishable_key: stripePubKey, secret_key: stripeSecKey });
      setTestingStripe(false);
      toast({
        title: res.success ? "Stripe Connected & Verified" : "Stripe Connection Failed",
        description: res.message,
        variant: res.success ? "default" : "destructive",
      });
    } else {
      setTestingQB(true);
      const res = await testIntegrationConnection("quickbooks", { client_id: qbClientId, client_secret: qbClientSecret });
      setTestingQB(false);
      toast({
        title: res.success ? "QuickBooks Connected & Verified" : "QuickBooks Connection Failed",
        description: res.message,
        variant: res.success ? "default" : "destructive",
      });
    }
  };


  const visibleTabs = TABS.filter(t => !t.ownerOnly || isOwner || userRole === "Admin");

  // ─── Queries ───
  const { data: staffList = [], isLoading: loadingStaff } = useQuery({
    queryKey: ["billing_staff_usage", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase.from("staff_profiles").select("id, global_role, is_active").eq("company_id", company.id).eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ["campaigns", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase.from("campaigns").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  const { data: apiKeys = [], isLoading: loadingKeys } = useQuery({
    queryKey: ["api_keys", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase.from("api_keys").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  const { data: migrationTasks = [], isLoading: loadingMigrations } = useQuery({
    queryKey: ["migration_tasks", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase.from("migration_tasks").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
    refetchInterval: 3000, // Poll every 3 seconds for live updates
  });

  // ─── Mutations ───
  const addCampaignMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id || !newCampaignName.trim()) throw new Error("Campaign name required");
      const { error } = await supabase.from("campaigns").insert({ company_id: company.id, name: newCampaignName.trim(), source: newCampaignSource, is_active: true });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["campaigns", company?.id] }); setNewCampaignName(""); toast({ title: "Campaign Added" }); },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const toggleCampaignMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("campaigns").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["campaigns", company?.id] }); },
  });

  const createApiKeyMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id || !apiKeyName.trim()) throw new Error("Key name required");
      const rand = Array.from({ length: 24 }, () => Math.random().toString(36)[2]).join("");
      const rawKey = `sk_onsite_live_${rand}`;
      const maskedKey = `${rawKey.slice(0, 15)}...${rawKey.slice(-4)}`;
      const { error } = await supabase.from("api_keys").insert({ company_id: company.id, name: apiKeyName.trim(), key_hash: maskedKey, is_active: true });
      if (error) throw error;
      return rawKey;
    },
    onSuccess: (rawKey) => { queryClient.invalidateQueries({ queryKey: ["api_keys", company?.id] }); setGeneratedKey(rawKey ?? null); setApiKeyName(""); toast({ title: "API key generated" }); },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const toggleApiKeyMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("api_keys").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api_keys", company?.id] }),
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["api_keys", company?.id] }); toast({ title: "Key revoked" }); },
  });

  const enabledModules = (company?.enabled_modules as Record<string, boolean>) || { safety: true, change_orders: true, memberships: true, timesheets: true, forms: true };

  const updateModuleMutation = useMutation({
    mutationFn: async (updated: Record<string, boolean>) => {
      if (!company?.id) return;
      const { error } = await supabase.from("companies").update({ enabled_modules: updated }).eq("id", company.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["company"] }); refetchCompany(); toast({ title: "Module settings updated" }); },
  });

  const updateModule = (key: string, val: boolean) => updateModuleMutation.mutate({ ...enabledModules, [key]: val });

  // ─── Computed ───
  const activeAdmins = staffList.filter((s: any) => ["Admin", "Finance", "Dispatcher"].includes(s.global_role)).length;
  const activeFieldCrew = staffList.filter((s: any) => s.global_role === "Field Crew").length;
  const maxAdmins = company?.max_admin_seats ?? 3;
  const maxFieldCrew = company?.max_field_crew_seats ?? 10;
  const isFoundingPartner = company?.subscription_tier === "Founding Partner";
  const adminPercent = Math.min((activeAdmins / maxAdmins) * 100, 100);
  const fieldPercent = Math.min((activeFieldCrew / maxFieldCrew) * 100, 100);
  const whatsappMessage = encodeURIComponent("Hi there! We are interested in joining the Founding Partner Charter for OnSite Crew Manager.");
  const whatsappUrl = `https://wa.me/14094229714?text=${whatsappMessage}`;

  // ─── Handlers ───
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast({ title: "Password too short", description: "Min 6 characters.", variant: "destructive" }); return; }
    if (newPassword !== confirmPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Password updated" }); setNewPassword(""); setConfirmPassword(""); }
  };

  const handleSaveCompany = async () => {
    if (!company?.id) return;
    setSavingCompany(true);
    const { error } = await supabase.from("companies").update({ name: companyName.trim(), industry: companyIndustry.trim() || null }).eq("id", company.id);
    setSavingCompany(false);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Company details updated" }); refetchCompany(); }
  };

  const handleExportData = async () => {
    if (!company?.id) return;
    setExporting(true);
    try {
      for (const tbl of ["customers","projects","jobs","invoices","payments","estimates","timesheet_entries","form_responses","campaigns"]) {
        const { data, error } = await (supabase as any).from(tbl).select("*").eq("company_id", company.id);
        if (error || !data || data.length === 0) continue;
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(","), ...data.map((row: any) => headers.map(f => `"${(row[f] == null ? "" : String(row[f]).replace(/"/g, '""'))}"`).join(","))];
        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url; link.download = `${tbl}_backup_${format(new Date(), "yyyyMMdd")}.csv`; link.style.visibility = "hidden";
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      }
      toast({ title: "Export Complete" });
    } catch (err: any) { toast({ title: "Export Failed", description: err.message, variant: "destructive" }); }
    finally { setExporting(false); }
  };

  // ─── Profile Tab ───
  const renderProfile = () => (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-base font-bold flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Account Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Email</label>
              <Input value={user?.email || ""} readOnly className="bg-muted/30" />
              <p className="text-[10px] text-muted-foreground">Email changes require admin support.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Role</label>
              <Input value={staffProfile ? staffProfile.global_role : "Owner"} readOnly className="bg-muted/30" />
            </div>
          </div>
          {staffProfile && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                <Input value={staffProfile.full_name} readOnly className="bg-muted/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Username</label>
                <Input value={`@${staffProfile.username}`} readOnly className="bg-muted/30" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Change Password</CardTitle>
          <CardDescription>Update your login credentials.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">New Password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Confirm Password</label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword} size="sm" className="font-semibold">
            {changingPassword ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Updating...</> : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Company Tab ───
  const renderCompany = () => (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2"><Building className="h-4 w-4 text-primary" /> Company Details</CardTitle>
          <CardDescription>Update your business information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Company Name</label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Prefix (Read Only)</label>
              <Input value={company?.prefix || ""} readOnly className="bg-muted/30" />
            </div>
          </div>
          <div className="max-w-lg space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Industry</label>
            <Input value={companyIndustry} onChange={(e) => setCompanyIndustry(e.target.value)} placeholder="e.g. HVAC, Plumbing, Landscaping" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Subscription Tier</label>
              <Input value={company?.subscription_tier || "Free"} readOnly className="bg-muted/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Currency</label>
              <Input value={company?.currency || "USD"} readOnly className="bg-muted/30" />
            </div>
          </div>
          <Button onClick={handleSaveCompany} disabled={savingCompany} size="sm" className="font-semibold">
            {savingCompany ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Saving...</> : "Save Company Details"}
          </Button>
        </CardContent>
      </Card>

      {/* BYOK Multi-Tenant Keys Card */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" /> Bring Your Own Key (BYOK) Live Credentials
            </CardTitle>
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-200">
              Tenant Isolated
            </Badge>
          </div>
          <CardDescription>
            Configure your custom Stripe and QuickBooks API keys so payments & accounting sync directly into your own business accounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stripe BYOK Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-600" /> Custom Stripe Account API Keys
              </h4>
              {stripePubKey && stripeSecKey ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 gap-1 text-[10px]">
                  <ShieldCheck className="h-3 w-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-[10px]">
                  Disconnected
                </Badge>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Stripe Publishable Key</label>
                <Input placeholder="pk_live_..." value={stripePubKey} onChange={(e) => setStripePubKey(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Stripe Secret Key</label>
                <Input type="password" placeholder="sk_live_..." value={stripeSecKey} onChange={(e) => setStripeSecKey(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestConnection("stripe")}
                disabled={testingStripe || !stripePubKey}
                className="text-xs h-8"
              >
                {testingStripe ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plug className="h-3 w-3 mr-1" />}
                Test Stripe Connection
              </Button>

              {(stripePubKey || stripeSecKey) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect("stripe")}
                  className="text-xs h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Disconnect & Purge
                </Button>
              )}
            </div>
          </div>

          {/* QuickBooks BYOK Section */}
          <div className="space-y-4 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Plug className="h-4 w-4 text-emerald-600" /> QuickBooks Online App Credentials
              </h4>
              {qbClientId && qbClientSecret ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 gap-1 text-[10px]">
                  <ShieldCheck className="h-3 w-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-[10px]">
                  Disconnected
                </Badge>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">QuickBooks Client ID</label>
                <Input placeholder="AB1234567..." value={qbClientId} onChange={(e) => setQbClientId(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">QuickBooks Client Secret</label>
                <Input type="password" placeholder="••••••••••••" value={qbClientSecret} onChange={(e) => setQbClientSecret(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestConnection("quickbooks")}
                disabled={testingQB || !qbClientId}
                className="text-xs h-8"
              >
                {testingQB ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plug className="h-3 w-3 mr-1" />}
                Test QuickBooks Connection
              </Button>

              {(qbClientId || qbClientSecret) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect("quickbooks")}
                  className="text-xs h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Disconnect & Purge
                </Button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 flex justify-between items-center">
            <Button onClick={handleSaveBYOKKeys} disabled={savingBYOK} size="sm" className="font-semibold shadow-sm">
              {savingBYOK ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Saving Credentials...</> : "Save Custom API Credentials"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Billing & Plans Tab State & UI ───
  const [selectedPlanId, setSelectedPlanId] = useState<"launch" | "growth" | "enterprise">("launch");
  const [billingViewMode, setBillingViewMode] = useState<"select" | "review">("select");
  const [businessTaxId, setBusinessTaxId] = useState("");
  const [billingAddress, setBillingAddress] = useState(company?.address || "");

  const plans = [
    {
      id: "launch" as const,
      name: "Free Trial",
      price: "$0",
      period: "/ 14 days",
      description: "14 days full access for new business accounts — set up your team and explore all platform features.",
      specs: [
        "👤 1 Office Staff (Account Creator)",
        "👷 2 Field Crew Members",
        "⏳ 14 Days Trial Duration"
      ],
      features: [
        "Run unlimited projects with Worksite Map",
        "Geofence time tracking & GPS logs",
        "Track job costs and cost categories",
        "Create & send digital Work Orders",
        "Mobile App access for field crews"
      ]
    },
    {
      id: "growth" as const,
      name: "Growth",
      price: "$495",
      period: "/mo",
      description: "Supercharge your company with 10 total seats, AI dispatching, and safety hub compliance.",
      specs: [
        "👤 3 Office Staff",
        "👷 7 Field Crew Members",
        "👥 10 Total Seats Included"
      ],
      features: [
        "Everything in Free Trial plus...",
        "AI Agent Autonomous Dispatcher",
        "Safety Hub & Compliance Forms",
        "Auto-sync timesheets & payroll export",
        "Change Orders & Client Approval Portal",
        "Priority WhatsApp & phone support"
      ]
    },
    {
      id: "enterprise" as const,
      name: "Founding Partner",
      price: "$2,899",
      period: "/yr",
      description: "VIP annual charter for growing enterprises with custom seats and direct roadmap co-design.",
      specs: [
        "⚡ Custom Office Seats",
        "👷 Custom Field Crew Seats",
        "👑 VIP Charter Co-Design"
      ],
      features: [
        "Everything in Growth plus...",
        "Unlimited custom seat allocation",
        "Founding Partner VIP Charter membership",
        "White-glove data migration & setup",
        "Dedicated Growth Strategist & Account Manager",
        "Custom API & ERP Integrations"
      ]
    }
  ];

  const activeSelectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  const handleConfirmPlanChange = () => {
    toast.success(`Plan request submitted for ${activeSelectedPlan.name}! Our account manager will contact you via WhatsApp / Email for manual activation.`);
    setBillingViewMode("select");
  };

  const renderBilling = () => (
    <div className="space-y-8">
      {/* Top Banner & License Usage Bar */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!isFoundingPartner ? (
            <Card className={cn("border-border/50 shadow-sm", isTrialExpired ? "border-rose-500/30 bg-rose-500/5" : "border-blue-500/30 bg-blue-500/5")}>
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl shrink-0", isTrialExpired ? "bg-rose-500/15" : "bg-blue-500/15")}>
                    <Clock className={cn("h-6 w-6", isTrialExpired ? "text-rose-500" : "text-blue-500")} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-base text-foreground">{isTrialExpired ? "Trial Expired" : `${daysRemaining} Days Remaining in Trial`}</p>
                      {isTrialExpired && <Badge variant="destructive" className="text-[10px]">Action Required</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isTrialExpired ? "Please select a plan below to keep your workforce active." : "Full access to all platform features during your trial period."}
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => setBillingViewMode("select")} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shrink-0">
                  Manage Plan Selection
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 shadow-sm relative overflow-hidden">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-base text-foreground">Founding Partner Charter VIP</p>
                      <Badge className="bg-amber-500 text-slate-900 border-none text-[10px]">Active Member</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Annual Plan ($2,899/yr) · Direct WhatsApp Roadmap Access</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs shrink-0">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> VIP WhatsApp
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="border-border/50 shadow-sm h-full flex flex-col justify-center">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-foreground"><Users className="h-3.5 w-3.5 text-blue-500" /> Office Seats</span>
                <span className="text-muted-foreground">{activeAdmins} / {maxAdmins}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${adminPercent}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs font-semibold pt-1">
                <span className="flex items-center gap-1.5 text-foreground"><Building className="h-3.5 w-3.5 text-purple-500" /> Crew Seats</span>
                <span className="text-muted-foreground">{activeFieldCrew} / {maxFieldCrew}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${fieldPercent}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {billingViewMode === "select" ? (
        /* STEP 1: PLAN SELECTION GRID */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Plan Selection</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Select the plan that best fits your business workforce size.</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((p) => {
              const isSelected = selectedPlanId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={cn(
                    "relative rounded-2xl border-2 transition-all cursor-pointer p-6 flex flex-col justify-between bg-card hover:shadow-lg",
                    isSelected
                      ? "border-blue-600 shadow-md ring-2 ring-blue-600/20 dark:border-blue-500"
                      : "border-border/60 hover:border-border"
                  )}
                >
                  {/* Top Header & Radio Badge */}
                  <div>
                    <div className="flex items-center justify-end mb-2">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                        isSelected ? "border-amber-500 bg-amber-500 text-white" : "border-slate-300 dark:border-slate-600"
                      )}>
                        {isSelected && <CheckCircle className="h-4 w-4 fill-amber-500 text-white" />}
                      </div>
                    </div>

                    <h3 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 drop-shadow-[0_2px_8px_rgba(245,158,11,0.45)] dark:drop-shadow-[0_2px_12px_rgba(245,158,11,0.6)]">
                      {p.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-2 mb-3">
                      <span className="text-3xl font-black text-foreground tracking-tight">{p.price}</span>
                      <span className="text-xs text-muted-foreground font-medium">{p.period}</span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed mb-4 min-h-[36px]">
                      {p.description}
                    </p>

                    {/* Spec Pill Dropdown Visuals */}
                    <div className="space-y-2 mb-6">
                      {p.specs.map((spec, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/50 bg-muted/40 text-xs font-medium text-foreground">
                          <span>{spec}</span>
                        </div>
                      ))}
                    </div>

                    {/* Features List */}
                    <div className="space-y-2.5 pt-4 border-t border-border/40">
                      {p.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
                          <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Select Button */}
                  <div className="pt-6 mt-6 border-t border-border/30">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "w-full text-xs font-bold rounded-xl h-10 transition-all",
                        isSelected
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                          : "border-border hover:bg-muted"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlanId(p.id);
                        setBillingViewMode("review");
                      }}
                    >
                      {isSelected ? "Review Plan Selection" : `Select ${p.name}`}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 rounded-xl h-11 text-xs"
              onClick={() => setBillingViewMode("review")}
            >
              Review Changes
            </Button>
          </div>
        </div>
      ) : (
        /* STEP 2: REVIEW & MANUAL ACTIVATION CHECKOUT VIEW */
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Header Back Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBillingViewMode("select")}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5 p-0 hover:bg-transparent"
            >
              ← Plan selection
            </Button>
          </div>

          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Checkout Review</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Confirm your business plan request for manual account activation.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Left Column: Form & Manual Payment Info */}
            <div className="lg:col-span-7 space-y-6">
              {/* Contact Information */}
              <div className="space-y-3 p-5 rounded-2xl border border-border/60 bg-card">
                <h3 className="text-sm font-bold text-foreground">Contact Information</h3>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Work Email</label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="bg-muted/40 border-border/50 text-foreground text-xs h-10"
                  />
                </div>
              </div>

              {/* Payment Date */}
              <div className="space-y-3 p-5 rounded-2xl border border-border/60 bg-card">
                <h3 className="text-sm font-bold text-foreground">Activation Schedule</h3>
                <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 text-xs">
                  <p className="font-bold text-blue-900 dark:text-blue-300">Immediately (Today)</p>
                  <p className="text-blue-700 dark:text-blue-400 mt-0.5 text-[11px]">
                    Plan updates and seat quotas will take effect upon confirmation by your account manager.
                  </p>
                </div>
              </div>

              {/* Manual Activation Payment Notice (No Credit Card required) */}
              <div className="space-y-3 p-5 rounded-2xl border border-border/60 bg-card">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-foreground">Payment Method & Activation</h3>
                </div>

                <div className="p-4 rounded-xl border border-dashed border-blue-300 dark:border-blue-700/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-semibold">
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Direct Invoicing / Manual Activation Mode</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    We currently process payment activations directly via bank transfer / wire invoice. Submitting this request notifies your account specialist to provision your license limits without delay.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Business Name</label>
                    <Input
                      value={company?.name || ""}
                      readOnly
                      className="bg-muted/40 border-border/50 text-foreground text-xs h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Tax ID / TIN (Optional)</label>
                    <Input
                      placeholder="e.g. 123456789"
                      value={businessTaxId}
                      onChange={(e) => setBusinessTaxId(e.target.value)}
                      className="bg-card border-border/50 text-foreground text-xs h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs text-muted-foreground font-medium">Billing Address</label>
                  <Input
                    placeholder="Enter company billing address"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="bg-card border-border/50 text-foreground text-xs h-10"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Summary Card Sidebar */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-2xl border border-border/60 bg-card shadow-sm space-y-6 sticky top-6">
                {/* Plan Header */}
                <div className="flex items-center gap-3.5 pb-4 border-b border-border/40">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{activeSelectedPlan.name} Plan</h3>
                    <p className="text-xs text-muted-foreground">Billed monthly / annual schedule</p>
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">Base Plan Subscription</span>
                    <span className="font-bold text-foreground">{activeSelectedPlan.price}{activeSelectedPlan.period}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Office & Crew Seat Quotas</span>
                    <span className="text-foreground font-medium">Included</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Setup & Onboarding Fee</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">$0.00 (Waived)</span>
                  </div>
                </div>

                {/* Subtotal & Total */}
                <div className="pt-4 border-t border-border/40 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{activeSelectedPlan.price}.00</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Tax</span>
                    <span className="text-[11px]">Calculated upon invoice</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-2">
                    <span className="text-sm font-bold text-foreground">Total due today</span>
                    <span className="text-2xl font-black text-foreground">{activeSelectedPlan.price}.00</span>
                  </div>
                </div>

                {/* Submit Action Button */}
                <Button
                  onClick={handleConfirmPlanChange}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-xs rounded-xl shadow-md transition-all"
                >
                  Submit Plan Activation Request
                </Button>

                <p className="text-[10px] text-center text-muted-foreground leading-relaxed px-2">
                  By confirming, you submit a manual plan activation request to FiledCrews account operations. No auto-charge will occur until manual confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Modules Tab ───
  const renderModules = () => (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base font-bold flex items-center gap-2"><Puzzle className="h-4 w-4 text-primary" /> System Module Controls</CardTitle>
        <CardDescription>Toggle modules to show/hide sections globally.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {[{ key: "safety", label: "Safety Hub", desc: "Compliance check-sheets" }, { key: "change_orders", label: "Change Orders", desc: "Contract variations" }, { key: "memberships", label: "Memberships", desc: "Service agreements" }, { key: "timesheets", label: "Timesheets", desc: "Automated punch hours" }].map(mod => (
          <div key={mod.key} className="flex items-center justify-between p-4 border rounded-xl bg-card hover:bg-muted/30 transition-colors">
            <div><span className="font-semibold text-sm block">{mod.label}</span><span className="text-[10px] text-muted-foreground">{mod.desc}</span></div>
            <Switch checked={enabledModules[mod.key] !== false} onCheckedChange={(v) => updateModule(mod.key, v)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );

  // ─── Developer Tab ───
  const renderDeveloper = () => (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2"><Code className="h-4 w-4 text-primary" /> Embeddable Booking Widget</CardTitle>
          <CardDescription>Integrate your lead capture form directly onto your external website.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Copy the HTML snippet below and paste it into your website builder (e.g., WordPress, Squarespace, Wix) to embed a clean, unbranded version of your booking center.
          </p>
          <div className="relative">
            <pre className="text-[11px] font-mono text-emerald-400 break-all whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-border/40">
              {`<iframe src="${window.location.origin}/book/${company?.prefix}?embed=true" width="100%" height="650" frameborder="0" style="border-radius: 8px; overflow: hidden; border: none; background: transparent;"></iframe>`}
            </pre>
            <Button 
              size="sm" 
              variant="outline" 
              className="absolute top-2 right-2 h-7 text-[10px] bg-slate-900 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-800"
              onClick={() => {
                navigator.clipboard.writeText(`<iframe src="${window.location.origin}/book/${company?.prefix}?embed=true" width="100%" height="650" frameborder="0" style="border-radius: 8px; overflow: hidden; border: none; background: transparent;"></iframe>`);
                toast({ title: "Copied to clipboard!" });
              }}
            >
              Copy Code
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2"><Key className="h-4 w-4 text-primary" /> API Integrations</CardTitle>
          <CardDescription>Generate REST API tokens for external tools.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {generatedKey && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Token Generated!</p>
                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setGeneratedKey(null)}>Dismiss</Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Copy now - you won't see it again.</p>
              <code className="text-xs font-mono text-emerald-400 break-all select-all block bg-background p-2 rounded-lg border border-emerald-500/20">{generatedKey}</code>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 items-end max-w-xl">
            <div className="flex-1 space-y-1.5 w-full">
              <label className="text-[11px] font-semibold text-muted-foreground">Key Name</label>
              <Input placeholder="e.g. QuickBooks Connect" value={apiKeyName} onChange={(e) => setApiKeyName(e.target.value)} className="h-9 text-xs" />
            </div>
            <Button onClick={() => createApiKeyMutation.mutate()} disabled={createApiKeyMutation.isPending || !apiKeyName.trim()} className="font-bold text-xs h-9 w-full sm:w-auto shrink-0">
              {createApiKeyMutation.isPending ? "Generating\u2026" : "Generate Token"}
            </Button>
          </div>
          <div className="border border-border/40 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Key Prefix</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Created</TableHead><TableHead className="text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingKeys ? <TableRow><TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">Loading\u2026</TableCell></TableRow>
                : apiKeys.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground italic">No API tokens yet.</TableCell></TableRow>
                : apiKeys.map((key: any) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-semibold text-xs">{key.name}</TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{key.key_hash}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={key.is_active ? "default" : "secondary"} className="text-[10px] px-1 py-0">{key.is_active ? "Active" : "Inactive"}</Badge>
                        <input type="checkbox" checked={key.is_active} onChange={(e) => toggleApiKeyMutation.mutate({ id: key.id, is_active: e.target.checked })} className="h-3.5 w-3.5 rounded" />
                      </div>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">{format(new Date(key.created_at), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Revoke "${key.name}"?`)) deleteApiKeyMutation.mutate(key.id); }} className="h-7 w-7 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> Accounting API Integration
            </CardTitle>
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Coming Soon</Badge>
          </div>
          <CardDescription>
            Direct API Live Sync with QuickBooks Online and Xero.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Automate your bookkeeping. When direct sync is enabled, creating or paying invoices in OnSite will automatically push them to your QuickBooks or Xero registry in real-time.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-xl bg-muted/10 opacity-75 flex flex-col justify-between h-[120px]">
              <div>
                <p className="text-xs font-bold text-slate-800">QuickBooks Online</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Real-time bidirectional invoice and payment sync.</p>
              </div>
              <Button size="sm" variant="outline" className="w-full text-[10px] h-7 cursor-not-allowed" disabled>Connect QuickBooks</Button>
            </div>
            <div className="p-4 border rounded-xl bg-muted/10 opacity-75 flex flex-col justify-between h-[120px]">
              <div>
                <p className="text-xs font-bold text-slate-800">Xero</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Automated tax mapping and sales account exports.</p>
              </div>
              <Button size="sm" variant="outline" className="w-full text-[10px] h-7 cursor-not-allowed" disabled>Connect Xero</Button>
            </div>
          </div>
          <p className="text-[10px] text-primary/70 bg-primary/5 p-2 rounded-lg border border-primary/10">
            💡 <strong>Current Support:</strong> QuickBooks Online and Xero CSV exports are fully functional. You can download importable ledgers directly from the Invoices workspace.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /> Marketing Campaigns</CardTitle>
          <CardDescription>Track sales origins with attribution.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Campaign Name" value={newCampaignName} onChange={(e) => setNewCampaignName(e.target.value)} className="flex-1 text-xs" />
            <select value={newCampaignSource} onChange={(e) => setNewCampaignSource(e.target.value)} className="border border-input rounded-md px-2 text-xs bg-background max-w-[120px]">
              {["Google","Facebook","Referral","Flyer","Direct"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button onClick={() => addCampaignMutation.mutate()} disabled={addCampaignMutation.isPending} size="sm" className="font-bold text-xs">Add</Button>
          </div>
          <div className="border rounded-xl divide-y divide-border/20 overflow-hidden bg-card/30">
            {loadingCampaigns ? <div className="p-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
            : campaigns.length === 0 ? <p className="p-4 text-center text-xs text-muted-foreground italic">No campaigns yet.</p>
            : campaigns.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 text-xs">
                <div><span className="font-bold block">{c.name}</span><span className="text-[10px] text-muted-foreground">Source: {c.source}</span></div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.is_active ? "default" : "secondary"} className="text-[10px] px-1 py-0">{c.is_active ? "Active" : "Inactive"}</Badge>
                  <input type="checkbox" checked={c.is_active} onChange={(e) => toggleCampaignMutation.mutate({ id: c.id, is_active: e.target.checked })} className="h-3.5 w-3.5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2"><Download className="h-4 w-4 text-primary" /> Database Backups</CardTitle>
          <CardDescription>Download CSV exports of all tables.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20 text-center space-y-3">
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">Export customer data, projects, invoices, timesheets, and more.</p>
            <Button onClick={handleExportData} disabled={exporting} className="font-bold text-xs gap-1.5">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export System Databases
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-6">
      <Card className="border-none shadow-xl bg-background/60 backdrop-blur-xl ring-1 ring-border/50">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-xl flex items-center gap-2"><Plug className="h-5 w-5 text-primary" /> Connected Systems</CardTitle>
          <CardDescription>Integrate with your legacy systems and sync data seamlessly.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-bold mb-1">ServiceTitan Migration</h3>
            <p className="text-xs text-muted-foreground mb-4">You can sync your existing customers and jobs directly from ServiceTitan. Mila Virtual Coworker can handle this for you in chat!</p>
            {loadingMigrations ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/> Loading sync history...</div>
            ) : migrationTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No past migrations found. Go chat with Mila to start one!</p>
            ) : (
              <div className="space-y-3">
                {migrationTasks.map((task: any) => (
                  <div key={task.id} className="p-3 bg-muted/30 rounded-lg border border-border flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm capitalize">{task.provider_name} Sync</p>
                      <p className="text-xs text-muted-foreground">Status: <Badge variant={task.status === "completed" ? "default" : task.status === "failed" ? "destructive" : "secondary"}>{task.status}</Badge></p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{task.synced_records} / {task.total_records} Records</p>
                      {task.status === 'in_progress' && (
                        <div className="w-24 h-1.5 bg-muted mt-2 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, (task.synced_records / (task.total_records || 1)) * 100))}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const tabContent: Record<SettingsTab, () => JSX.Element> = { 
    profile: renderProfile, 
    company: renderCompany, 
    billing: renderBilling, 
    modules: renderModules, 
    integrations: renderIntegrations,
    developer: renderDeveloper 
  };

  return (
    <>
      <SEO title="Settings" description="Manage account, company, billing, and integrations." path="/settings" noIndex />
      <DashboardLayout activeTab="settings" companyName={company?.name || ""} companyPrefix={company?.prefix || ""} companyId={company?.id || ""}>
        <div className="p-3 sm:p-4 md:p-8 max-w-[1200px] mx-auto font-sans">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary" /> Settings
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Manage your account, company details, billing, and platform configurations.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <nav className="md:w-52 shrink-0">
              <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
                {visibleTabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                      activeTab === tab.id ? "bg-primary/10 text-primary shadow-sm border border-primary/20" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}>
                      <Icon className="h-4 w-4 shrink-0" />{tab.label}
                    </button>
                  );
                })}
              </div>
            </nav>
            <div className="flex-1 min-w-0">{(tabContent[activeTab] || renderProfile)()}</div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
