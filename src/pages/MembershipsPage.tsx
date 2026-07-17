import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Award,
  Plus,
  Trash2,
  Edit2,
  Users,
  Calendar,
  DollarSign,
  Briefcase,
  Search,
  CheckCircle2,
  Percent,
} from "lucide-react";
import { format, addYears } from "date-fns";

// ─── Interfaces ─────────────────────────────────────────────────────
interface Customer {
  id: string;
  name: string;
  email: string | null;
}

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  billing_frequency: string;
  visits_per_year: number;
  discount_percent: number;
  description: string | null;
  is_active: boolean;
}

interface Membership {
  id: string;
  plan_id: string;
  customer_id: string;
  status: string;
  start_date: string;
  renewal_date: string | null;
  created_at: string;
  contract_value: number | null;
  billing_terms: string | null;
  included_visits: number | null;
  completed_visits: number | null;
  sla_response_hours: number | null;
  auto_renew: boolean | null;
  renewal_status: string | null;
  contract_notes: string | null;
  contract_document_url: string | null;
  plan?: MembershipPlan;
  customer?: Customer;
}

export default function MembershipsPage() {
  const { company, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);

  // Form states - Plan Builder
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planFreq, setPlanFreq] = useState("annually");
  const [planVisits, setPlanVisits] = useState("2");
  const [planDiscount, setPlanDiscount] = useState("10");
  const [planDesc, setPlanDesc] = useState("");
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

  // Form states - Customer Enrollment
  const [enrollCustomerId, setEnrollCustomerId] = useState("");
  const [enrollPlanId, setEnrollPlanId] = useState("");
  const [enrollCustomValue, setEnrollCustomValue] = useState("");
  const [enrollBillingTerms, setEnrollBillingTerms] = useState("Net 30");
  const [enrollIncludedVisits, setEnrollIncludedVisits] = useState("2");
  const [enrollSlaResponseHours, setEnrollSlaResponseHours] = useState("");
  const [enrollAutoRenew, setEnrollAutoRenew] = useState(true);
  const [enrollContractNotes, setEnrollContractNotes] = useState("");
  const [enrollContractDocumentUrl, setEnrollContractDocumentUrl] = useState("");

  // 1. Fetch Membership Plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["membership_plans", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("membership_plans")
        .select("*")
        .eq("company_id", company.id)
        .order("name");
      if (error) throw error;
      return data as MembershipPlan[];
    },
    enabled: !!company?.id,
  });

  // 2. Fetch Enrolled Customers/Memberships
  const { data: memberships = [], isLoading: membershipsLoading } = useQuery({
    queryKey: ["memberships", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("memberships")
        .select(`
          *,
          plan:membership_plans(*),
          customer:customers(id, name, email)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((m: any) => ({
        ...m,
        plan: m.plan ? (m.plan as MembershipPlan) : undefined,
        customer: m.customer ? (m.customer as Customer) : undefined,
      })) as Membership[];
    },
    enabled: !!company?.id,
  });

  // 3. Fetch Customers
  const { data: customers = [] } = useQuery({
    queryKey: ["customers", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, email")
        .eq("company_id", company.id)
        .order("name");
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!company?.id,
  });

  // ─── Plan Mutations ───────────────────────────────────────────────
  const savePlanMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) throw new Error("No company linked");
      if (!planName.trim()) throw new Error("Plan name is required");

      const payload = {
        company_id: company.id,
        name: planName.trim(),
        price: parseFloat(planPrice) || 0.00,
        billing_frequency: planFreq,
        visits_per_year: parseInt(planVisits) || 0,
        discount_percent: parseFloat(planDiscount) || 0.00,
        description: planDesc.trim() || null,
        is_active: true,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from("membership_plans")
          .update(payload)
          .eq("id", editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("membership_plans").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership_plans", company?.id] });
      toast({ title: editingPlan ? "Plan updated" : "Plan created" });
      closePlanDialog();
    },
    onError: (err: any) => {
      toast({ title: "Error saving plan", description: err.message, variant: "destructive" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("membership_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership_plans", company?.id] });
      toast({ title: "Plan deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Error deleting", description: err.message, variant: "destructive" });
    },
  });

  // ─── Enrollment Mutations ─────────────────────────────────────────
  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!enrollCustomerId || !enrollPlanId) throw new Error("Customer and plan are required");

      const selectedPlan = plans.find(p => p.id === enrollPlanId);
      const finalValue = enrollCustomValue ? parseFloat(enrollCustomValue) : (selectedPlan ? selectedPlan.price : 0.00);

      // Calculate renewal date based on billing frequency
      const startDate = new Date();
      const renewalDate = addYears(startDate, 1); // standard annual agreement terms

      const { error } = await supabase.from("memberships").insert({
        plan_id: enrollPlanId,
        customer_id: enrollCustomerId,
        status: "active",
        start_date: startDate.toISOString().split("T")[0],
        renewal_date: renewalDate.toISOString().split("T")[0],
        contract_value: finalValue,
        billing_terms: enrollBillingTerms,
        included_visits: parseInt(enrollIncludedVisits) || (selectedPlan ? selectedPlan.visits_per_year : 2),
        completed_visits: 0,
        sla_response_hours: enrollSlaResponseHours ? parseInt(enrollSlaResponseHours) : null,
        auto_renew: enrollAutoRenew,
        contract_notes: enrollContractNotes.trim() || null,
        contract_document_url: enrollContractDocumentUrl.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships", company?.id] });
      toast({ title: "Customer enrolled successfully" });
      setEnrollDialogOpen(false);
      setEnrollCustomerId("");
      setEnrollPlanId("");
      setEnrollCustomValue("");
      setEnrollBillingTerms("Net 30");
      setEnrollIncludedVisits("2");
      setEnrollSlaResponseHours("");
      setEnrollAutoRenew(true);
      setEnrollContractNotes("");
      setEnrollContractDocumentUrl("");
    },
    onError: (err: any) => {
      toast({ title: "Error enrolling", description: err.message, variant: "destructive" });
    },
  });

  // Helpers
  const openPlanDialog = (plan?: MembershipPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanName(plan.name);
      setPlanPrice(plan.price.toString());
      setPlanFreq(plan.billing_frequency);
      setPlanVisits(plan.visits_per_year.toString());
      setPlanDiscount(plan.discount_percent.toString());
      setPlanDesc(plan.description || "");
    } else {
      setEditingPlan(null);
      setPlanName("");
      setPlanPrice("99.00");
      setPlanFreq("annually");
      setPlanVisits("2");
      setPlanDiscount("10");
      setPlanDesc("");
    }
    setPlanDialogOpen(true);
  };

  const closePlanDialog = () => {
    setPlanDialogOpen(false);
    setEditingPlan(null);
  };

  // KPIs
  const activeMembersCount = useMemo(() => {
    return memberships.filter(m => m.status === "active").length;
  }, [memberships]);

  const projectedRevenue = useMemo(() => {
    return memberships.reduce((sum, m) => {
      if (m.status !== "active") return sum;
      const val = m.contract_value ?? m.plan?.price ?? 0;
      const freq = m.plan?.billing_frequency || "annually";
      const multiplier = freq === "monthly" ? 12 : freq === "quarterly" ? 4 : 1;
      return sum + (val * multiplier);
    }, 0);
  }, [memberships]);

  const renewalAlertsCount = useMemo(() => {
    return memberships.filter(m => m.renewal_status === "in_renewal_window").length;
  }, [memberships]);

  if (authLoading || plansLoading || membershipsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredMemberships = memberships.filter((m) => {
    const q = searchQuery.toLowerCase();
    return !q ||
      (m.customer?.name || "").toLowerCase().includes(q) ||
      (m.plan?.name || "").toLowerCase().includes(q);
  });

  return (
    <>
      <SEO
        title="Memberships & Agreements"
        description="Customer membership plans, service level agreements, and recurring revenue pipelines."
        path="/memberships"
        noIndex
      />
      <DashboardLayout
        activeTab="memberships"
        companyName={company?.name || ""}
        companyPrefix={company?.prefix || ""}
        companyId={company?.id || ""}
      >
        <div className="p-3 sm:p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Service Agreements & Memberships
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Configure priority service club agreements, recurring payments, and discount rules.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openPlanDialog()} className="gap-1.5 text-xs">
                <Plus className="h-4 w-4" /> Create Plan
              </Button>
              <Button onClick={() => setEnrollDialogOpen(true)} className="gap-2 text-xs">
                <Users className="h-4 w-4" /> Enroll Customer
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/40">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Active Agreements</p>
                  <p className="text-2xl font-black text-foreground mt-0.5">{activeMembersCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Projected ARR</p>
                  <p className="text-2xl font-black text-emerald-600 mt-0.5">${projectedRevenue.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Renewal Alerts (30d)</p>
                  <p className="text-2xl font-black text-amber-600 mt-0.5">{renewalAlertsCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Active Members Table */}
            <Card className="lg:col-span-2 border-border/50 card-shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Enrolled Club Members</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search enrolled members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Agreement Plan</TableHead>
                      <TableHead>Contract Value</TableHead>
                      <TableHead>SLA Target</TableHead>
                      <TableHead>Visits</TableHead>
                      <TableHead>Renewal Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMemberships.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                          No active club members found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMemberships.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-semibold text-slate-800">{m.customer?.name}</TableCell>
                          <TableCell className="text-xs">{m.plan?.name}</TableCell>
                          <TableCell className="font-mono text-xs font-bold text-slate-900">
                            ${(m.contract_value ?? m.plan?.price ?? 0).toFixed(2)}
                            {m.contract_value !== null && m.plan?.price !== m.contract_value && (
                              <span className="text-[10px] text-muted-foreground block font-normal">(Custom)</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {m.sla_response_hours ? `${m.sla_response_hours} hr response` : "N/A"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {m.completed_visits ?? 0} / {m.included_visits ?? m.plan?.visits_per_year ?? 2}
                          </TableCell>
                          <TableCell className="text-xs font-semibold">
                            {m.renewal_date ? format(new Date(m.renewal_date), "MMM dd, yyyy") : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              m.renewal_status === "in_renewal_window"
                                ? "bg-amber-500/10 text-amber-600 border-amber-200"
                                : m.status === "expired"
                                ? "bg-red-500/10 text-red-600 border-red-200"
                                : "bg-green-500/10 text-green-600 border-green-200"
                            }>
                              {m.renewal_status === "in_renewal_window" ? "renewal window" : m.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Plans List Panel */}
            <Card className="border-border/50 card-shadow-md">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Agreement Options
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {plans.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-lg bg-muted/20">
                    <p className="text-xs text-muted-foreground">No plans built yet.</p>
                  </div>
                ) : (
                  plans.map((p) => (
                    <div key={p.id} className="p-3 border border-border/40 rounded-lg bg-muted/10 flex items-center justify-between group">
                      <div>
                        <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          {p.name}
                          <Badge variant="outline" className="text-[10px] py-0 px-1 capitalize">
                            {p.billing_frequency}
                          </Badge>
                        </div>
                        <div className="text-xs text-primary font-mono font-bold mt-0.5">
                          ${p.price.toFixed(2)} — {p.discount_percent}% off orders
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openPlanDialog(p)} className="h-7 w-7">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Delete plan "${p.name}"?`)) deletePlanMutation.mutate(p.id);
                          }}
                          className="h-7 w-7 text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Plan Builder Modal */}
        <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                {editingPlan ? "Modify Agreement Plan" : "Create Agreement Plan"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Plan Name *</label>
                <Input
                  placeholder="e.g. Gold HVAC Maintenance Club"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Price ($) *</label>
                  <Input
                    type="number"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Billing Frequency</label>
                  <Select value={planFreq} onValueChange={setPlanFreq}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Visits / Year</label>
                  <Input
                    type="number"
                    value={planVisits}
                    onChange={(e) => setPlanVisits(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Discount Off Orders (%)</label>
                  <Input
                    type="number"
                    value={planDiscount}
                    onChange={(e) => setPlanDiscount(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closePlanDialog}>Cancel</Button>
              <Button onClick={() => savePlanMutation.mutate()} disabled={savePlanMutation.isPending}>
                Save Agreement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Customer Enrollment Modal */}
        <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Enroll Club Member
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Select Customer *</label>
                  <Select value={enrollCustomerId} onValueChange={setEnrollCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Select Plan *</label>
                  <Select value={enrollPlanId} onValueChange={setEnrollPlanId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} (${p.price})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-border/40 pt-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">B2B Contract Adjustments (Optional)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Negotiated Contract Value ($)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 1500.00"
                      value={enrollCustomValue}
                      onChange={(e) => setEnrollCustomValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">SLA Response Window (hrs)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 4"
                      value={enrollSlaResponseHours}
                      onChange={(e) => setEnrollSlaResponseHours(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Included Visits / Year</label>
                  <Input
                    type="number"
                    value={enrollIncludedVisits}
                    onChange={(e) => setEnrollIncludedVisits(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Billing Terms</label>
                  <Input
                    placeholder="e.g. Net 30"
                    value={enrollBillingTerms}
                    onChange={(e) => setEnrollBillingTerms(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Contract Auto-Renewal</label>
                <Select value={enrollAutoRenew ? "true" : "false"} onValueChange={(val) => setEnrollAutoRenew(val === "true")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Enabled (Auto-renews on date)</SelectItem>
                    <SelectItem value="false">Disabled (Requires manual renewal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Signed Contract Link (URL)</label>
                <Input
                  placeholder="https://storage.provider.com/contract.pdf"
                  value={enrollContractDocumentUrl}
                  onChange={(e) => setEnrollContractDocumentUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Contract Conditions / Notes</label>
                <Input
                  placeholder="Additional priority notes..."
                  value={enrollContractNotes}
                  onChange={(e) => setEnrollContractNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}>
                Enroll Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}
