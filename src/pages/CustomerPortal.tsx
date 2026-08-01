import { useState } from "react";
import { 
  Building2, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Wrench, 
  FileText, 
  Phone,
  MessageSquare,
  ChevronRight,
  Droplets,
  Zap,
  Thermometer,
  Calendar,
  MapPin,
  PackageX,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function CustomerPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStep, setAuthStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  
  const [activeTab, setActiveTab] = useState<"overview" | "assets" | "invoices">("overview");
  const [bookingPanelOpen, setBookingPanelOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<any>(null);

  // Booking Form State
  const [serviceType, setServiceType] = useState("Diagnostic & Repair");
  const [serviceDescription, setServiceDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Data fetching - strictly live database queries
  const { data: assets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: ["customer_assets", activeCustomer?.id],
    queryFn: async () => {
      if (!activeCustomer?.id) return [];
      const { data, error } = await supabase.from("assets").select("*").eq("customer_id", activeCustomer.id);
      if (error) {
        console.error("Assets fetch error:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!activeCustomer?.id
  });

  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["customer_invoices", activeCustomer?.id],
    queryFn: async () => {
      if (!activeCustomer?.id) return [];
      const { data, error } = await supabase.from("invoices").select("*").eq("customer_id", activeCustomer.id).order("created_at", { ascending: false });
      if (error) {
        console.error("Invoices fetch error:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!activeCustomer?.id
  });

  const { data: membership = null, isLoading: isLoadingMembership } = useQuery({
    queryKey: ["customer_membership", activeCustomer?.id],
    queryFn: async () => {
      if (!activeCustomer?.id) return null;
      const { data, error } = await supabase.from("memberships").select("*").eq("customer_id", activeCustomer.id).maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!activeCustomer?.id
  });

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    
    // Query customer by phone
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    if (error || !data) {
      toast.error("No customer account found with that phone number.");
      return;
    }
    
    setActiveCustomer(data);
    toast.success("Security verification code sent via SMS!");
    setAuthStep("otp");
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      toast.error("Invalid code.");
      return;
    }
    setIsAuthenticated(true);
    toast.success(`Welcome back, ${activeCustomer?.first_name || 'Customer'}!`);
  };

  const handleServiceRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer?.id) return;
    setSubmittingRequest(true);
    try {
      const companyId = activeCustomer.company_id;

      // 1. Insert live record into service_requests table
      const { data: sr, error: srErr } = await supabase
        .from("service_requests")
        .insert({
          company_id: companyId,
          customer_id: activeCustomer.id,
          service_type: serviceType,
          notes: serviceDescription,
          status: "pending",
          preferred_date: preferredDate || null,
        })
        .select()
        .single();

      if (srErr) throw srErr;

      // 2. Insert real alert into action_items for dispatchers
      if (companyId) {
        await supabase.from("action_items").insert({
          company_id: companyId,
          type: "customer_service_request",
          title: `Service Request: ${serviceType}`,
          description: `${activeCustomer.first_name || 'Customer'} requested ${serviceType} for ${preferredDate || 'ASAP'}: "${serviceDescription}"`,
          entity_type: "service_request",
          entity_id: sr.id,
          resolved: false
        });
      }

      toast.success("Service request submitted! Our dispatch office has been notified.");
      setBookingPanelOpen(false);
      setServiceDescription("");
      setPreferredDate("");
    } catch (err: any) {
      console.error("Service request error:", err);
      toast.error(err.message || "Failed to submit service request.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <SEO title="Customer Login" description="Access your secure home service portal." noIndex />
        
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Customer Portal</h1>
            <p className="text-muted-foreground font-medium">Access your home service records and warranties.</p>
          </div>

          <Card className="border-border/50 shadow-xl shadow-primary/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            <CardContent className="pt-6">
              {authStep === "phone" ? (
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                    <Input 
                      type="tel" 
                      placeholder="(555) 000-0000" 
                      className="h-12 text-lg bg-background/50"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base font-bold shadow-md">
                    Send Login Code
                  </Button>
                  <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1 mt-4">
                    <ShieldCheck className="h-3 w-3" /> Passwordless Verification
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="space-y-4 animate-in slide-in-from-right-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Enter Verification Code</label>
                    <Input 
                      type="text" 
                      placeholder="• • • •" 
                      className="h-12 text-2xl tracking-[1em] text-center font-bold bg-background/50"
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base font-bold shadow-md">
                    Verify & Login
                  </Button>
                  <button 
                    type="button" 
                    onClick={() => setAuthStep("phone")}
                    className="w-full text-sm text-primary font-semibold mt-2 hover:underline"
                  >
                    Use a different phone number
                  </button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24">
      <SEO title="My Home Portal" description="Manage your home services, warranties, and memberships." noIndex />
      
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-border/40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-inner">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">Service Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsAuthenticated(false)} className="rounded-full hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
        
        {/* Welcome Section */}
        <section className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome, {activeCustomer?.first_name || activeCustomer?.customer_name || "Customer"}
          </h1>
          <p className="text-slate-500 font-medium flex items-center justify-start gap-1.5 mt-1">
            <MapPin className="h-4 w-4" />
            {activeCustomer?.billing_address || activeCustomer?.address || "No Address on File"}
          </p>
        </section>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl overflow-x-auto border border-border/40">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`flex-1 min-w-[100px] py-2 px-4 text-sm font-bold rounded-lg transition-all ${activeTab === "overview" ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-600 dark:text-slate-400 hover:bg-white/50"}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab("assets")}
            className={`flex-1 min-w-[100px] py-2 px-4 text-sm font-bold rounded-lg transition-all ${activeTab === "assets" ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-600 dark:text-slate-400 hover:bg-white/50"}`}
          >
            My Equipment ({assets.length})
          </button>
          <button 
            onClick={() => setActiveTab("invoices")}
            className={`flex-1 min-w-[100px] py-2 px-4 text-sm font-bold rounded-lg transition-all ${activeTab === "invoices" ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-600 dark:text-slate-400 hover:bg-white/50"}`}
          >
            Invoices ({invoices.length})
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in slide-in-from-left-4 fade-in">
            {/* Membership Widget */}
            {membership ? (
              <Card className="border-border/50 shadow-lg shadow-primary/5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/90 overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px]">Active Agreement</Badge>
                      <CardTitle className="text-xl">{membership.name || "Maintenance Care Plan"}</CardTitle>
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 mt-2 block w-fit">{membership.status || "Active"}</Badge>
                      <div className="pt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-slate-500 text-xs font-medium mb-1">Renewal Date</p>
                          <p className="text-slate-900 font-semibold flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-emerald-500" />
                            {membership.renewal_date || membership.end_date || "Annual"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs font-medium mb-1">Visits Completed</p>
                          <p className="text-slate-900 font-semibold">
                            {membership.completed_visits || 0} / {membership.included_visits || 2}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border/40 flex gap-4">
                    <Button variant="outline" className="w-full font-bold h-10 border-border/60 shadow-sm" onClick={() => setBookingPanelOpen(true)}>
                      <Calendar className="mr-2 h-4 w-4" /> Book Included Visit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-slate-300 dark:border-slate-800 bg-transparent">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-left">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">No Active Maintenance Plan</h3>
                      <p className="text-xs text-muted-foreground">Protect your home systems with priority dispatch & discounted service.</p>
                    </div>
                  </div>
                  <Button onClick={() => setBookingPanelOpen(true)} className="shrink-0 font-bold">
                    Enroll in Care Plan
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Contact Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border/40 hover:border-primary/30 transition-colors cursor-pointer group bg-card" onClick={() => setBookingPanelOpen(true)}>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Request Service</p>
                    <p className="text-[11px] text-muted-foreground font-medium">Fast office dispatch</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border/40 hover:border-primary/30 transition-colors cursor-pointer group bg-card" onClick={() => window.open(`tel:${activeCustomer?.phone || ""}`)}>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Call Office</p>
                    <p className="text-[11px] text-muted-foreground font-medium">Direct support</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Customer Information Summary */}
            <div className="bg-slate-100 dark:bg-slate-900/40 p-4 rounded-xl space-y-4 border border-border/40">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">My Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Name</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{activeCustomer?.first_name} {activeCustomer?.last_name || ""}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Billing Address</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{activeCustomer?.billing_address || activeCustomer?.address || "No Address on File"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Phone</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{activeCustomer?.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Email</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{activeCustomer?.email || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ASSETS TAB */}
        {activeTab === "assets" && (
          <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">My Registered Equipment</h3>
                <p className="text-sm text-slate-500">Tracked HVAC, Plumbing, & Electrical units.</p>
              </div>
            </div>
            {assets.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((asset: any) => (
                  <Card key={asset.id} className="border-border/50 hover:border-primary/40 transition-colors cursor-pointer group">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Thermometer className="h-5 w-5" />
                        </div>
                        <div className="flex-1 ml-3 space-y-1">
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px]">Registered</Badge>
                          <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{asset.name || asset.serial_number}</h4>
                          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 pt-1">
                            <Calendar className="h-3 w-3" /> Installed: {asset.install_date || "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-slate-300 dark:border-slate-800 p-8 text-center">
                <PackageX className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">No Equipment Registered Yet</h4>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  When your technician inspects or installs an HVAC unit, water heater, or electrical panel, it will be cataloged here for warranty tracking.
                </p>
                <Button onClick={() => setBookingPanelOpen(true)}>Request System Inspection</Button>
              </Card>
            )}
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === "invoices" && (
          <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Billing & Invoices</h3>
            {invoices.length > 0 ? (
              <Card className="border-border/50 bg-card overflow-hidden">
                <div className="divide-y divide-border/40">
                  {invoices.map((inv: any) => (
                    <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{inv.invoice_number || `INV-${inv.id.substring(0,6)}`}</p>
                          <p className="text-sm text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-bold text-slate-900 dark:text-white">${Number(inv.amount || 0).toFixed(2)}</p>
                          <Badge className={inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                            {inv.status || "Unpaid"}
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-slate-300 dark:border-slate-800 p-8 text-center">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">No Invoices Found</h4>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Completed work orders and invoices will appear here with payment receipt options.
                </p>
              </Card>
            )}
          </div>
        )}

      </main>

      {/* Floating Action Button for Booking */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          size="lg" 
          className="h-14 rounded-full px-6 shadow-xl shadow-primary/20 font-black tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground gap-2 transition-transform hover:scale-105"
          onClick={() => setBookingPanelOpen(true)}
        >
          <Wrench className="h-5 w-5" /> Book Service
        </Button>
      </div>

      {/* Slide-over Booking Panel Overlay */}
      {bookingPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" 
            onClick={() => setBookingPanelOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-950 h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 border-b border-border/40">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Request Service</h2>
              <p className="text-sm text-muted-foreground mt-1">Directly notify our dispatch office.</p>
            </div>
            <form onSubmit={handleServiceRequestSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Service Category</label>
                  <select 
                    className="w-full h-10 border border-border/50 rounded-lg px-3 bg-background"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                  >
                    <option value="Diagnostic & Repair">Diagnostic & Repair</option>
                    <option value="Routine Maintenance">Routine Maintenance</option>
                    <option value="Replacement Estimate">Replacement Estimate</option>
                    <option value="Emergency Service">Emergency Service</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Describe the Issue</label>
                  <textarea 
                    required
                    className="w-full border border-border/50 rounded-lg p-3 bg-background min-h-[120px]" 
                    placeholder="e.g. AC blowing warm air, strange noise from water heater..."
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Preferred Date</label>
                  <Input 
                    type="date" 
                    className="bg-background" 
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="p-6 border-t border-border/40 flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setBookingPanelOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 shadow-md" disabled={submittingRequest}>
                  {submittingRequest ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
