import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Crown,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Users,
  Building,
  MessageSquare,
  ShieldCheck,
  Zap,
  Megaphone,
  Download,
  Key,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function BillingPage() {
  const { company } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Marketing campaign states
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignSource, setNewCampaignSource] = useState("Google");
  const [exporting, setExporting] = useState(false);

  // REST API Key states
  const [apiKeyName, setApiKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  // Fetch campaigns
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ["campaigns", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  const addCampaignMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) return;
      if (!newCampaignName.trim()) throw new Error("Campaign name is required");

      const { error } = await supabase.from("campaigns").insert({
        company_id: company.id,
        name: newCampaignName.trim(),
        source: newCampaignSource,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", company?.id] });
      setNewCampaignName("");
      toast({ title: "Campaign Added", description: "Attribution campaign registered successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to add campaign", description: err.message, variant: "destructive" });
    }
  });

  const toggleCampaignMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("campaigns")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", company?.id] });
      toast({
        title: "Campaign updated",
        description: "Status successfully updated.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to update campaign",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Fetch API keys
  const { data: apiKeys = [], isLoading: loadingKeys } = useQuery({
    queryKey: ["api_keys", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  const createApiKeyMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) return;
      if (!apiKeyName.trim()) throw new Error("Key description name is required");

      const rand = Array.from({ length: 24 }, () => Math.random().toString(36)[2]).join("");
      const rawKey = `sk_onsite_live_${rand}`;

      // Save visually masked/hashed key
      const maskedKey = `${rawKey.slice(0, 15)}...${rawKey.slice(-4)}`;

      const { error } = await supabase.from("api_keys").insert({
        company_id: company.id,
        name: apiKeyName.trim(),
        key_hash: maskedKey,
        is_active: true,
      });

      if (error) throw error;
      return rawKey;
    },
    onSuccess: (rawKey) => {
      queryClient.invalidateQueries({ queryKey: ["api_keys", company?.id] });
      setGeneratedKey(rawKey ?? null);
      setApiKeyName("");
      toast({
        title: "API key generated",
        description: "Your key has been registered in the database.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Generation failed",
        description: err.message,
        variant: "destructive",
      });
    }
  });

  const toggleApiKeyMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("api_keys")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api_keys", company?.id] });
      toast({
        title: "Key updated",
        description: "API Key status toggled.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    }
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api_keys", company?.id] });
      toast({
        title: "Key deleted",
        description: "API key has been revoked and removed.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Revocation failed",
        description: err.message,
        variant: "destructive",
      });
    }
  });

  // Client-side CSV database export backup utility
  const handleExportData = async () => {
    if (!company?.id) return;
    setExporting(true);
    try {
      const tables = [
        { name: "customers", select: "*" },
        { name: "projects", select: "*" },
        { name: "jobs", select: "*" },
        { name: "invoices", select: "*" },
        { name: "payments", select: "*" },
        { name: "estimates", select: "*" },
        { name: "timesheet_entries", select: "*" },
        { name: "form_responses", select: "*" },
        { name: "campaigns", select: "*" }
      ];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table.name)
          .select(table.select)
          .eq("company_id", company.id);

        if (error) {
          console.error(`Error exporting ${table.name}:`, error);
          continue;
        }

        if (!data || data.length === 0) continue;

        // Convert JSON array to CSV format string
        const headers = Object.keys(data[0]);
        const csvRows = [
          headers.join(","), // header row
          ...data.map((row: any) =>
            headers
              .map((fieldName) => {
                const val = row[fieldName];
                const cleanVal = val === null || val === undefined ? "" : String(val).replace(/"/g, '""');
                return `"${cleanVal}"`;
              })
              .join(",")
          )
        ];
        const csvContent = csvRows.join("\n");

        // Trigger file download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${table.name}_backup_${format(new Date(), "yyyyMMdd")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({ title: "Export Complete", description: "CSV backups downloaded successfully for all tables with records." });
    } catch (err: any) {
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };
  const enabledModules = (company?.enabled_modules as Record<string, boolean>) || {
    safety: true,
    change_orders: true,
    memberships: true,
    timesheets: true,
    forms: true
  };

  const updateModuleMutation = useMutation({
    mutationFn: async (updated: Record<string, boolean>) => {
      if (!company?.id) return;
      const { error } = await supabase
        .from("companies")
        .update({ enabled_modules: updated })
        .eq("id", company.id);
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate company queries to reload state
      queryClient.invalidateQueries({ queryKey: ["company"] });
      toast({ title: "Module settings updated", description: "Successfully updated module configurations." });
    },
    onError: (err: any) => {
      toast({ title: "Error updating settings", description: err.message, variant: "destructive" });
    }
  });

  const updateModule = (key: string, val: boolean) => {
    const next = { ...enabledModules, [key]: val };
    updateModuleMutation.mutate(next);
  };

  // Fetch staff count to calculate current seat usage
  const { data: staffList = [], isLoading: loadingStaff } = useQuery({
    queryKey: ["billing_staff_usage", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, global_role, is_active")
        .eq("company_id", company.id)
        .eq("is_active", true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  const activeAdmins = staffList.filter(
    (s) => s.global_role === "Admin" || s.global_role === "Finance" || s.global_role === "Dispatcher"
  ).length;

  const activeFieldCrew = staffList.filter((s) => s.global_role === "Field Crew").length;

  const maxAdmins = company?.max_admin_seats ?? 3;
  const maxFieldCrew = company?.max_field_crew_seats ?? 10;
  const isFoundingPartner = company?.subscription_tier === "Founding Partner";

  const adminPercent = Math.min((activeAdmins / maxAdmins) * 100, 100);
  const fieldPercent = Math.min((activeFieldCrew / maxFieldCrew) * 100, 100);

  const whatsappMessage = encodeURIComponent(
    "Hi there! We are interested in joining the Founding Partner Charter for OnSite Crew Manager. Please send us details on how we can get started."
  );
  const whatsappUrl = `https://wa.me/14094229714?text=${whatsappMessage}`;

  return (
    <>
      <SEO
        title="Billing & Subscription Plans"
        description="Monitor seat allocations, billing cycles, and SaaS subscription tiers."
        path="/billing"
        noIndex
      />
      <DashboardLayout
        activeTab="billing"
        companyName={company?.name || ""}
        companyPrefix={company?.prefix || ""}
        companyId={company?.id || ""}
      >
        <div className="p-3 sm:p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto font-sans">
          {/* Header */}
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Billing & Subscription Plans
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Audit license counts, seat allocations, and platform partnership agreements.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left/Middle: Subscription Info */}
            <div className="lg:col-span-2 space-y-6">
              {isFoundingPartner ? (
                /* Founding Partner Active View */
                <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-yellow-500/5 to-amber-500/5 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-500/15 text-amber-500">
                        <Crown className="h-6 w-6 animate-bounce" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-extrabold text-foreground flex items-center gap-1.5">
                          Founding Partner Membership
                        </CardTitle>
                        <CardDescription className="text-amber-500/80 font-semibold text-xs tracking-wider uppercase">
                          VIP Charter Member · Active Lifetime Tier
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      Congratulations! Your company is designated as an official **Founding Partner**.
                      You have full lifetime access to OnSite Crew Manager with premium privileges, shaping the FSM platform built for your specific workflow.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 pt-2">
                      <div className="flex items-center gap-2.5 text-xs text-foreground/80 bg-background/50 p-3 rounded-lg border border-border/40">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Unlimited Office & Crew Seats</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-foreground/80 bg-background/50 p-3 rounded-lg border border-border/40">
                        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Priority Roadmap Co-Design Power</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-foreground/80 bg-background/50 p-3 rounded-lg border border-border/40">
                        <Zap className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>White-Glove Database Migrations</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-foreground/80 bg-background/50 p-3 rounded-lg border border-border/40">
                        <MessageSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Direct Developer WhatsApp Hotline</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Free/Trial Upgrade Pitch View */
                <Card className="border-[#233558]/80 bg-[#14223c]/40 backdrop-blur-sm shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400">
                        <Crown className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">Founding Partner Charter</CardTitle>
                        <CardDescription>
                          Upgrade to lifetime membership and help shape our roadmap.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                    <p>
                      We are currently onboarding a closed cohort of forward-thinking field service operators to participate in our **Founding Partner Charter**. Instead of recurring monthly SaaS subscription plans, founding partners receive a **lifetime license** with direct roadmap design input.
                    </p>
                    
                    <div className="space-y-2 border-y border-border/40 py-4 my-2">
                      <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Charter Privileges:</h4>
                      <ul className="grid gap-2 sm:grid-cols-2 text-xs">
                        <li className="flex items-center gap-2 text-foreground/90">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>Lifetime license (no monthly bills)</span>
                        </li>
                        <li className="flex items-center gap-2 text-foreground/90">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>Unlimited seat allocations</span>
                        </li>
                        <li className="flex items-center gap-2 text-foreground/90">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>Direct co-design feedback channels</span>
                        </li>
                        <li className="flex items-center gap-2 text-foreground/90">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>White-glove onboarding & imports</span>
                        </li>
                      </ul>
                    </div>

                    <p className="text-xs">
                      *Note: Because we provide high-touch white-glove setup for each partner, registrations are audited and processed manually.
                    </p>

                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <Button
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-md shadow-indigo-500/10"
                        asChild
                      >
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                          <MessageSquare className="h-4 w-4" /> Apply for Founding Charter
                        </a>
                      </Button>
                      <Button variant="outline" className="border-border/60 hover:bg-muted/10" asChild>
                        <a href="https://wa.me/14094229714" target="_blank" rel="noopener noreferrer">
                          Contact Support
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Standard Seat pricing schedule detail */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" />
                    Standard SaaS Seat Pricing Schedule
                  </CardTitle>
                  <CardDescription>
                    Billing tiers when self-serve automated cards payment roll out.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Office Dashboard Seats</p>
                      <div className="flex items-baseline gap-1 pt-1">
                        <span className="text-2xl font-black text-foreground">$49</span>
                        <span className="text-xs text-muted-foreground">/ seat / month</span>
                      </div>
                      <p className="text-xs text-muted-foreground pt-1.5">
                        Access to scheduling calendar, geofences, CRM, invoicing, change orders, and reports dashboard.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mobile Crew Seats</p>
                      <div className="flex items-baseline gap-1 pt-1">
                        <span className="text-2xl font-black text-foreground">$19</span>
                        <span className="text-xs text-muted-foreground">/ seat / month</span>
                      </div>
                      <p className="text-xs text-muted-foreground pt-1.5">
                        Mobile app checklist, location triggers, face check gate uploads, and shift log updates.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Seat Usage Meter Card */}
            <div className="lg:col-span-1">
              <Card className="border-border/50 shadow-sm h-full">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Users className="h-4.5 w-4.5 text-primary" />
                    License Usage Monitor
                  </CardTitle>
                  <CardDescription>
                    Current seat limits allocated for your company directory.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loadingStaff ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {/* Admin Seats Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-foreground">Office Seats (Admin/Finance)</span>
                          <span className="text-muted-foreground font-semibold">
                            {activeAdmins} / {isFoundingPartner ? "∞" : maxAdmins}
                          </span>
                        </div>
                        {!isFoundingPartner && (
                          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden border border-border/30">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${adminPercent}%` }}
                            />
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          Used for full dashboard access roles (Owner, Admin, Finance, Dispatcher).
                        </p>
                      </div>

                      {/* Field Crew Seats Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-foreground">Mobile Crew Seats</span>
                          <span className="text-muted-foreground font-semibold">
                            {activeFieldCrew} / {isFoundingPartner ? "∞" : maxFieldCrew}
                          </span>
                        </div>
                        {!isFoundingPartner && (
                          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden border border-border/30">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all duration-500"
                              style={{ width: `${fieldPercent}%` }}
                            />
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          Used for field staff checkins and mobile verification accounts.
                        </p>
                      </div>

                      {/* Warning box if limits are close */}
                      {!isFoundingPartner && (activeAdmins >= maxAdmins || activeFieldCrew >= maxFieldCrew) && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg flex gap-2.5 text-xs font-medium">
                          <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
                          <div className="space-y-1">
                            <p>Seat limit reached!</p>
                            <p className="text-[10px] text-rose-500/80 leading-relaxed font-normal">
                              To allocate more licenses to your crew, upgrade to Founding Partner membership.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* System Modules Panel */}
          <Card className="border-border/50 shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                System Module Controls
              </CardTitle>
              <CardDescription>
                Toggle FSM modules to show/hide sections globally across the workspace (Progressive Disclosure).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="flex items-center justify-between p-3 border rounded-xl bg-card">
                <div>
                  <span className="font-semibold text-sm block">Safety Hub</span>
                  <span className="text-[10px] text-muted-foreground">Compliance check-sheets</span>
                </div>
                <input
                  type="checkbox"
                  checked={enabledModules.safety !== false}
                  onChange={(e) => updateModule("safety", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-xl bg-card">
                <div>
                  <span className="font-semibold text-sm block">Change Orders</span>
                  <span className="text-[10px] text-muted-foreground">Contract variations</span>
                </div>
                <input
                  type="checkbox"
                  checked={enabledModules.change_orders !== false}
                  onChange={(e) => updateModule("change_orders", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-xl bg-card">
                <div>
                  <span className="font-semibold text-sm block">Memberships</span>
                  <span className="text-[10px] text-muted-foreground">Priority service agreements</span>
                </div>
                <input
                  type="checkbox"
                  checked={enabledModules.memberships !== false}
                  onChange={(e) => updateModule("memberships", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-xl bg-card">
                <div>
                  <span className="font-semibold text-sm block">Timesheets</span>
                  <span className="text-[10px] text-muted-foreground">Automated punch hours</span>
                </div>
                <input
                  type="checkbox"
                  checked={enabledModules.timesheets !== false}
                  onChange={(e) => updateModule("timesheets", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Marketing Campaigns Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Megaphone className="h-4.5 w-4.5 text-primary" />
                  Marketing Campaigns
                </CardTitle>
                <CardDescription>
                  Track sales and booked revenue origins using advertising channel attribution.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Campaign Name (e.g. Summer Special)"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    className="flex-1 text-xs"
                  />
                  <select
                    value={newCampaignSource}
                    onChange={(e) => setNewCampaignSource(e.target.value)}
                    className="border border-input rounded-md px-2 text-xs bg-background max-w-[120px]"
                  >
                    <option value="Google">Google</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Referral">Referral</option>
                    <option value="Flyer">Flyer</option>
                    <option value="Direct">Direct</option>
                  </select>
                  <Button
                    onClick={() => addCampaignMutation.mutate()}
                    disabled={addCampaignMutation.isPending}
                    size="sm"
                    className="font-bold text-xs"
                  >
                    Add
                  </Button>
                </div>

                <div className="border rounded-xl divide-y divide-border/20 overflow-hidden bg-card/30">
                  {loadingCampaigns ? (
                    <div className="p-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                  ) : campaigns.length === 0 ? (
                    <p className="p-4 text-center text-xs text-muted-foreground italic">No marketing campaigns registered yet.</p>
                  ) : (
                    campaigns.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-3 text-xs">
                        <div>
                          <span className="font-bold text-foreground block">{c.name}</span>
                          <span className="text-[10px] text-muted-foreground">Source: {c.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={c.is_active ? "default" : "secondary"} className="text-[10px] px-1 py-0">
                            {c.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <input
                            type="checkbox"
                            checked={c.is_active}
                            onChange={(e) => toggleCampaignMutation.mutate({ id: c.id, is_active: e.target.checked })}
                            className="h-3.5 w-3.5 rounded text-primary focus:ring-primary"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Full Data Export Panel */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Download className="h-4.5 w-4.5 text-primary" />
                  Full Database Backups
                </CardTitle>
                <CardDescription>
                  Download complete historical exports of customer databases, timesheets, and invoices as raw CSV backups.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20 text-center space-y-3">
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Safeguard your workspace. Triggering this export compiles records from all primary system tables into separate structured Excel-friendly CSV spreadsheets.
                  </p>
                  <Button
                    onClick={handleExportData}
                    disabled={exporting}
                    className="font-bold text-xs gap-1.5 w-full sm:w-auto bg-primary text-white hover:bg-primary/95"
                  >
                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Export System Databases
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Developer Integrations & API Keys */}
          <Card className="border-border/50 shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Key className="h-4.5 w-4.5 text-primary" />
                Developer API Integrations
              </CardTitle>
              <CardDescription>
                Generate private REST API tokens to connect OnSite Crew Manager to external FSM tools, webhooks, or accounting platforms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {generatedKey && (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" /> API Token Generated Successfully!
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-muted-foreground"
                      onClick={() => setGeneratedKey(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Make sure to copy this token now. For your security, you will not be able to view it again.
                  </p>
                  <div className="flex items-center gap-2 bg-background p-2 rounded-lg border border-emerald-500/20 max-w-md">
                    <code className="text-xs font-mono text-emerald-400 break-all select-all flex-1">
                      {generatedKey}
                    </code>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 items-end max-w-xl">
                <div className="flex-1 space-y-1.5 w-full">
                  <label className="text-[11px] font-semibold text-muted-foreground">Key Name / Description</label>
                  <Input
                    placeholder="e.g. QuickBooks Accounting Connect"
                    value={apiKeyName}
                    onChange={(e) => setApiKeyName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <Button
                  onClick={() => createApiKeyMutation.mutate()}
                  disabled={createApiKeyMutation.isPending || !apiKeyName.trim()}
                  className="font-bold text-xs h-9 bg-primary text-white hover:bg-primary/95 px-4 w-full sm:w-auto shrink-0"
                >
                  {createApiKeyMutation.isPending ? "Generating…" : "Generate Token"}
                </Button>
              </div>

              <div className="border border-border/40 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Token Name</TableHead>
                      <TableHead className="text-xs">Key Token Prefix</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Created</TableHead>
                      <TableHead className="text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingKeys ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                          Loading integration tokens...
                        </TableCell>
                      </TableRow>
                    ) : apiKeys.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground italic">
                          No API tokens registered yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      apiKeys.map((key: any) => (
                        <TableRow key={key.id} className="hover:bg-muted/5">
                          <TableCell className="font-semibold text-xs">{key.name}</TableCell>
                          <TableCell className="font-mono text-[11px] text-muted-foreground">{key.key_hash}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={key.is_active ? "default" : "secondary"} className="text-[10px] px-1 py-0">
                                {key.is_active ? "Active" : "Inactive"}
                              </Badge>
                              <input
                                type="checkbox"
                                checked={key.is_active}
                                onChange={(e) => toggleApiKeyMutation.mutate({ id: key.id, is_active: e.target.checked })}
                                className="h-3.5 w-3.5 rounded text-primary focus:ring-primary cursor-pointer"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">
                            {format(new Date(key.created_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm(`Revoke and delete API token "${key.name}"?`)) {
                                  deleteApiKeyMutation.mutate(key.id);
                                }
                              }}
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              title="Revoke API Key"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}
