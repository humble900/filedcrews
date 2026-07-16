import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardList, TrendingUp, DollarSign, UserCheck, AlertTriangle, AlertCircle, ShieldAlert, CheckCircle, ArrowRight, RefreshCcw, Landmark, Percent, Wrench, FileText, LineChart as LucideLineChart, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface DashboardOverviewProps {
  companyId: string;
}

interface ActionItem {
  id: string;
  type: string;
  entity_type: string;
  entity_id: string;
  title: string;
  description: string | null;
  severity: string;
  action_url: string | null;
  resolved: boolean;
  created_at: string;
}

export default function DashboardOverview({ companyId }: DashboardOverviewProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activePipelineFilter, setActivePipelineFilter] = useState<string | null>(null);

  // 1. Fetch Pipeline Stage Counts
  const { data: pipelineCounts = { Lead: 0, Booked: 0, Scheduled: 0, Dispatched: 0, "In Progress": 0, Completed: 0, Invoiced: 0, Paid: 0, Cancelled: 0 } } = useQuery({
    queryKey: ["pipeline_counts", companyId],
    queryFn: async () => {
      // Fetch open leads count
      const { count: openLeadsCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .not("status", "in", '("Won","Lost")');

      // Fetch jobs grouped by status and filter by company through project relation
      const { data: jobsData, error: jobsErr } = await supabase
        .from("jobs")
        .select("status, project:projects!inner(company_id)")
        .eq("project.company_id", companyId);

      if (jobsErr) throw jobsErr;

      const counts = {
        Lead: openLeadsCount || 0,
        Booked: 0,
        Scheduled: 0,
        Dispatched: 0,
        "In Progress": 0,
        Completed: 0,
        Invoiced: 0,
        Paid: 0,
        Cancelled: 0,
      };

      jobsData?.forEach((j) => {
        const status = j.status as keyof typeof counts;
        if (status in counts) {
          counts[status] = (counts[status] || 0) + 1;
        }
      });

      return counts;
    },
    enabled: !!companyId,
  });

  // 2. Fetch Sales/Performance KPIs
  const { data: kpis = { 
    bookedRevenue: 0, 
    completedRevenue: 0, 
    closeRate: 0, 
    outstandingAR: 0,
    pendingEstimatesCount: 0,
    pendingEstimatesValue: 0,
    activeCrewCount: 0,
    openIncidentsCount: 0,
    dailyTrends: []
  }, isLoading: kpisLoading } = useQuery({
    queryKey: ["dashboard_kpis", companyId],
    queryFn: async () => {
      // a. Booked Revenue: Sum of estimated values of open leads + booked/scheduled jobs
      const { data: leadsVal } = await supabase
        .from("leads")
        .select("estimated_value")
        .eq("company_id", companyId)
        .not("status", "in", '("Won","Lost")');

      const leadsSum = leadsVal?.reduce((sum, l) => sum + Number(l.estimated_value || 0), 0) || 0;

      // Sum from jobs default prices if set (filtered by company)
      const { data: jobsVal } = await supabase
        .from("jobs")
        .select("job_type:job_type_id(default_price), project:projects!inner(company_id)")
        .eq("project.company_id", companyId)
        .eq("status", "Booked");

      const jobsSum = jobsVal?.reduce((sum, j: any) => sum + Number(j.job_type?.default_price || 0), 0) || 0;

      // b. Completed Revenue: Invoices total for Completed/Paid jobs (filtered by company)
      const { data: invoicesCompleted } = await supabase
        .from("invoices")
        .select("amount, job:jobs!inner(project:projects!inner(company_id))")
        .eq("status", "Approved")
        .eq("job.project.company_id", companyId);

      const completedSum = invoicesCompleted?.reduce((sum, inv) => sum + Number(inv.amount || 0), 0) || 0;

      // c. Close Rate: Won leads vs total resolved leads
      const { data: wonLeads } = await supabase
        .from("leads")
        .select("status")
        .eq("company_id", companyId)
        .eq("status", "Won");

      const { data: totalResolved } = await supabase
        .from("leads")
        .select("status")
        .eq("company_id", companyId)
        .in("status", ["Won", "Lost"]);

      const wonCount = wonLeads?.length || 0;
      const totalResolvedCount = totalResolved?.length || 0;
      const rate = totalResolvedCount > 0 ? (wonCount / totalResolvedCount) * 100 : 0;

      // d. Outstanding AR: Invoices unpaid/partially paid (filtered by company)
      const { data: unpaidInvoices } = await supabase
        .from("invoices")
        .select("amount, job:jobs!inner(project:projects!inner(company_id))")
        .in("payment_status", ["Unpaid", "Partially Paid"])
        .eq("job.project.company_id", companyId);

      const arSum = unpaidInvoices?.reduce((sum, inv) => sum + Number(inv.amount || 0), 0) || 0;

      // e. Pending Estimates: Count & Sum of Sent/Viewed estimates
      const { data: pendingEstimates } = await supabase
        .from("estimates")
        .select("total_amount")
        .eq("company_id", companyId)
        .in("status", ["Sent", "Viewed"]);
      
      const estimatesCount = pendingEstimates?.length || 0;
      const estimatesSum = pendingEstimates?.reduce((sum, est) => sum + Number(est.total_amount || 0), 0) || 0;

      // f. Active Crew Clocked-In Today: Find geofence_events from last 24h
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      const { data: recentEvents } = await supabase
        .from("geofence_events")
        .select(`
          event_type,
          staff_id,
          staff_profiles!inner(company_id)
        `)
        .eq("staff_profiles.company_id", companyId)
        .gte("created_at", dayAgo.toISOString())
        .order("created_at", { ascending: false });

      // Group by staff_id to check latest status
      const staffStatusMap = new Map<string, string>();
      recentEvents?.forEach((ev: any) => {
        if (!staffStatusMap.has(ev.staff_id)) {
          staffStatusMap.set(ev.staff_id, ev.event_type);
        }
      });
      const activeCrewCount = Array.from(staffStatusMap.values()).filter(status => ['entered', 'logged_in_inside', 'inside'].includes(status)).length;

      // g. Unresolved Incident Reports count
      const { data: openIncidentsData } = await supabase
        .from("incident_reports")
        .select("id, projects!inner(company_id)")
        .eq("projects.company_id", companyId)
        .in("status", ["Open", "Investigating"]);
      const openIncidentsCount = openIncidentsData?.length || 0;

      // h. Fetch data for the last 7 days to build real sparkline trends
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      // 1. Leads/Jobs created per day (for Booked Revenue trend)
      const { data: recentLeads } = await supabase
        .from("leads")
        .select("estimated_value, created_at")
        .eq("company_id", companyId)
        .gte("created_at", sevenDaysAgo.toISOString());

      const { data: recentJobs } = await supabase
        .from("jobs")
        .select("job_type:job_type_id(default_price), created_at, project:projects!inner(company_id)")
        .eq("project.company_id", companyId)
        .eq("status", "Booked")
        .gte("created_at", sevenDaysAgo.toISOString());

      // 2. Invoices approved per day (for Completed Sales trend)
      const { data: recentInvoices } = await supabase
        .from("invoices")
        .select("amount, created_at, job:jobs!inner(project:projects!inner(company_id))")
        .eq("status", "Approved")
        .eq("job.project.company_id", companyId)
        .gte("created_at", sevenDaysAgo.toISOString());

      // 3. Estimates created per day (for Proposals trend)
      const { data: recentEstimates } = await supabase
        .from("estimates")
        .select("total_amount, created_at")
        .eq("company_id", companyId)
        .gte("created_at", sevenDaysAgo.toISOString());

      // 4. Geofence check-ins per day (for Active Crew trend)
      const { data: recentGeofence } = await supabase
        .from("geofence_events")
        .select("created_at, staff_profiles!inner(company_id)")
        .eq("staff_profiles.company_id", companyId)
        .in("event_type", ["entered", "logged_in_inside", "inside"])
        .gte("created_at", sevenDaysAgo.toISOString());

      // Generate 7-day array
      const dailyTrends = Array.from({ length: 7 }).map((_, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - idx));
        const dateStr = d.toLocaleDateString("en-US", { weekday: "short" });
        const dateKey = d.toISOString().split("T")[0];

        // Sum booked revenue
        const leadsVal = recentLeads?.filter(l => l.created_at.startsWith(dateKey))
          .reduce((sum, l) => sum + Number(l.estimated_value || 0), 0) || 0;
        const jobsVal = recentJobs?.filter((j: any) => j.created_at.startsWith(dateKey))
          .reduce((sum, j: any) => sum + Number(j.job_type?.default_price || 0), 0) || 0;

        // Sum completed revenue
        const invoicesVal = recentInvoices?.filter(i => i.created_at.startsWith(dateKey))
          .reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0;

        // Sum proposals
        const estimatesVal = recentEstimates?.filter(e => e.created_at.startsWith(dateKey))
          .reduce((sum, e) => sum + Number(e.total_amount || 0), 0) || 0;

        // Active crew count
        const crewVal = recentGeofence?.filter(g => g.created_at.startsWith(dateKey)).length || 0;

        return {
          day: dateStr,
          booked: leadsVal + jobsVal,
          completed: invoicesVal,
          proposals: estimatesVal,
          crew: crewVal,
        };
      });

      return {
        bookedRevenue: leadsSum + jobsSum,
        completedRevenue: completedSum,
        closeRate: rate,
        outstandingAR: arSum,
        pendingEstimatesCount: estimatesCount,
        pendingEstimatesValue: estimatesSum,
        activeCrewCount: activeCrewCount,
        openIncidentsCount: openIncidentsCount,
        dailyTrends,
      };
    },
    enabled: !!companyId,
  });

  // 3. Fetch Action Items
  const { data: actionItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["action_items", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_items")
        .select("*")
        .eq("company_id", companyId)
        .eq("resolved", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ActionItem[];
    },
    enabled: !!companyId,
  });

  // Fetch customer service requests
  const { data: serviceRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["portal_service_requests", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*, customer:customers(name, email, phone)")
        .eq("company_id", companyId)
        .eq("status", "new")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Action mutations
  const convertRequestMutation = useMutation({
    mutationFn: async ({ reqId, customerName, email, phone, description }: { reqId: string; customerName: string; email: string; phone: string; description: string }) => {
      // 1. Create a lead
      const { data: lead, error: leadErr } = await supabase
        .from("leads")
        .insert({
          company_id: companyId,
          customer_name: customerName,
          email: email || null,
          phone: phone || null,
          notes: `Customer Service Request:\n${description}`,
          source: "Website",
          status: "New"
        })
        .select("id")
        .single();
      
      if (leadErr) throw leadErr;

      // 2. Mark service request as converted
      const { error: reqErr } = await supabase
        .from("service_requests")
        .update({ status: "converted", converted_lead_id: lead.id })
        .eq("id", reqId);
      
      if (reqErr) throw reqErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal_service_requests", companyId] });
      queryClient.invalidateQueries({ queryKey: ["leads", companyId] });
      toast.success("Service request converted to sales lead successfully!");
      navigate("/crm"); // Navigate to leads kanban page
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to convert request");
    }
  });

  const declineRequestMutation = useMutation({
    mutationFn: async (reqId: string) => {
      const { error } = await supabase
        .from("service_requests")
        .update({ status: "declined" })
        .eq("id", reqId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal_service_requests", companyId] });
      toast.success("Service request marked as declined");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to decline request");
    }
  });

  const resolveActionMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("action_items")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action_items", companyId] });
      toast.success("Action item marked as resolved");
    },
  });

  // Quick Seed Mutation to help managers test Action Inbox instantly
  const seedActionItemsMutation = useMutation({
    mutationFn: async () => {
      // Find one job to link if possible
      const { data: jobs } = await supabase.from("jobs").select("id").limit(1);
      const linkedJobId = jobs?.[0]?.id || "00000000-0000-0000-0000-000000000000";

      const demoItems = [
        {
          company_id: companyId,
          type: "unassigned_job",
          entity_type: "job",
          entity_id: linkedJobId,
          title: "Unassigned Dispatch Alert",
          description: "This job is scheduled for tomorrow but has no crew member assigned.",
          severity: "High",
          action_url: "/work-orders",
        },
        {
          company_id: companyId,
          type: "overdue_invoice",
          entity_type: "invoice",
          entity_id: linkedJobId,
          title: "Overdue Collection Warning",
          description: "Invoice INV-2026-004 has been outstanding for over 14 days ($1,850.00).",
          severity: "Critical",
          action_url: "/invoices",
        },
        {
          company_id: companyId,
          type: "lead_follow_up",
          entity_type: "lead",
          entity_id: linkedJobId,
          title: "Lead Follow-Up Required",
          description: "Customer requested pricing validation call. No representative assigned.",
          severity: "Medium",
          action_url: "/crm",
        }
      ];

      const { error } = await supabase.from("action_items").insert(demoItems);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action_items", companyId] });
      toast.success("Demo action items seeded successfully!");
    },
  });

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "High": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Medium": return "bg-sky-500/10 text-sky-500 border-sky-500/20";
      case "Low": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "Critical": return <ShieldAlert className="h-5 w-5 text-rose-500" />;
      case "High": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "Medium": return <AlertCircle className="h-5 w-5 text-sky-500" />;
      default: return <CheckCircle className="h-5 w-5 text-slate-500" />;
    }
  };

  // Active Interactive Chart Category
  const [activeChartTab, setActiveChartTab] = useState<"revenue" | "sales" | "crew" | "tickets">("revenue");

  // Render a mini sparkline inline in cards
  const renderSparkline = (data: any[], dataKey: string, color: string) => {
    const hasData = data && data.some(d => d[dataKey] > 0);
    // Render a clean rising line if there is no data yet
    const chartData = hasData ? data : [
      { day: "Mon", [dataKey]: 10 },
      { day: "Tue", [dataKey]: 15 },
      { day: "Wed", [dataKey]: 12 },
      { day: "Thu", [dataKey]: 22 },
      { day: "Fri", [dataKey]: 18 },
      { day: "Sat", [dataKey]: 30 },
      { day: "Sun", [dataKey]: 25 },
    ];

    return (
      <div className="h-8 w-full mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={1.5}
              fillOpacity={1}
              fill={`url(#gradient-${dataKey})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render Circular Progress Gauge for Lead Conversion / Invoices ratio
  const renderProgressRing = (percentage: number, color: string) => {
    const radius = 16;
    const strokeWidth = 3;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

    return (
      <svg className="h-10 w-10 transform -rotate-90 select-none shrink-0" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={radius}
          className="stroke-slate-200/50"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Header & Add Project Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Office Overview & Action Feed</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time dispatches, operational status trackers, and pipeline metrics.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/projects?create=true")}
          className="gap-1.5 h-8 font-semibold text-xs border border-border/50 bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 shadow-sm transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Add Project
        </Button>
      </div>

      {/* 1. Interactive Visual Pipeline Horizontal Bar */}
      <Card className="border-border/50 bg-card/60 backdrop-blur card-shadow-md">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-foreground">Operational Pipeline Stages</h3>
              <p className="text-[11px] text-muted-foreground">Click a stage block below to view records in that category.</p>
            </div>
            {activePipelineFilter && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setActivePipelineFilter(null)}
                className="text-xs h-6 text-muted-foreground"
              >
                Clear Filter
              </Button>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {Object.entries(pipelineCounts).map(([stage, count]) => {
              const isActive = activePipelineFilter === stage;
              return (
                <div
                  key={stage}
                  onClick={() => {
                    setActivePipelineFilter(stage);
                    if (stage === "Lead") {
                      navigate("/crm");
                    } else {
                      navigate("/work-orders");
                    }
                  }}
                  className={`cursor-pointer rounded-xl p-3 border text-center transition-all ${
                    isActive
                      ? "bg-primary border-primary text-primary-foreground shadow-md scale-105"
                      : "bg-muted/30 border-border/40 hover:border-border hover:bg-muted/50"
                  }`}
                >
                  <p className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {stage}
                  </p>
                  <p className="text-xl font-black mt-1 tracking-tight">
                    {count}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Interactive KPI Cards Row 1: Sales & Financial Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Booked Revenue */}
        <Card
          onClick={() => setActiveChartTab("revenue")}
          className={`group cursor-pointer border-border/50 card-shadow-sm transition-all hover:scale-[1.02] hover:shadow-md ${
            activeChartTab === "revenue" ? "ring-2 ring-emerald-500 bg-card/80" : "bg-card/50"
          }`}
        >
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Booked Revenue</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <h4 className="text-xl font-black tracking-tight">${kpis.bookedRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</h4>
            <p className="text-[9px] text-muted-foreground mt-0.5">Leads + scheduled jobs</p>
            {renderSparkline(kpis.dailyTrends || [], "booked", "#10b981")}
          </CardContent>
        </Card>

        {/* Card 2: Completed Sales */}
        <Card
          onClick={() => setActiveChartTab("revenue")}
          className={`group cursor-pointer border-border/50 card-shadow-sm transition-all hover:scale-[1.02] hover:shadow-md ${
            activeChartTab === "revenue" ? "ring-2 ring-sky-500 bg-card/80" : "bg-card/50"
          }`}
        >
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Completed Sales</span>
            <DollarSign className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <h4 className="text-xl font-black tracking-tight">${kpis.completedRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</h4>
            <p className="text-[9px] text-muted-foreground mt-0.5">Approved invoices billed</p>
            {renderSparkline(kpis.dailyTrends || [], "completed", "#0ea5e9")}
          </CardContent>
        </Card>

        {/* Card 3: Receivables (AR) */}
        <Card
          onClick={() => setActiveChartTab("revenue")}
          className={`group cursor-pointer border-border/50 card-shadow-sm transition-all hover:scale-[1.02] hover:shadow-md ${
            activeChartTab === "revenue" ? "ring-2 ring-rose-500 bg-card/80" : "bg-card/50"
          }`}
        >
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Receivables (AR)</span>
            <Landmark className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between gap-2">
            <div>
              <h4 className="text-xl font-black tracking-tight">${kpis.outstandingAR.toLocaleString("en-US", { minimumFractionDigits: 2 })}</h4>
              <p className="text-[9px] text-muted-foreground mt-0.5">Uncollected balances</p>
            </div>
            {renderProgressRing(kpis.completedRevenue > 0 ? (kpis.outstandingAR / kpis.completedRevenue) * 100 : 35, "#f43f5e")}
          </CardContent>
        </Card>

        {/* Card 4: Pending Proposals */}
        <Card
          onClick={() => setActiveChartTab("sales")}
          className={`group cursor-pointer border-border/50 card-shadow-sm transition-all hover:scale-[1.02] hover:shadow-md ${
            activeChartTab === "sales" ? "ring-2 ring-amber-500 bg-card/80" : "bg-card/50"
          }`}
        >
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pending Proposals</span>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <h4 className="text-xl font-black tracking-tight">₦{kpis.pendingEstimatesValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</h4>
            <p className="text-[9px] text-muted-foreground mt-0.5">{kpis.pendingEstimatesCount} estimates out</p>
            {renderSparkline(kpis.dailyTrends || [], "proposals", "#f59e0b")}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Operational Performance & Safety Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 5: Lead Conversion */}
        <Card
          onClick={() => setActiveChartTab("sales")}
          className={`group cursor-pointer border-border/50 card-shadow-sm transition-all hover:scale-[1.02] hover:shadow-md ${
            activeChartTab === "sales" ? "ring-2 ring-purple-500 bg-card/80" : "bg-card/50"
          }`}
        >
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lead Conversion</span>
            <Percent className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between gap-2">
            <div>
              <h4 className="text-xl font-black tracking-tight">{kpis.closeRate.toFixed(1)}%</h4>
              <p className="text-[9px] text-muted-foreground mt-0.5">Won vs resolved leads</p>
            </div>
            {renderProgressRing(kpis.closeRate, "#a855f7")}
          </CardContent>
        </Card>

        {/* Card 6: Active Crew Clocked-In */}
        <Card
          onClick={() => setActiveChartTab("crew")}
          className={`group cursor-pointer border-border/50 card-shadow-sm transition-all hover:scale-[1.02] hover:shadow-md ${
            activeChartTab === "crew" ? "ring-2 ring-indigo-500 bg-card/80" : "bg-card/50"
          }`}
        >
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Crew</span>
            <UserCheck className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <h4 className="text-xl font-black tracking-tight">{kpis.activeCrewCount} Checked-In</h4>
            <p className="text-[9px] text-muted-foreground mt-0.5">Crew clocked-in today</p>
            {renderSparkline(kpis.dailyTrends || [], "crew", "#6366f1")}
          </CardContent>
        </Card>

        {/* Card 7: Open Safety Incidents */}
        <Card
          onClick={() => setActiveChartTab("crew")}
          className={`group cursor-pointer border-border/50 card-shadow-sm transition-all hover:scale-[1.02] hover:shadow-md ${
            activeChartTab === "crew" ? "ring-2 ring-rose-500 bg-card/80" : "bg-card/50"
          }`}
        >
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Safety Status</span>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between gap-2">
            <div>
              <h4 className="text-xl font-black tracking-tight">{kpis.openIncidentsCount} Open</h4>
              <p className="text-[9px] text-muted-foreground mt-0.5">Unresolved compliance logs</p>
            </div>
            {renderProgressRing(kpis.openIncidentsCount > 0 ? 100 : 0, "#f43f5e")}
          </CardContent>
        </Card>

        {/* Card 8: Incoming Requests */}
        <Card
          onClick={() => setActiveChartTab("tickets")}
          className={`group cursor-pointer border-border/50 card-shadow-sm transition-all hover:scale-[1.02] hover:shadow-md ${
            activeChartTab === "tickets" ? "ring-2 ring-indigo-500 bg-card/80" : "bg-card/50"
          }`}
        >
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Incoming Requests</span>
            <Wrench className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <h4 className="text-xl font-black tracking-tight">{serviceRequests.length} Pending</h4>
            <p className="text-[9px] text-muted-foreground mt-0.5">Customer portal queue</p>
            {renderSparkline(kpis.dailyTrends || [], "crew", "#4f46e5")}
          </CardContent>
        </Card>
      </div>

      {/* ─── Executive Interactive Analytics Workspace ─── */}
      <Card className="border-border/50 bg-card/60 backdrop-blur card-shadow-md overflow-hidden">
        <CardHeader className="p-4 md:p-6 border-b border-border/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <LucideLineChart className="h-4 w-4 text-primary" />
              Executive Workspace Insights
            </CardTitle>
            <CardDescription className="text-xs">
              Interactive high-fidelity charting workspace. Click any KPI card above to sync visual insights.
            </CardDescription>
          </div>
          <div className="flex bg-muted/40 p-1 rounded-xl border border-border/30 shrink-0">
            <Button
              variant={activeChartTab === "revenue" ? "default" : "ghost"}
              size="xs"
              className="text-xs h-7 px-3 rounded-lg"
              onClick={() => setActiveChartTab("revenue")}
            >
              Revenue Pipeline
            </Button>
            <Button
              variant={activeChartTab === "sales" ? "default" : "ghost"}
              size="xs"
              className="text-xs h-7 px-3 rounded-lg"
              onClick={() => setActiveChartTab("sales")}
            >
              Sales Conversion
            </Button>
            <Button
              variant={activeChartTab === "crew" ? "default" : "ghost"}
              size="xs"
              className="text-xs h-7 px-3 rounded-lg"
              onClick={() => setActiveChartTab("crew")}
            >
              Crew Logs
            </Button>
            <Button
              variant={activeChartTab === "tickets" ? "default" : "ghost"}
              size="xs"
              className="text-xs h-7 px-3 rounded-lg"
              onClick={() => setActiveChartTab("tickets")}
            >
              Portal Tickets
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Main Interactive Chart (Left) */}
            <div className="lg:col-span-2 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {activeChartTab === "revenue" ? (
                  <AreaChart data={kpis.dailyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBooked" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.3)" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                      labelStyle={{ fontWeight: "bold", fontSize: "12px", color: "#1e293b" }}
                      itemStyle={{ fontSize: "12px" }}
                    />
                    <Area type="monotone" name="Booked Sales" dataKey="booked" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorBooked)" />
                    <Area type="monotone" name="Completed Realized" dataKey="completed" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                  </AreaChart>
                ) : activeChartTab === "sales" ? (
                  <BarChart data={kpis.dailyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.3)" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "1px solid #e2e8f0", borderRadius: "12px" }}
                      labelStyle={{ fontWeight: "bold", fontSize: "12px" }}
                    />
                    <Bar name="Sales Quotes Value" dataKey="proposals" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                ) : activeChartTab === "crew" ? (
                  <LineChart data={kpis.dailyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.3)" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val} staff`} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "1px solid #e2e8f0", borderRadius: "12px" }}
                      labelStyle={{ fontWeight: "bold", fontSize: "12px" }}
                    />
                    <Line type="monotone" name="Clocked-In Staff" dataKey="crew" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  </LineChart>
                ) : (
                  <BarChart data={kpis.dailyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.3)" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "1px solid #e2e8f0", borderRadius: "12px" }}
                      labelStyle={{ fontWeight: "bold", fontSize: "12px" }}
                    />
                    <Bar name="Incoming Tickets" dataKey="crew" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Donut Chart Analytics (Right) */}
            <div className="lg:col-span-1 h-[280px] w-full flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-border/20 pt-6 lg:pt-0 lg:pl-6">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Operational Share</span>
                <span className="text-[11px] text-muted-foreground">Distribution of active pipeline jobs by phase.</span>
              </div>
              
              <div className="relative h-[160px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Scheduled", value: pipelineCounts.Scheduled || 0, color: "#3b82f6" },
                        { name: "In Progress", value: pipelineCounts["In Progress"] || 0, color: "#6366f1" },
                        { name: "Completed", value: pipelineCounts.Completed || 0, color: "#10b981" },
                        { name: "Invoiced/Paid", value: (pipelineCounts.Invoiced || 0) + (pipelineCounts.Paid || 0), color: "#0ea5e9" },
                      ].some(d => d.value > 0) ? [
                        { name: "Scheduled", value: pipelineCounts.Scheduled || 0, color: "#3b82f6" },
                        { name: "In Progress", value: pipelineCounts["In Progress"] || 0, color: "#6366f1" },
                        { name: "Completed", value: pipelineCounts.Completed || 0, color: "#10b981" },
                        { name: "Invoiced/Paid", value: (pipelineCounts.Invoiced || 0) + (pipelineCounts.Paid || 0), color: "#0ea5e9" },
                      ] : [
                        { name: "Scheduled", value: 5, color: "#3b82f6" },
                        { name: "In Progress", value: 3, color: "#6366f1" },
                        { name: "Completed", value: 12, color: "#10b981" },
                        { name: "Invoiced/Paid", value: 8, color: "#0ea5e9" },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {([
                        { name: "Scheduled", value: pipelineCounts.Scheduled || 0, color: "#3b82f6" },
                        { name: "In Progress", value: pipelineCounts["In Progress"] || 0, color: "#6366f1" },
                        { name: "Completed", value: pipelineCounts.Completed || 0, color: "#10b981" },
                        { name: "Invoiced/Paid", value: (pipelineCounts.Invoiced || 0) + (pipelineCounts.Paid || 0), color: "#0ea5e9" },
                      ].some(d => d.value > 0) ? [
                        { name: "Scheduled", value: pipelineCounts.Scheduled || 0, color: "#3b82f6" },
                        { name: "In Progress", value: pipelineCounts["In Progress"] || 0, color: "#6366f1" },
                        { name: "Completed", value: pipelineCounts.Completed || 0, color: "#10b981" },
                        { name: "Invoiced/Paid", value: (pipelineCounts.Invoiced || 0) + (pipelineCounts.Paid || 0), color: "#0ea5e9" },
                      ] : [
                        { name: "Scheduled", value: 5, color: "#3b82f6" },
                        { name: "In Progress", value: 3, color: "#6366f1" },
                        { name: "Completed", value: 12, color: "#10b981" },
                        { name: "Invoiced/Paid", value: 8, color: "#0ea5e9" },
                      ]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "1px solid #e2e8f0", borderRadius: "12px" }}
                      itemStyle={{ fontSize: "11px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-lg font-black tracking-tight text-foreground">
                    {[
                      { name: "Scheduled", value: pipelineCounts.Scheduled || 0 },
                      { name: "In Progress", value: pipelineCounts["In Progress"] || 0 },
                      { name: "Completed", value: pipelineCounts.Completed || 0 },
                      { name: "Invoiced/Paid", value: (pipelineCounts.Invoiced || 0) + (pipelineCounts.Paid || 0) },
                    ].some(d => d.value > 0) ? (
                      (pipelineCounts.Scheduled || 0) + 
                      (pipelineCounts["In Progress"] || 0) + 
                      (pipelineCounts.Completed || 0) + 
                      (pipelineCounts.Invoiced || 0) + 
                      (pipelineCounts.Paid || 0)
                    ) : 28}
                  </span>
                  <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider">
                    {[
                      { name: "Scheduled", value: pipelineCounts.Scheduled || 0 },
                      { name: "In Progress", value: pipelineCounts["In Progress"] || 0 },
                      { name: "Completed", value: pipelineCounts.Completed || 0 },
                      { name: "Invoiced/Paid", value: (pipelineCounts.Invoiced || 0) + (pipelineCounts.Paid || 0) },
                    ].some(d => d.value > 0) ? "Active Jobs" : "Demo Jobs"}
                  </span>
                </div>
              </div>

              {/* Legends list */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-muted-foreground truncate font-medium">Scheduled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                  <span className="text-muted-foreground truncate font-medium">In Progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-muted-foreground truncate font-medium">Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
                  <span className="text-muted-foreground truncate font-medium">Billed</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Action Inbox & Service Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Inbox Feed */}
        <Card className="border-border/50 card-shadow-md lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Action Inbox Feed
              </CardTitle>
              <CardDescription className="text-xs">
                System generated critical warnings and workflow resolution triggers.
              </CardDescription>
            </div>
            {actionItems.length === 0 && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => seedActionItemsMutation.mutate()}
                disabled={seedActionItemsMutation.isPending}
                className="text-xs gap-1"
              >
                <RefreshCcw className="h-3 w-3" />
                Seed Demo Actions
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {itemsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : actionItems.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-2 border border-dashed border-border/60 rounded-xl bg-muted/10">
                <CheckCircle className="h-10 w-10 text-emerald-500/60" />
                <h4 className="font-bold text-sm">Inbox Fully Resolved!</h4>
                <p className="text-xs text-muted-foreground max-w-sm text-center">
                  Outstanding items (unassigned jobs, overdue invoices, unsold estimates) are empty.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/20 border rounded-xl overflow-hidden bg-card">
                {actionItems.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {getSeverityIcon(item.severity)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground leading-none">{item.title}</span>
                          <Badge variant="outline" className={`text-[9px] px-1 py-0.5 leading-none ${getSeverityStyles(item.severity)}`}>
                            {item.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-auto">
                      {item.action_url && (
                        <Button
                          variant="default"
                          size="xs"
                          onClick={() => navigate(item.action_url!)}
                          className="text-xs font-semibold gap-1 bg-primary hover:bg-primary/95 text-primary-foreground h-7"
                        >
                          Resolve
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => resolveActionMutation.mutate(item.id)}
                        className="text-xs text-muted-foreground hover:text-foreground h-7"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Portal Service Tickets */}
        <Card className="border-border/50 card-shadow-md lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Wrench className="h-5 w-5 text-indigo-500" />
              Portal Service Requests
            </CardTitle>
            <CardDescription className="text-xs">
              Client requests submitted through the self-service web portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requestsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : serviceRequests.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-2 border border-dashed border-border/60 rounded-xl bg-muted/10">
                <CheckCircle className="h-8 w-8 text-emerald-500/60" />
                <h4 className="font-bold text-xs">No pending tickets</h4>
                <p className="text-[10px] text-muted-foreground text-center px-4">
                  Incoming requests from clients will queue here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {serviceRequests.map((req: any) => (
                  <div key={req.id} className="p-3 rounded-lg border border-border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate max-w-[130px]">{req.customer?.name || "Client Lookup"}</span>
                      <Badge variant="outline" className={`text-[9px] uppercase px-1 py-0 ${
                        req.urgency === "emergency" ? "bg-red-50 text-red-700 border-red-200" :
                        req.urgency === "urgent" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                      }`}>
                        {req.urgency}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3">{req.description}</p>
                    <div className="flex gap-2 justify-end pt-1 border-t border-border/20">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => declineRequestMutation.mutate(req.id)}
                        disabled={declineRequestMutation.isPending}
                        className="h-6 text-[10px] text-destructive hover:bg-destructive/10"
                      >
                        Decline
                      </Button>
                      <Button
                        variant="default"
                        size="xs"
                        onClick={() => convertRequestMutation.mutate({
                          reqId: req.id,
                          customerName: req.customer?.name || "Portal Guest",
                          email: req.customer?.email || "",
                          phone: req.customer?.phone || "",
                          description: req.description
                        })}
                        disabled={convertRequestMutation.isPending}
                        className="h-6 text-[10px] bg-indigo-600 hover:bg-indigo-750 text-white"
                      >
                        Convert
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
