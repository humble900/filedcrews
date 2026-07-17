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
  MessageSquare, ShieldCheck, Zap, Download, Key, Trash2, User, Megaphone,
  Lock, Puzzle, Code, Clock,
} from "lucide-react";
import { format } from "date-fns";

type SettingsTab = "profile" | "company" | "billing" | "modules" | "developer";

const TABS: { id: SettingsTab; label: string; icon: any; ownerOnly?: boolean }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "company", label: "Company", icon: Building, ownerOnly: true },
  { id: "billing", label: "Billing & Plans", icon: CreditCard },
  { id: "modules", label: "Modules", icon: Puzzle, ownerOnly: true },
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
        const { data, error } = await supabase.from(tbl).select("*").eq("company_id", company.id);
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
    </div>
  );

  // ─── Billing Tab ───
  const renderBilling = () => (
    <div className="space-y-6">
      {!isFoundingPartner && (
        <Card className={cn("border-border/50", isTrialExpired ? "border-rose-500/30 bg-rose-500/5" : "border-blue-500/30 bg-blue-500/5")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={cn("p-2 rounded-lg", isTrialExpired ? "bg-rose-500/15" : "bg-blue-500/15")}>
              <Clock className={cn("h-5 w-5", isTrialExpired ? "text-rose-500" : "text-blue-400")} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{isTrialExpired ? "Trial Expired" : `${daysRemaining} Days Remaining`}</p>
              <p className="text-xs text-muted-foreground">{isTrialExpired ? "Upgrade to continue." : "Full access during trial."}</p>
            </div>
            {isTrialExpired && <Badge variant="destructive" className="text-[10px]">Expired</Badge>}
          </CardContent>
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {isFoundingPartner ? (
            <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-yellow-500/5 to-amber-500/5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-500"><Crown className="h-6 w-6 animate-bounce" /></div>
                  <div>
                    <CardTitle className="text-xl font-extrabold">Founding Partner Membership</CardTitle>
                    <CardDescription className="text-amber-500/80 font-semibold text-xs tracking-wider uppercase">VIP Charter · Lifetime Tier</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground/90">Your company is an official <strong>Founding Partner</strong> with full lifetime access.</p>
                <div className="grid gap-3 sm:grid-cols-2 pt-2">
                  {[{ icon: CheckCircle, t: "Unlimited Office & Crew Seats" }, { icon: ShieldCheck, t: "Priority Roadmap Co-Design" }, { icon: Zap, t: "White-Glove Migrations" }, { icon: MessageSquare, t: "Direct WhatsApp Hotline" }].map(({ icon: I, t }) => (
                    <div key={t} className="flex items-center gap-2.5 text-xs text-foreground/80 bg-background/50 p-3 rounded-lg border border-border/40"><I className="h-4 w-4 text-emerald-500 shrink-0" /><span>{t}</span></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-[#233558]/80 bg-[#14223c]/40 backdrop-blur-sm shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/15"><Crown className="h-5 w-5 text-blue-400" /></div>
                  <div><CardTitle className="text-lg font-bold">Founding Partner Charter</CardTitle><CardDescription>Lifetime membership with roadmap input.</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>Join our closed cohort with a <strong>lifetime license</strong> and direct roadmap design input.</p>
                <div className="space-y-2 border-y border-border/40 py-4">
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Charter Privileges:</h4>
                  <ul className="grid gap-2 sm:grid-cols-2 text-xs">
                    {["Lifetime license", "Unlimited seats", "Co-design feedback", "White-glove onboarding"].map(t => (
                      <li key={t} className="flex items-center gap-2 text-foreground/90"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{t}</li>
                    ))}
                  </ul>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold" asChild>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="gap-2"><MessageSquare className="h-4 w-4" /> Apply for Charter</a>
                </Button>
              </CardContent>
            </Card>
          )}
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-base font-bold flex items-center gap-2"><Building className="h-4 w-4 text-primary" /> SaaS Pricing</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Office Seats</p>
                  <div className="flex items-baseline gap-1 pt-1"><span className="text-2xl font-black">$49</span><span className="text-xs text-muted-foreground">/ seat / month</span></div>
                  <p className="text-xs text-muted-foreground pt-1.5">Admin, Finance, Dispatcher dashboard access.</p>
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Crew Seats</p>
                  <div className="flex items-baseline gap-1 pt-1"><span className="text-2xl font-black">$19</span><span className="text-xs text-muted-foreground">/ seat / month</span></div>
                  <p className="text-xs text-muted-foreground pt-1.5">Mobile checklists, location, face check.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="border-border/50 h-full">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> License Usage</CardTitle>
              <CardDescription>Active seats vs. plan limits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingStaff ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div> : (<>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium"><span>Office Seats</span><span className="font-semibold">{activeAdmins} / {isFoundingPartner ? "\u221e" : maxAdmins}</span></div>
                  {!isFoundingPartner && <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden border border-border/30"><div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${adminPercent}%` }} /></div>}
                  <p className="text-[10px] text-muted-foreground">Owner, Admin, Finance, Dispatcher.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium"><span>Crew Seats</span><span className="font-semibold">{activeFieldCrew} / {isFoundingPartner ? "\u221e" : maxFieldCrew}</span></div>
                  {!isFoundingPartner && <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden border border-border/30"><div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${fieldPercent}%` }} /></div>}
                  <p className="text-[10px] text-muted-foreground">Field crew mobile accounts.</p>
                </div>
                {!isFoundingPartner && (activeAdmins >= maxAdmins || activeFieldCrew >= maxFieldCrew) && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg flex gap-2.5 text-xs font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0" /><div><p>Seat limit reached!</p><p className="text-[10px] text-rose-500/80 font-normal">Upgrade to add more.</p></div>
                  </div>
                )}
              </>)}
            </CardContent>
          </Card>
        </div>
      </div>
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

  const tabContent: Record<SettingsTab, () => JSX.Element> = { profile: renderProfile, company: renderCompany, billing: renderBilling, modules: renderModules, developer: renderDeveloper };

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
