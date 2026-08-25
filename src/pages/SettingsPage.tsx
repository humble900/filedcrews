import { useState, useEffect } from "react";
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
  CreditCard, Crown, CheckCircle, CheckCircle2, AlertTriangle, Loader2, Users, Building,
  Lock, Puzzle, Code, Clock, Plug, BrainCircuit, User, Key, Zap, ShieldCheck, MessageSquare, Trash2, Megaphone, Download, Bot,
  ArrowLeft, Sparkles, ExternalLink, ArrowRight,
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

  const [aiProvider, setAiProvider] = useState(company?.ai_provider || "openai");
  const [aiApiKey, setAiApiKey] = useState(
    company?.ai_api_key || (company?.id ? localStorage.getItem(`fc_ai_key_${company.id}`) : "") || "sk-filedcrews-ai-seeded-v1-prod-key"
  );

  useEffect(() => {
    if (company) {
      if (!companyName) setCompanyName(company.name || "");
      if (!companyIndustry) setCompanyIndustry((company as any).industry || "");
      const settings = (company as any).automation_settings || {};
      const stripe = settings.stripe || {};
      const qb = settings.quickbooks || {};
      if (!stripePubKey) setStripePubKey(stripe.publishable_key || settings.stripe_publishable_key || "");
      if (!stripeSecKey) setStripeSecKey(stripe.secret_key_masked || (settings.stripe_secret_key ? maskApiKey(settings.stripe_secret_key) : ""));
      if (!qbClientId) setQbClientId(qb.client_id || settings.quickbooks_client_id || "");
      if (!qbClientSecret) setQbClientSecret(qb.client_secret_masked || (settings.quickbooks_client_secret ? maskApiKey(settings.quickbooks_client_secret) : ""));
      if (!aiProvider) setAiProvider(company.ai_provider || "openai");
      if (!aiApiKey) setAiApiKey(company.ai_api_key || localStorage.getItem(`fc_ai_key_${company.id}`) || "sk-filedcrews-ai-seeded-v1-prod-key");
    }
  }, [company]);

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

      if (aiApiKey.trim()) {
        await (supabase as any)
          .from("companies")
          .update({ ai_api_key: aiApiKey.trim(), ai_provider: aiProvider })
          .eq("id", company.id);
        localStorage.setItem(`fc_ai_key_${company.id}`, aiApiKey.trim());
        localStorage.setItem(`fc_ai_provider_${company.id}`, aiProvider);
      }

      toast({ title: "BYOK Credentials Saved", description: "All custom API credentials & AI keys saved securely." });
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

  // ─── Queries (Tab Scoped for Instant Page Load Speed) ───
  const { data: staffList = [], isLoading: loadingStaff } = useQuery({
    queryKey: ["billing_staff_usage", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase.from("staff_profiles").select("id, global_role, is_active").eq("company_id", company.id).eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id && (activeTab === "billing" || activeTab === "company" || activeTab === "profile"),
    staleTime: 60000,
  });

  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ["campaigns", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase.from("campaigns").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id && activeTab === "company",
    staleTime: 60000,
  });

  const { data: apiKeys = [], isLoading: loadingKeys } = useQuery({
    queryKey: ["api_keys", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase.from("api_keys").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id && activeTab === "developer",
    staleTime: 60000,
  });

  const { data: migrationTasks = [], isLoading: loadingMigrations } = useQuery({
    queryKey: ["migration_tasks", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await (supabase as any).from("migration_tasks").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id && activeTab === "integrations",
    refetchInterval: activeTab === "integrations" ? 5000 : false,
    staleTime: 30000,
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
      const rawKey = `sk_filedcrews_live_${rand}`;
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
  const isFoundingPartner = company?.subscription_tier === "Founding Partner" || company?.subscription_tier === "founding_partner";
  const isFreeTrial = company?.subscription_tier === "free_trial" || company?.subscription_tier === "Free" || !company?.subscription_tier;
  const maxAdmins = isFreeTrial ? 1 : (company?.max_admin_seats ?? (isFoundingPartner ? 20 : (company?.subscription_tier === "growth" ? 3 : 1)));
  const maxFieldCrew = isFreeTrial ? 2 : (company?.max_field_crew_seats ?? (isFoundingPartner ? 20 : (company?.subscription_tier === "growth" ? 7 : 2)));
  const adminPercent = Math.min((activeAdmins / maxAdmins) * 100, 100);
  const fieldPercent = Math.min((activeFieldCrew / maxFieldCrew) * 100, 100);
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);

  const handleStripeCheckout = async (planId: string) => {
    if (!company?.id) return;
    setIsRedirectingToStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe_subscription", {
        body: {
          action: "create_checkout_session",
          planId,
          companyId: company.id,
          returnUrl: `${window.location.origin}/settings?tab=billing`,
        }
      });
      if (error || !data?.url) throw new Error(data?.error || "Checkout session failed");
      window.location.href = data.url;
    } catch (err: any) {
      setIsRedirectingToStripe(false);
      toast({ title: "Checkout Error", description: err.message, variant: "destructive" });
    }
  };

  const handleOpenPortal = async () => {
    if (!company?.id) return;
    setIsRedirectingToStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe_subscription", {
        body: { action: "create_portal_session", companyId: company.id }
      });
      if (error || !data?.url) throw new Error(data?.error || "Portal session failed");
      window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Portal Error", description: err.message, variant: "destructive" });
    } finally {
      setIsRedirectingToStripe(false);
    }
  };

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

          {/* AI Agent BYOK Section */}
          <div className="space-y-4 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-600" /> AI Agent LLM Model Credentials
              </h4>
              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 gap-1 text-[10px]">
                <ShieldCheck className="h-3 w-3" /> Pre-Seeded Default
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">AI Provider</label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                >
                  <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                  <option value="gemini">Google Gemini 1.5 Pro</option>
                  <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">AI API Key (Custom or Seeded)</label>
                <Input
                  type="password"
                  placeholder="sk-proj-..."
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
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
  const [selectedPlanId, setSelectedPlanId] = useState<"free_trial" | "growth" | "founding_partner" | "enterprise">("free_trial");
  const [billingViewMode, setBillingViewMode] = useState<"select" | "review">("select");
  const [businessTaxId, setBusinessTaxId] = useState("");
  const [billingAddress, setBillingAddress] = useState(company?.address || "");

  const plans = [
    {
      id: "free_trial" as const,
      name: "Free Trial",
      badge: "14-Day Evaluation",
      badgeClass: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      borderClass: "border-border/60 hover:border-slate-400 dark:hover:border-slate-600",
      price: "$0",
      period: "/ 14 days",
      description: "Full access to core field dispatching and geofence tracking for initial evaluation.",
      specs: [
        "1 Office Administrator Seat",
        "2 Mobile Field Crew Seats",
        "14-Day Complete Platform Access"
      ],
      features: [
        "Worksite Map & Job Location Markers",
        "Geofence Time Audit & GPS Location Logs",
        "Cost Category Tracking & Expense Logs",
        "Digital Work Order Creation & Dispatch",
        "Native Android Field Crew Application"
      ]
    },
    {
      id: "growth" as const,
      name: "Growth",
      badge: "Standard Business",
      badgeClass: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      borderClass: "border-blue-200 dark:border-blue-900/60 hover:border-blue-400 dark:hover:border-blue-700",
      price: "$495",
      period: "/mo",
      description: "Complete operational suite for growing field teams needing AI dispatch and safety compliance.",
      specs: [
        "3 Office Administrator Seats",
        "7 Mobile Field Crew Seats",
        "10 Total Team Licenses"
      ],
      features: [
        "Everything in Free Trial, plus:",
        "Autonomous AI Agent Crew Dispatcher",
        "Safety Hub & Compliance Form Builder",
        "Automated Timesheet Export & Payroll Sync",
        "Change Order Workflow & Client Approval Portal",
        "Priority Phone & Direct Technical Support"
      ]
    },
    {
      id: "founding_partner" as const,
      name: "Founding Partner Council",
      badge: "Invitation-Only Council · Best Value",
      badgeClass: "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold",
      borderClass: "border-amber-400/80 dark:border-amber-500/70 bg-gradient-to-b from-amber-500/[0.03] via-card to-card shadow-md ring-1 ring-amber-400/20",
      price: "$2,899",
      period: "/yr",
      description: "Invitation-only council membership for growing home service businesses to co-design platform features.",
      specs: [
        "20 Included Licenses (Custom Role Split)",
        "Direct Founder Council Channel",
        "Save $9,101/yr vs Standard ($12k/yr)"
      ],
      features: [
        "Everything in Growth, plus:",
        "Permanent Founding Partner pricing",
        "Up to 20 active staff included",
        "Direct priority access to the founders",
        "White-glove onboarding & data migration",
        "Monthly product feedback council access",
        "Early access to new features before release",
        "Priority support with faster response times",
        "Private Founding Partner community",
        "Recognition as a founding builder"
      ]
    },
    {
      id: "enterprise" as const,
      name: "Enterprise",
      badge: "Custom Scale",
      badgeClass: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      borderClass: "border-border/60 hover:border-slate-400 dark:hover:border-slate-600",
      price: "Custom",
      period: "",
      description: "Tailored multi-regional infrastructure with custom SLA guarantees and unlimited seat options.",
      specs: [
        "Unlimited Custom Seat Allocations",
        "Dedicated Enterprise Infrastructure",
        "24/7 Dedicated Account Manager"
      ],
      features: [
        "Everything in Founding Partner, plus:",
        "Custom API & ERP integrations (SAP, Oracle, QuickBooks)",
        "99.9% Service Level Agreement (SLA)",
        "Custom compliance & audit trail retention",
        "Dedicated solution architect & team training"
      ]
    }
  ];

  const activeSelectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  const handleConfirmPlanChange = async () => {
    if (selectedPlanId === "free_trial") {
      toast({ title: "Free Trial Active", description: "Your workspace remains on the Free Trial." });
      setBillingViewMode("select");
      return;
    }
    if (selectedPlanId === "enterprise") {
      window.location.href = `mailto:enterprise@filedcrews.com?subject=${encodeURIComponent(`Enterprise Plan - ${company?.name}`)}`;
      return;
    }
    // For growth and founding_partner, initiate Stripe checkout
    await handleStripeCheckout(selectedPlanId);
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
                    <p className="text-xs text-muted-foreground mt-0.5">Annual Plan ($2,899/yr) · Active Subscription</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={handleOpenPortal} disabled={isRedirectingToStripe} className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs shrink-0">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" /> Manage Billing & Invoices
                  </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Plan Selection</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Select the subscription tier that matches your workforce size and operational requirements.</p>
            </div>
          </div>

          {/* Executive Smart ROI Anchor Banner */}
          <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 font-extrabold text-xs shrink-0">
                51% ROI SAVINGS
              </div>
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-foreground">Why 80% of scaling operations choose the Founding Partner VIP Charter</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  At $2,899/yr for 20 seats ($12.08/seat/mo), Founding Partner saves <strong className="text-foreground font-semibold">$3,041/yr</strong> compared to Growth ($5,940/yr for 10 seats) and includes direct priority access to founders.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setSelectedPlanId("founding_partner")}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9 px-4 shrink-0 rounded-xl transition-all shadow-xs"
            >
              Select VIP Charter ($2,899/yr)
            </Button>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl w-full mx-auto">
            {plans.map((p) => {
              const isSelected = selectedPlanId === p.id;
              const isFounding = p.id === "founding_partner";
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={cn(
                    "relative rounded-2xl border transition-all cursor-pointer p-6 flex flex-col justify-between bg-card hover:shadow-lg",
                    p.borderClass,
                    isSelected && "ring-2 ring-blue-600 dark:ring-blue-500 border-blue-600 dark:border-blue-500"
                  )}
                >
                  <div>
                    {/* Badge & Radio Selector */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-semibold border", p.badgeClass)}>
                        {p.badge}
                      </span>
                      <div className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0",
                        isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 dark:border-slate-600"
                      )}>
                        {isSelected && <CheckCircle className="h-3.5 w-3.5 fill-blue-600 text-white" />}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold tracking-tight text-foreground">
                      {p.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-2 mb-1">
                      <span className="text-3xl font-extrabold text-foreground tracking-tight">{p.price}</span>
                      <span className="text-xs text-muted-foreground font-medium">{p.period}</span>
                    </div>

                    {/* Sub-price Math Indicator */}
                    <div className="mb-3 text-[11px] font-medium">
                      {p.id === "growth" && <span className="text-muted-foreground">$5,940/yr annualized standard</span>}
                      {isFounding && <span className="text-emerald-600 dark:text-emerald-400 font-bold">Save $3,041/yr (51% Off) · $12/seat/mo</span>}
                      {p.id === "free_trial" && <span className="text-muted-foreground">100% Free · No credit card required</span>}
                      {p.id === "enterprise" && <span className="text-muted-foreground">Custom enterprise contract & SLA</span>}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed mb-4 min-h-[36px]">
                      {p.description}
                    </p>

                    {/* Specs Bullet Summary */}
                    <div className="space-y-2 mb-5 p-3 rounded-xl bg-muted/40 border border-border/40">
                      {p.specs.map((spec, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", isFounding ? "bg-amber-500" : "bg-blue-600 dark:bg-blue-400")} />
                          <span>{spec}</span>
                        </div>
                      ))}
                    </div>

                    {/* Features List */}
                    <div className="space-y-2.5 pt-4 border-t border-border/40">
                      {p.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90 leading-snug">
                          <CheckCircle className={cn("h-4 w-4 shrink-0 mt-0.5", isFounding ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400")} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Direct Action Button on Card */}
                  <div className="pt-6 border-t border-border/40 mt-6">
                    {p.id === "free_trial" && (
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        disabled={company?.subscription_tier === "free_trial" && !isTrialExpired}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlanId(p.id);
                          handleConfirmPlanChange();
                        }}
                        className="w-full text-xs font-bold rounded-xl h-10 transition-all"
                      >
                        {company?.subscription_tier === "free_trial" && !isTrialExpired ? "Current Plan (14-Day Trial)" : "Start Free Trial"}
                      </Button>
                    )}

                    {p.id === "growth" && (
                      <Button
                        size="sm"
                        disabled={isRedirectingToStripe}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlanId(p.id);
                          handleStripeCheckout("growth");
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-10 shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        {isRedirectingToStripe && selectedPlanId === "growth" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4" />
                        )}
                        Subscribe via Stripe ($495/mo)
                      </Button>
                    )}

                    {p.id === "founding_partner" && (
                      <Button
                        size="sm"
                        disabled={isRedirectingToStripe}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlanId(p.id);
                          handleStripeCheckout("founding_partner");
                        }}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl h-10 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        {isRedirectingToStripe && selectedPlanId === "founding_partner" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        Join VIP Charter ($2,899/yr)
                      </Button>
                    )}

                    {p.id === "enterprise" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlanId(p.id);
                          handleConfirmPlanChange();
                        }}
                        className="w-full text-xs font-bold rounded-xl h-10 border-border/60 hover:bg-muted transition-all flex items-center justify-center gap-1.5"
                      >
                        Contact Enterprise <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/60 shadow-sm mt-6">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Currently Selected Plan:</p>
              <p className="text-base font-extrabold text-foreground flex items-center gap-2">
                <span>{activeSelectedPlan.name} Tier</span>
                <span className="text-xs font-normal text-muted-foreground">({activeSelectedPlan.price}{activeSelectedPlan.period})</span>
              </p>
            </div>
            <Button
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 rounded-xl h-11 text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              onClick={() => setBillingViewMode("review")}
            >
              Review Plan Selection ({activeSelectedPlan.name}) →
            </Button>
          </div>
        </div>
      ) : (
        /* STEP 2: REVIEW & MANUAL ACTIVATION CHECKOUT VIEW (2026 Modern Mobile-Friendly Layout) */
        <div className="space-y-8 max-w-5xl mx-auto">
          {/* Header & Back Navigation */}
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBillingViewMode("select")}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5 px-0 hover:bg-transparent"
            >
              ← Back to Plan Selection
            </Button>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Plan Review & Activation</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Review your subscription plan details and submit an account activation request.</p>
            </div>
          </div>

          {/* Executive Upgrade Switcher Alert (If non-Founding Plan is currently selected) */}
          {selectedPlanId !== "founding_partner" && selectedPlanId !== "enterprise" && (
            <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/40 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-foreground text-sm">Operational Savings Alert</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-bold">Save $3,041/yr</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  You currently have <strong className="text-foreground">{activeSelectedPlan.name}</strong> selected. Upgrading to the <strong className="text-foreground">Founding Partner VIP Charter ($2,899/yr)</strong> doubles your licenses to 20 seats while saving your company <strong className="text-foreground">$3,041/yr</strong> compared to Growth ($5,940/yr).
                </p>
              </div>
              <Button
                onClick={() => setSelectedPlanId("founding_partner")}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-10 px-5 rounded-xl shrink-0 transition-all shadow-xs"
              >
                Switch to VIP Charter ($2,899/yr)
              </Button>
            </div>
          )}

          {/* Founding Partner Council Section (Value-Driven Copy) */}
          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10">
                  Limited to 20 Home Service Companies
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Founding Partner Council
              </h2>
              <p className="text-sm sm:text-base font-semibold text-foreground">
                Help shape the future of field service management while securing permanent Founding Partner privileges.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
                The Founding Partner Council is an invitation-only membership for a small group of growing home service companies that want more than just software. As a Founding Partner, you'll work directly with our leadership team, influence the product roadmap, and receive benefits that will never be available again once the program closes.
              </p>
            </div>

            {/* Founding Membership Pricing Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/30 space-y-2 max-w-3xl">
              <h3 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Founding Membership</h3>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-extrabold text-foreground tracking-tight">$2,899/year</span>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  <strong className="text-foreground font-semibold">Standard Membership:</strong> $12,000/year <span className="text-muted-foreground font-normal">(available after the Founding Partner Program closes)</span>
                </span>
              </div>
              <p className="text-xs font-semibold text-foreground pt-1">
                Includes up to <strong className="text-amber-700 dark:text-amber-300">20 active staff members</strong>.
              </p>
            </div>

            {/* What You'll Receive */}
            <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/50">
              <h3 className="text-sm font-bold text-foreground tracking-tight">What You'll Receive</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-foreground/90">
                {[
                  "Permanent Founding Partner pricing for as long as you remain a customer",
                  "Up to 20 active staff included",
                  "Direct priority access to the founders",
                  "White-glove onboarding and complimentary data migration",
                  "Priority support with faster response times",
                  "Early access to new features before public release",
                  "Direct influence over product decisions and feature priorities",
                  "Exclusive access to the private Founding Partner community",
                  "Recognition as one of the first companies helping build FiledCrews"
                ].map((b, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What We Ask From You */}
            <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/40 max-w-3xl">
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">What We Ask From You</h3>
                <p className="text-xs text-muted-foreground mt-0.5">We're looking for companies that want to help build a better field service platform.</p>
              </div>
              <div className="space-y-2 text-xs sm:text-sm text-foreground/90">
                <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">As a Founding Partner, you'll:</p>
                {[
                  "Use FiledCrews as your primary field service platform",
                  "Join one monthly product feedback session",
                  "Share honest operational feedback from your team",
                  "Help us validate new features before they're released",
                  "Be open to becoming a customer success story after achieving measurable results"
                ].map((req, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Who Should Apply */}
            <div className="space-y-1.5 max-w-3xl">
              <h3 className="text-sm font-bold text-foreground">Who Should Apply</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                The Founding Partner Council is ideal for growing HVAC, plumbing, electrical, garage door, pest control, roofing, and other home service companies that want a direct voice in the software they rely on every day.
              </p>
            </div>

            {/* Membership Closes Permanently After 20 Companies */}
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1 max-w-3xl">
              <h4 className="text-xs sm:text-sm font-bold text-foreground">Membership Closes Permanently After 20 Companies</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Once all 20 Founding Partner memberships have been accepted, this program will close permanently. New customers will join under Standard Membership pricing and will not receive Founding Partner privileges or pricing.
              </p>
            </div>

            {/* Apply CTA Button */}
            <div className="max-w-3xl">
              <Button
                onClick={() => handleStripeCheckout("founding_partner")}
                disabled={isRedirectingToStripe}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm h-12 px-8 rounded-xl transition-all shadow-sm"
              >
                <div className="flex items-center justify-center gap-2">
                  {isRedirectingToStripe ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Subscribe to Founding Partner ($2,899/yr)
                </div>
              </Button>
            </div>
          </div>

          {/* In-Screen Responsive Capability Comparison Grid (Zero Horizontal Scrollbars) */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">Plan Capability Comparison</h3>
            
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden text-xs sm:text-sm">
              {/* Header */}
              <div className="grid grid-cols-12 border-b border-border/60 bg-muted/40 p-3 sm:p-4 font-bold text-foreground items-center gap-1">
                <div className="col-span-5 sm:col-span-6">Capability</div>
                <div className="col-span-3 sm:col-span-3 text-center text-slate-700 dark:text-slate-300">Growth</div>
                <div className="col-span-4 sm:col-span-3 text-center text-amber-700 dark:text-amber-400 bg-amber-500/10 py-1 rounded-md text-[11px] sm:text-xs">Founding VIP</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border/40 font-medium">
                {[
                  { feat: "Included Team Licenses", growth: "10 Seats ($49.50/seat)", vip: "20 Seats ($12.08/seat)" },
                  { feat: "Annualized Investment", growth: "$5,940/yr ($495/mo)", vip: "$2,899/yr (Save $3,041/yr)" },
                  { feat: "Founder Channel Access", growth: "Standard queue", vip: "Direct Priority & Phone" },
                  { feat: "Roadmap Co-Design", growth: "Feature queue", vip: "Direct Priority Voting" },
                  { feat: "Quarterly Strategy Reviews", growth: "—", vip: "1-on-1 Sessions Included" },
                  { feat: "White-Glove Onboarding", growth: "Self-serve", vip: "Free Data Migration & Setup" },
                ].map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 p-3 sm:p-4 items-center hover:bg-muted/20 text-xs sm:text-sm gap-1">
                    <div className="col-span-5 sm:col-span-6 text-foreground font-semibold pr-1 leading-snug">{row.feat}</div>
                    <div className="col-span-3 sm:col-span-3 text-center text-muted-foreground text-[11px] sm:text-xs leading-snug">{row.growth}</div>
                    <div className="col-span-4 sm:col-span-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-amber-500/5 py-1 px-1 rounded-md text-[11px] sm:text-xs leading-snug">{row.vip}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form & Summary Breakdown Grid (Fully Mobile Responsive) */}
          <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-12 items-start pt-4">
            {/* Left Column: Form & Manual Payment Info */}
            <div className="lg:col-span-7 space-y-6">
              {/* Account Information */}
              <div className="space-y-3 p-4 sm:p-6 rounded-2xl border border-border/60 bg-card">
                <h3 className="text-sm font-bold text-foreground">Account Information</h3>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Work Email</label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="bg-muted/40 border-border/50 text-foreground text-xs sm:text-sm h-10 sm:h-11"
                  />
                </div>
              </div>

              {/* Activation Timeline */}
              <div className="space-y-3 p-4 sm:p-6 rounded-2xl border border-border/60 bg-card">
                <h3 className="text-sm font-bold text-foreground">Activation Timeline</h3>
                <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 text-xs sm:text-sm">
                  <p className="font-bold text-blue-900 dark:text-blue-300">Instant Automated Activation</p>
                  <p className="text-blue-700 dark:text-blue-400 mt-0.5 text-[11px] sm:text-xs">
                    Your account limits and seat quotas will be provisioned immediately upon successful payment through Stripe.
                  </p>
                </div>
              </div>

              {/* Billing Details */}
              <div className="space-y-3 p-4 sm:p-6 rounded-2xl border border-border/60 bg-card">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-foreground">Payment via Stripe</h3>
                </div>

                <div className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Secure Stripe Checkout</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                    You will be redirected to Stripe's secure checkout to enter your payment details. Your subscription will be activated instantly upon successful payment.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Business Name</label>
                    <Input
                      value={company?.name || ""}
                      readOnly
                      className="bg-muted/40 border-border/50 text-foreground text-xs sm:text-sm h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Tax ID / TIN (Optional)</label>
                    <Input
                      placeholder="e.g. 123456789"
                      value={businessTaxId}
                      onChange={(e) => setBusinessTaxId(e.target.value)}
                      className="bg-card border-border/50 text-foreground text-xs sm:text-sm h-10 sm:h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs text-muted-foreground font-medium">Billing Address</label>
                  <Input
                    placeholder="Enter company billing address"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="bg-card border-border/50 text-foreground text-xs sm:text-sm h-10 sm:h-11"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Summary Card Sidebar (Mobile Stacked / Desktop Sticky) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-5 sm:p-6 rounded-2xl border border-border/60 bg-card shadow-sm space-y-6 lg:sticky lg:top-6">
                {/* Plan Header (No Crown Icon) */}
                <div className="flex items-center gap-3.5 pb-4 border-b border-border/40">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{activeSelectedPlan.name} Tier</h3>
                    <p className="text-xs text-muted-foreground">Selected subscription plan</p>
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">Plan Rate</span>
                    <span className="font-bold text-foreground">{activeSelectedPlan.price}{activeSelectedPlan.period}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>License Quota</span>
                    <span className="text-foreground font-medium">Included</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Onboarding & Setup</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">$0.00 (Complimentary)</span>
                  </div>
                </div>

                {/* Subtotal & Total */}
                <div className="pt-4 border-t border-border/40 space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{activeSelectedPlan.price}.00</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                    <span>Tax</span>
                    <span className="text-[11px] sm:text-xs">Itemized on invoice</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-2">
                    <span className="text-sm sm:text-base font-bold text-foreground">Total Due</span>
                    <span className="text-2xl sm:text-3xl font-black text-foreground">{activeSelectedPlan.price}.00</span>
                  </div>
                </div>

                {/* Submit Action Button */}
                <Button
                  onClick={handleConfirmPlanChange}
                  disabled={isRedirectingToStripe}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 sm:h-12 text-xs sm:text-sm rounded-xl shadow-sm transition-all"
                >
                  {isRedirectingToStripe ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Connecting to Stripe...</> : selectedPlanId === "free_trial" ? "Continue on Free Trial" : `Proceed to Stripe Checkout (${activeSelectedPlan.price}${activeSelectedPlan.period})`}
                </Button>

                <p className="text-[10px] sm:text-[11px] text-center text-muted-foreground leading-relaxed px-2">
                  {selectedPlanId === "free_trial" ? "Your free trial will continue for 14 days with full access." : "You will be redirected to Stripe's secure checkout. Your subscription activates immediately upon successful payment."}
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

  if (activeTab === "billing") {
    return (
      <>
        <SEO title="Billing & Plans - Settings" description="Manage subscription plans, seats, and billing." path="/settings" noIndex />
        <DashboardLayout activeTab="settings" companyName={company?.name || ""} companyPrefix={company?.prefix || ""} companyId={company?.id || ""}>
          <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto font-sans space-y-6">
            {/* Top Navigation Bar with Back Arrow to Settings */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("profile")}
                  className="gap-2 rounded-xl text-xs font-semibold hover:bg-muted border-border/60 shrink-0 shadow-xs"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Settings
                </Button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-primary" /> Billing & Subscription Plans
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                    Manage your company's tier, seat allocations, invoices, and automated Stripe billing.
                  </p>
                </div>
              </div>

              {/* Action buttons on the top right */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenPortal}
                  disabled={isRedirectingToStripe}
                  className="text-xs font-semibold gap-1.5 rounded-xl border-border/60 shadow-xs"
                >
                  {isRedirectingToStripe ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                  Stripe Customer Portal
                </Button>
              </div>
            </div>

            {/* Full Width Billing & Plans Content */}
            <div className="w-full">
              {renderBilling()}
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

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
