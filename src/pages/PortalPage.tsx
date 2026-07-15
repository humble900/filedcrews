import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Building,
  UserCheck,
  Calendar,
  Wrench,
  Receipt,
  FileText,
  AlertTriangle,
  FileCheck,
  Send,
  LogOut,
} from "lucide-react";
import { format } from "date-fns";

// Customer Interface
interface PortalCustomer {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  billing_address: string | null;
}

export default function PortalPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [customer, setCustomer] = useState<PortalCustomer | null>(null);
  const [checkingInfo, setCheckingInfo] = useState(false);

  // Active sub-tab inside portal
  const [portalTab, setPortalTab] = useState<"jobs" | "assets" | "billing" | "request">("jobs");

  // Service Request Form State
  const [requestDesc, setRequestDesc] = useState("");
  const [requestUrgency, setRequestUrgency] = useState<"low" | "normal" | "urgent" | "emergency">("normal");

  // Verify client credentials
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !phoneInput.trim()) {
      toast({ title: "Error", description: "Email and Phone are required.", variant: "destructive" });
      return;
    }

    setCheckingInfo(true);
    try {
      const { data, error } = await supabase.rpc("portal_verify_customer", {
        p_email: emailInput.trim(),
        p_phone: phoneInput.trim(),
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setCustomer(data[0] as PortalCustomer);
        toast({ title: "Logged In", description: `Welcome back, ${data[0].name}` });
      } else {
        toast({ title: "Verification Failed", description: "No matching record found. Please verify your email & phone.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error verifying customer", description: err.message, variant: "destructive" });
    } finally {
      setCheckingInfo(false);
    }
  };

  // Queries (enabled only when customer is set)
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["portal_jobs", customer?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("portal_get_jobs", { p_customer_id: customer?.id });
      if (error) throw error;
      return data || [];
    },
    enabled: !!customer?.id,
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ["portal_assets", customer?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("portal_get_assets", { p_customer_id: customer?.id });
      if (error) throw error;
      return data || [];
    },
    enabled: !!customer?.id,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["portal_invoices", customer?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("portal_get_invoices", { p_customer_id: customer?.id });
      if (error) throw error;
      return data || [];
    },
    enabled: !!customer?.id,
  });

  const { data: estimates = [], isLoading: estimatesLoading } = useQuery({
    queryKey: ["portal_estimates", customer?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("portal_get_estimates", { p_customer_id: customer?.id });
      if (error) throw error;
      return data || [];
    },
    enabled: !!customer?.id,
  });

  // Submit service request mutation
  const submitRequestMutation = useMutation({
    mutationFn: async () => {
      if (!customer) throw new Error("No customer profile");
      if (!requestDesc.trim()) throw new Error("Please write a service description");

      const { error } = await supabase.from("service_requests").insert({
        company_id: customer.company_id,
        customer_id: customer.id,
        description: requestDesc.trim(),
        urgency: requestUrgency,
        status: "new",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Service Request Sent", description: "Our dispatch team has received your ticket and will follow up shortly." });
      setRequestDesc("");
      setRequestUrgency("normal");
      setPortalTab("jobs");
    },
    onError: (err: any) => {
      toast({ title: "Failed to submit request", description: err.message, variant: "destructive" });
    },
  });

  const handleSignOut = () => {
    setCustomer(null);
    setEmailInput("");
    setPhoneInput("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Booked":
      case "Scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "In Progress":
      case "Dispatched":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400";
      case "Completed":
      case "Paid":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400";
    }
  };

  return (
    <>
      <SEO
        title={customer ? `Client Portal - ${customer.name}` : "Client Care Portal Lookup"}
        description="Verify your customer profile to schedule support, pay invoices, check estimates, and inspect service histories."
        path="/portal"
        noIndex
      />

      <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
        {/* Portal Header */}
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
          <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight leading-none">Ocrem</h1>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Client Care Portal</span>
              </div>
            </div>
            {customer && (
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="text-xs text-slate-400 hover:text-white gap-1.5 h-9"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </Button>
            )}
          </div>
        </header>

        {/* Portal Body */}
        <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-8">
          {!customer ? (
            /* Passcode Verification Screen */
            <div className="max-w-[420px] mx-auto py-12 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-white">Client Portal Access</h2>
                <p className="text-sm text-slate-400">
                  Verify your account by entering your registered billing email and phone number.
                </p>
              </div>

              <Card className="bg-slate-950 border-slate-800/80 card-shadow-md text-white">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" /> Identity Verification
                  </CardTitle>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-semibold block">Registered Email Address</label>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-white focus-visible:ring-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-semibold block">Registered Phone Number</label>
                      <Input
                        type="tel"
                        placeholder="e.g. 512-555-0199"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-white focus-visible:ring-primary"
                        required
                      />
                    </div>
                  </CardContent>
                  <CardContent className="pt-0">
                    <Button type="submit" className="w-full h-11 font-bold text-white bg-primary hover:bg-primary/95" disabled={checkingInfo}>
                      {checkingInfo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Access My Portal
                    </Button>
                  </CardContent>
                </form>
              </Card>
            </div>
          ) : (
            /* Active Portal Renders */
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white">{customer.name}</h2>
                  <p className="text-xs text-slate-400">
                    {customer.email} · {customer.phone}
                  </p>
                  {customer.billing_address && (
                    <p className="text-xs text-slate-500 font-medium">Billing: {customer.billing_address}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={portalTab === "jobs" ? "default" : "outline"}
                    onClick={() => setPortalTab("jobs")}
                    className="text-xs font-bold"
                  >
                    My Scheduled Jobs
                  </Button>
                  <Button
                    variant={portalTab === "assets" ? "default" : "outline"}
                    onClick={() => setPortalTab("assets")}
                    className="text-xs font-bold"
                  >
                    My Equipment
                  </Button>
                  <Button
                    variant={portalTab === "billing" ? "default" : "outline"}
                    onClick={() => setPortalTab("billing")}
                    className="text-xs font-bold"
                  >
                    Billing & Quotes
                  </Button>
                  <Button
                    variant={portalTab === "request" ? "default" : "outline"}
                    onClick={() => setPortalTab("request")}
                    className="text-xs font-bold bg-primary hover:bg-primary/95 text-white"
                  >
                    Request Support
                  </Button>
                </div>
              </div>

              {/* Tab 1: Scheduled Jobs */}
              {portalTab === "jobs" && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-300">My Service History</h3>
                  {jobsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                  ) : jobs.length === 0 ? (
                    <p className="text-sm text-slate-500 py-6 text-center">No service history scheduled yet.</p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {jobs.map((job: any) => (
                        <Card key={job.id} className="bg-slate-950 border-slate-800 text-white">
                          <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                            <div>
                              <CardTitle className="text-sm font-bold">{job.title}</CardTitle>
                              <CardDescription className="text-xs text-slate-400 mt-0.5">
                                {job.scheduled_start && format(new Date(job.scheduled_start), "MMM dd, yyyy")}
                              </CardDescription>
                            </div>
                            <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                          </CardHeader>
                          <CardContent className="text-xs text-slate-400">
                            {job.description || "General maintenance diagnostics."}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Equipment Assets */}
              {portalTab === "assets" && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-300">My Installed Hardware & Assets</h3>
                  {assetsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                  ) : assets.length === 0 ? (
                    <p className="text-sm text-slate-500 py-6 text-center">No assets logged.</p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {assets.map((asset: any) => (
                        <Card key={asset.id} className="bg-slate-950 border-slate-800 text-white">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center justify-between">
                              {asset.name}
                              {asset.equipment_type && (
                                <Badge variant="secondary" className="text-[10px] uppercase">{asset.equipment_type}</Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-xs text-slate-400 space-y-1">
                            {asset.make && <p>Brand: <span className="font-semibold text-slate-200">{asset.make} {asset.model}</span></p>}
                            <p>Serial Number: <span className="font-mono text-slate-200">{asset.serial_number || "N/A"}</span></p>
                            {asset.install_date && (
                              <p>Installed: <span className="text-slate-200">{format(new Date(asset.install_date + "T00:00:00"), "MM/dd/yyyy")}</span></p>
                            )}
                            {asset.warranty_expiry && (
                              <p className="text-amber-500 font-semibold">Warranty Expiration: {format(new Date(asset.warranty_expiry), "MM/dd/yyyy")}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Billing & Quotes */}
              {portalTab === "billing" && (
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Estimates Column */}
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-slate-300">My Estimate Proposals</h3>
                    {estimatesLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : estimates.length === 0 ? (
                      <p className="text-sm text-slate-500 py-4">No pending proposals.</p>
                    ) : (
                      estimates.map((est: any) => (
                        <Card key={est.id} className="bg-slate-950 border-slate-800 text-white flex justify-between p-4 items-center">
                          <div>
                            <p className="font-bold text-sm">{est.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Value: ${Number(est.total_amount).toFixed(2)}</p>
                            {est.valid_until && (
                              <p className="text-[10px] text-slate-500 mt-1">Valid Until: {format(new Date(est.valid_until + "T00:00:00"), "MM/dd/yyyy")}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {est.status === "Sent" ? (
                              <a href={`/approve/${est.approval_token}`}>
                                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1 text-xs">
                                  Review & Sign <FileText className="h-3 w-3" />
                                </Button>
                              </a>
                            ) : (
                              <Badge className="bg-slate-800 text-slate-300">{est.status}</Badge>
                            )}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>

                  {/* Invoices Column */}
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-slate-300">My Invoices Ledger</h3>
                    {invoicesLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : invoices.length === 0 ? (
                      <p className="text-sm text-slate-500 py-4">No invoice records on file.</p>
                    ) : (
                      invoices.map((inv: any) => (
                        <Card key={inv.id} className="bg-slate-950 border-slate-800 text-white flex justify-between p-4 items-center">
                          <div>
                            <p className="font-bold text-sm">{inv.invoice_number || `INV-${inv.id.slice(0, 6)}`}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Amount: ${Number(inv.amount).toFixed(2)}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Issued: {format(new Date(inv.created_at), "MM/dd/yyyy")}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Badge className={getStatusColor(inv.payment_status)}>{inv.payment_status}</Badge>
                            {inv.payment_status !== "Paid" && (
                              <a href={`/pay/${inv.id}`}>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 text-xs">
                                  Pay Invoice <Receipt className="h-3 w-3" />
                                </Button>
                              </a>
                            )}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Submit Service Request */}
              {portalTab === "request" && (
                <div className="max-w-[600px] mx-auto space-y-4">
                  <h3 className="text-base font-bold text-slate-300">File a New Service Ticket</h3>
                  <Card className="bg-slate-950 border-slate-800 text-white">
                    <CardContent className="space-y-4 pt-6">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold block">Ticket Urgency Level</label>
                        <Select
                          value={requestUrgency}
                          onValueChange={(val: any) => setRequestUrgency(val)}
                        >
                          <SelectTrigger className="bg-slate-900 border-slate-800 text-white h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-white">
                            <SelectItem value="low">Low - Routine Check</SelectItem>
                            <SelectItem value="normal">Normal - Standard Issue</SelectItem>
                            <SelectItem value="urgent">Urgent - Needs attention in 24h</SelectItem>
                            <SelectItem value="emergency">Emergency - Active hazard or leak</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-semibold block">Tell us what needs maintenance *</label>
                        <Textarea
                          placeholder="Please describe the issue (e.g. AC unit is blowing warm air, or pipe leaking in utility closet)..."
                          value={requestDesc}
                          onChange={(e) => setRequestDesc(e.target.value)}
                          rows={4}
                          className="bg-slate-900 border-slate-800 text-white text-xs placeholder:text-slate-500"
                        />
                      </div>
                    </CardContent>
                    <CardContent className="pt-0">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setPortalTab("jobs")} className="text-xs text-slate-400 hover:text-white">
                          Cancel
                        </Button>
                        <Button
                          onClick={() => submitRequestMutation.mutate()}
                          disabled={submitRequestMutation.isPending || !requestDesc.trim()}
                          className="bg-primary hover:bg-primary/95 text-white gap-1.5 text-xs font-bold"
                        >
                          {submitRequestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          Submit Ticket
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
