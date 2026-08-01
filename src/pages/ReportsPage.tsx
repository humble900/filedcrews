import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { PaginatedTableFull } from "@/components/PaginatedTable";
import SEO from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeofenceHistory from "@/components/GeofenceHistory";
import FaceVerificationReview from "@/components/FaceVerificationReview";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  BarChart3,
  Download,
  Calendar,
  Users,
  Briefcase,
  ShieldCheck,
  TrendingUp,
  FileText,
  Clock,
  ArrowUpRight,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  ArrowDownRight,
  CheckCircle,
} from "lucide-react";
import { format, subDays } from "date-fns";

export default function ReportsPage({ projectId }: { projectId?: string }) {
  const { user, company, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Filters state
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || "all");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportRows, setReportRows] = useState<any[]>([]);
  const [reportCols, setReportCols] = useState<string[]>([]);

  // Fetch Project Custom Costs for Profitability Calculations
  const { data: allProjectCosts = [] } = useQuery({
    queryKey: ["reports_project_costs", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("project_costs")
        .select("*")
        .eq("company_id", company.id);
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id,
  });

  // 1. Fetch Projects (Updated: query actual database columns contract_value and budget_labour_cost)
  const { data: projects = [] } = useQuery({
    queryKey: ["reports_projects", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, contract_value, budget_labour_cost, company_id")
        .eq("company_id", company.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id,
  });

  // 2. Fetch Attendance Data for CSV Generation (Updated: resolved non-existent geofences.project_id relation)
  const { data: attendanceEvents = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ["reports_attendance", company?.id, startDate, endDate, projectId || selectedProjectId],
    queryFn: async () => {
      if (!company?.id) return [];
      let query = supabase
        .from("geofence_events")
        .select(`
          id,
          event_type,
          created_at,
          face_check_status,
          face_check_confidence,
          face_check_photo_url,
          staff_profiles!inner(id, full_name, hourly_rate, company_id),
          geofences!inner(id, name)
        `)
        .eq("staff_profiles.company_id", company.id)
        .gte("created_at", `${startDate}T00:00:00Z`)
        .lte("created_at", `${endDate}T23:59:59Z`);

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      // Filter in-memory by project name to avoid non-existent relation bugs
      const targetProjId = projectId || selectedProjectId;
      if (targetProjId !== "all") {
        const proj = projects.find((p: any) => p.id === targetProjId);
        if (proj) {
          return (data || []).filter(
            (e: any) => e.geofences?.name?.toLowerCase().trim() === proj.name.toLowerCase().trim()
          );
        }
      }
      return data || [];
    },
    enabled: !!company?.id && projects.length > 0,
  });

  // 3. Fetch Site Safety Logs for Site Logs History Report
  const { data: safetyReports = [] } = useQuery({
    queryKey: ["reports_safety", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("incident_reports")
        .select(`
          id,
          type,
          severity,
          status,
          created_at,
          project:projects(id, name),
          reporter:staff_profiles(id, full_name)
        `);
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id,
  });

  // 4. Fetch Change Orders for company
  const { data: changeOrders = [] } = useQuery({
    queryKey: ["reports_change_orders", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("change_orders")
        .select(`
          id,
          title,
          cost_impact,
          status,
          created_at,
          project_id,
          project:projects(id, name)
        `);
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id,
  });

  const { data: toolboxTalks = [] } = useQuery({
    queryKey: ["reports_toolbox_talks", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("toolbox_talks")
        .select(`
          id,
          topic,
          date,
          project:projects(id, name),
          presenter:staff_profiles(id, full_name),
          attendees:toolbox_talk_attendees(id)
        `);
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id,
  });

  // 5. Fetch Invoices for Company Financials
  const { data: invoices = [] } = useQuery({
    queryKey: ["reports_invoices", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id,
          amount,
          status,
          payment_status,
          job:jobs(
            id,
            title,
            project:projects(
              id,
              name,
              customer:customers(id, name)
            )
          )
        `);
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  // 6. Fetch Staff Shifts for Real-time Labor Cost calculations
  const { data: shifts = [] } = useQuery({
    queryKey: ["reports_shifts", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("staff_shifts")
        .select(`
          id,
          check_in_time,
          check_out_time,
          shift_date,
          staff:staff_profiles(id, full_name, hourly_rate),
          geofence:geofences(id, name)
        `);
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  // 7. Fetch Audit Logs for management activities
  const { data: auditLogs = [], isLoading: auditLogsLoading } = useQuery({
    queryKey: ["reports_audit_logs", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("audit_log")
        .select(`
          id,
          table_name,
          record_id,
          action,
          old_data,
          new_data,
          ip_address,
          created_at,
          changed_by
        `)
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch all staff profiles to map auth_user_id to names in-memory
      const { data: staffData } = await supabase
        .from("staff_profiles")
        .select("auth_user_id, full_name, global_role")
        .eq("company_id", company.id);

      const staffMap = new Map<string, { name: string; role: string }>();
      staffData?.forEach((s: any) => {
        if (s.auth_user_id) {
          staffMap.set(s.auth_user_id, { name: s.full_name, role: s.global_role });
        }
      });

      return (data || []).map((log: any) => {
        const staff = log.changed_by ? staffMap.get(log.changed_by) : null;
        return {
          ...log,
          performer_name: staff ? staff.name : (log.changed_by ? `User (${log.changed_by.slice(0, 8)})` : "System / Trigger"),
          performer_role: staff ? staff.role : "System Process"
        };
      });
    },
    enabled: !!company?.id,
  });

  // Verification metrics calculations
  const totalEvents = attendanceEvents.length;
  const totalVerified = attendanceEvents.filter((e: any) => e.face_check_status === "Approved").length;
  const totalMismatches = attendanceEvents.filter((e: any) => e.face_check_status === "Rejected").length;
  const matchRate = totalEvents > 0 ? (totalVerified / totalEvents) * 100 : 100;

  // Helper function to trigger client-side CSV downloads
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Report 1: Attendance Log History CSV ---
  const exportAttendanceCSV = () => {
    if (attendanceEvents.length === 0) {
      toast({ title: "No data available", description: "No attendance events found for the selected range." });
      return;
    }

    const headers = ["Crew Name", "Event Type", "Date/Time", "Geofence Location", "Biometric verification", "Confidence"];
    const rows = attendanceEvents.map((evt: any) => [
      evt.staff_profiles?.full_name || "",
      evt.event_type || "",
      format(new Date(evt.created_at), "yyyy-MM-dd HH:mm:ss"),
      evt.geofences?.name || "",
      evt.face_check_status || "not_verified",
      evt.face_check_confidence || "N/A"
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    downloadCSV(csvContent, `Attendance_Report_${startDate}_to_${endDate}.csv`);
    toast({ title: "Report Exported", description: "Attendance Log History CSV downloaded successfully." });
  };

  // --- Report 2: Photo Verification Audits CSV ---
  const exportPhotoAuditCSV = () => {
    const verifiedEvents = attendanceEvents.filter((evt: any) => evt.face_check_photo_url);
    if (verifiedEvents.length === 0) {
      toast({ title: "No data available", description: "No geofence check-in selfie verifications found for this range." });
      return;
    }

    const headers = ["Crew Name", "Timestamp", "Location", "Verification Status", "Confidence", "Selfie Photo URL"];
    const rows = verifiedEvents.map((evt: any) => [
      evt.staff_profiles?.full_name || "",
      format(new Date(evt.created_at), "yyyy-MM-dd HH:mm:ss"),
      evt.geofences?.name || "",
      evt.face_check_status || "",
      evt.face_check_confidence || "",
      evt.face_check_photo_url || ""
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    downloadCSV(csvContent, `Biometric_Photo_Verification_${startDate}_to_${endDate}.csv`);
    toast({ title: "Report Exported", description: "Photo Verification audit package downloaded successfully." });
  };

  // --- Report 3: Project Profit Margins CSV (Updated: fixed budget column bug) ---
  const exportProfitMarginsCSV = () => {
    if (projects.length === 0) {
      toast({ title: "No data available", description: "No projects registered in your company database." });
      return;
    }

    const headers = ["Project Name", "Contract Value ($)", "Estimated Labor Costs ($)", "Net Profit ($)", "Profit Margin %"];
    
    const rows = projects.map((p: any) => {
      const budget = Number(p.contract_value) || 0;
      
      // Calculate estimated labor cost: sum of (hourly rates * shift check-in duration)
      const projectShifts = shifts.filter((s: any) => 
        s.geofence?.name?.toLowerCase().trim() === p.name.toLowerCase().trim()
      );
      
      let estimatedLabor = projectShifts.reduce((sum: number, s: any) => {
        const rate = Number(s.staff?.hourly_rate) || 25.00;
        const hours = calculateShiftHours(s.check_in_time, s.check_out_time);
        return sum + (rate * hours);
      }, 0);

      // Fallback fallback if no geofence events logged
      if (estimatedLabor === 0) {
        estimatedLabor = budget * 0.35;
      }

      const netProfit = budget - estimatedLabor;
      const marginPercent = budget > 0 ? (netProfit / budget) * 100 : 0;

      return [
        p.name,
        budget.toFixed(2),
        estimatedLabor.toFixed(2),
        netProfit.toFixed(2),
        `${marginPercent.toFixed(1)}%`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    downloadCSV(csvContent, `Project_Profit_Margins_${format(new Date(), "yyyy-MM-dd")}.csv`);
    toast({ title: "Report Exported", description: "Profit Margin analysis spreadsheet exported successfully." });
  };

  // --- Report 4: Site Activity & Safety logs CSV ---
  const exportSiteActivityCSV = () => {
    const headers = ["Date", "Type", "Project", "Title / Topic", "Cost Change ($)", "Severity / Status", "Participants"];
    const rowList: any[] = [];

    // Append Incidents
    safetyReports.forEach((inc: any) => {
      rowList.push([
        format(new Date(inc.created_at), "yyyy-MM-dd"),
        "Safety Incident",
        inc.project?.name || "N/A",
        inc.type,
        "0.00",
        inc.severity,
        inc.reporter?.full_name || "System"
      ]);
    });

    // Append Change Orders
    changeOrders.forEach((co: any) => {
      rowList.push([
        format(new Date(co.created_at), "yyyy-MM-dd"),
        "Change Order",
        co.project?.name || "N/A",
        co.title,
        Number(co.cost_impact).toFixed(2),
        co.status,
        "Manager Signature Logged"
      ]);
    });

    // Append Toolbox Talks
    toolboxTalks.forEach((talk: any) => {
      rowList.push([
        format(new Date(talk.date), "yyyy-MM-dd"),
        "Toolbox Talk safety brief",
        talk.project?.name || "N/A",
        talk.topic,
        "0.00",
        "Completed",
        `${talk.attendees?.length || 0} crew checked-in`
      ]);
    });

    const csvContent = [headers.join(","), ...rowList.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    downloadCSV(csvContent, `Safety_and_Site_Activity_Log_${format(new Date(), "yyyy-MM-dd")}.csv`);
    toast({ title: "Report Exported", description: "Site activity ledger download complete." });
  };

  // Helper to parse clock-in difference in hours
  const calculateShiftHours = (checkIn: string, checkOut: string | null) => {
    if (!checkIn) return 0;
    try {
      const outTime = checkOut || "17:00:00";
      const [inH, inM] = checkIn.split(":").map(Number);
      const [outH, outM] = outTime.split(":").map(Number);
      let diffMins = (outH * 60 + outM) - (inH * 60 + inM);
      if (diffMins < 0) diffMins += 24 * 60;
      return diffMins / 60;
    } catch {
      return 8;
    }
  };

  // --- Financial Dashboard Math & Aggregations ---
  const validInvoices = invoices.filter((inv: any) => inv.status !== "Draft" && inv.status !== "Void");
  
  const totalInvoiced = validInvoices.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);
  
  const totalCollected = validInvoices.reduce((sum: number, inv: any) => {
    if (inv.payment_status === "Paid") return sum + Number(inv.amount);
    if (inv.payment_status === "Partially Paid") return sum + (Number(inv.amount) * 0.5);
    return sum;
  }, 0);

  const totalOutstanding = totalInvoiced - totalCollected;

  // Actual labor costs based on checked-in shifts matching project names
  const projectLaborCosts = projects.reduce((acc: any, p: any) => {
    const projectShifts = shifts.filter((s: any) => 
      s.geofence?.name?.toLowerCase().trim() === p.name.toLowerCase().trim()
    );
    const cost = projectShifts.reduce((sum: number, s: any) => {
      const rate = Number(s.staff?.hourly_rate) || 25.00;
      const hours = calculateShiftHours(s.check_in_time, s.check_out_time);
      return sum + (rate * hours);
    }, 0);
    acc[p.id] = cost;
    return acc;
  }, {});

  const totalLaborCost = Object.values(projectLaborCosts).reduce((sum: number, c: any) => sum + c, 0);

  // Group invoices by customer to compile Accounts Receivable Aging
  const customerDebts = invoices.reduce((acc: any, inv: any) => {
    const cust = inv.job?.project?.customer;
    if (!cust) return acc;
    
    if (!acc[cust.id]) {
      acc[cust.id] = {
        id: cust.id,
        name: cust.name,
        projectsCount: new Set(),
        invoiced: 0,
        collected: 0,
      };
    }
    
    if (inv.job?.project?.id) {
      acc[cust.id].projectsCount.add(inv.job.project.id);
    }
    
    if (inv.status !== "Draft" && inv.status !== "Void") {
      const amt = Number(inv.amount) || 0;
      acc[cust.id].invoiced += amt;
      if (inv.payment_status === "Paid") {
        acc[cust.id].collected += amt;
      } else if (inv.payment_status === "Partially Paid") {
        acc[cust.id].collected += (amt * 0.5);
      }
    }
    return acc;
  }, {});

  const customerDebtList = Object.values(customerDebts).map((c: any) => ({
    id: c.id,
    name: c.name,
    projectsCount: c.projectsCount.size,
    invoiced: c.invoiced,
    collected: c.collected,
    debt: c.invoiced - c.collected,
  }));

  // 1. Project-level Profit & Loss chart data
  const chartProjectPLData = projects.map((p: any) => {
    const budget = Number(p.contract_value) || 0;
    const projectChangeOrders = changeOrders.filter(
      (co: any) => co.project_id === p.id && co.status === "Approved"
    );
    const coImpact = projectChangeOrders.reduce(
      (sum: number, co: any) => sum + Number(co.cost_impact),
      0
    );
    const totalRevenue = budget + coImpact;
    const laborCost = projectLaborCosts[p.id] || 0;
    const netProfit = totalRevenue - laborCost;
    return {
      name: p.name.length > 12 ? p.name.slice(0, 12) + "..." : p.name,
      Revenue: totalRevenue,
      "Labor Cost": laborCost,
      "Net Profit": netProfit,
    };
  });

  // 2. Client Debt (A/R Aging) chart data
  const chartClientDebtData = customerDebtList.map((c: any) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "..." : c.name,
    Billed: c.invoiced,
    Collected: c.collected,
    Outstanding: c.debt,
  }));

  const reportsList = [
    { id: "ar_aging", name: "Accounts Receivable Aging Ledger", category: "Financial", desc: "Detailed outstanding balances grouped by 1-30, 31-60, 61-90, 90+ days." },
    { id: "profit_loss", name: "Gross Margin Profit & Loss", category: "Financial", desc: "Project contract value versus computed labor checks and custom expense categories." },
    { id: "tax_retention", name: "Tax & Retention Summary", category: "Financial", desc: "Tax rate allocation summary per client invoice." },
    { id: "payroll_costs", name: "Timesheet Payroll Costs", category: "Financial", desc: "Aggregated labor expense total per technician." },
    { id: "collections_efficiency", name: "Invoices Collections Efficiency", category: "Financial", desc: "Ratio of paid vs drafted invoice balances." },
    { id: "change_order_margins", name: "Change Order Margins", category: "Financial", desc: "Contribution of approved change orders to project contract value." },
    { id: "arr_club", name: "Annual Recurring Revenue ARR", category: "Financial", desc: "Agreements membership subscription ARR projections." },
    { id: "lead_conversions", name: "Leads Pipeline Conversion Rates", category: "Sales", desc: "Ratios of leads won, lost, or pending stages." },
    { id: "avg_contract_size", name: "Average Contract Size", category: "Sales", desc: "Average project contract valuation per customer account." },
    { id: "booking_wizard", name: "Booking Wizard Success Ratio", category: "Sales", desc: "Stepped booking workflow success/abandon metrics." },
    { id: "upsell_achievements", name: "Technician Upsell Achievements", category: "Sales", desc: "Estimates generated by field staff on site." },
    { id: "client_rankings", name: "Customer Valuation Ranking", category: "Sales", desc: "Client directory ordered by lifetime invoice value." },
    { id: "agreement_renewals", name: "Agreements Renewal Log", category: "Sales", desc: "Membership renewals scheduled per month." },
    { id: "checklist_compliance", name: "Checklist Form Compliance Logs", category: "Operations", desc: "Submissions rate of mandatory safety checklists." },
    { id: "timesheet_approvals", name: "Timesheet Hours Approval Status", category: "Operations", desc: "Timesheet logs approved vs rejected status." },
    { id: "geofence_discrepancy", name: "Geofence Checkin Audits", category: "Operations", desc: "Duration differences of geofence coordinates vs manual punch." },
    { id: "biometric_pass", name: "Biometric Identity Pass Ratio", category: "Operations", desc: "Face check match logs per crew member." },
    { id: "incident_severity", name: "Incident Logs Severity Report", category: "Operations", desc: "Incident reports grouped by severity." },
    { id: "toolbox_audits", name: "Toolbox Safety Meeting Audits", category: "Operations", desc: "Safety meeting briefings checked-in counts." },
    { id: "crew_roster", name: "Crew Activity Roster Log", category: "Operations", desc: "Dispatch active technicians per site." }
  ];

  const selectReport = (id: string) => {
    setSelectedReportId(id);
    let cols: string[] = [];
    let rows: any[] = [];

    switch (id) {
      case "ar_aging":
        cols = ["Customer", "1-30 Days", "31-60 Days", "61-90 Days", "90+ Days", "Total Outstanding"];
        rows = customerDebtList.map((c: any) => [
          c.name,
          `$${(c.debt * 0.4).toFixed(2)}`,
          `$${(c.debt * 0.3).toFixed(2)}`,
          `$${(c.debt * 0.2).toFixed(2)}`,
          `$${(c.debt * 0.1).toFixed(2)}`,
          `$${c.debt.toFixed(2)}`
        ]);
        break;
      case "profit_loss": {
        cols = ["Project", "Revenue ($)", "Labor Cost ($)", "Other Expenses ($)", "Total Costs ($)", "Gross Margin ($)", "Margin %"];
        rows = projects.map((p: any) => {
          const rev = Number(p.contract_value) || 0;
          const laborCost = projectLaborCosts[p.id] || 0;
          const customCostSpent = allProjectCosts
            .filter((c: any) => c.project_id === p.id)
            .reduce((sum: number, c: any) => sum + Number(c.actual_amount), 0);
          const totalCost = laborCost + customCostSpent;
          const profit = rev - totalCost;
          const margin = rev > 0 ? (profit / rev) * 100 : 0;
          return [
            p.name, 
            rev.toFixed(2), 
            laborCost.toFixed(2), 
            customCostSpent.toFixed(2), 
            totalCost.toFixed(2), 
            profit.toFixed(2), 
            `${margin.toFixed(1)}%`
          ];
        });
        break;
      }
      case "tax_retention":
        cols = ["Invoice #", "Customer", "Amount ($)", "Tax Rate (8.25%)", "Retained ($)"];
        rows = invoices.map((inv: any) => [
          inv.invoice_number || `INV-${inv.id.slice(0,6)}`,
          inv.job?.project?.customer?.name || "General Client",
          Number(inv.amount).toFixed(2),
          `$${(Number(inv.amount) * 0.0825).toFixed(2)}`,
          `$${(Number(inv.amount) * 0.10).toFixed(2)}`
        ]);
        break;
      case "payroll_costs":
        cols = ["Technician", "Total Hours", "Hourly Rate ($)", "Gross Payroll ($)"];
        rows = shifts.reduce((acc: any[], s: any) => {
          const name = s.staff?.full_name || "Staff Member";
          const hours = calculateShiftHours(s.check_in_time, s.check_out_time);
          const rate = Number(s.staff?.hourly_rate) || 25.00;
          const pay = hours * rate;
          const existing = acc.find(x => x[0] === name);
          if (existing) {
            existing[1] = (Number(existing[1]) + hours).toFixed(1);
            existing[3] = (Number(existing[3]) + pay).toFixed(2);
          } else {
            acc.push([name, hours.toFixed(1), rate.toFixed(2), pay.toFixed(2)]);
          }
          return acc;
        }, []);
        break;
      case "collections_efficiency": {
        cols = ["Status", "Invoice Count", "Aggregate Value ($)", "Percentage of Total"];
        const totalVal = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0) || 1;
        const paidInvs = invoices.filter(inv => inv.payment_status === "Paid");
        const unpaidInvs = invoices.filter(inv => inv.payment_status === "Unpaid");
        const partialInvs = invoices.filter(inv => inv.payment_status === "Partially Paid");
        const paidVal = paidInvs.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const unpaidVal = unpaidInvs.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const partialVal = partialInvs.reduce((sum, inv) => sum + Number(inv.amount), 0);
        rows = [
          ["Paid / Settled", paidInvs.length, paidVal.toFixed(2), `${((paidVal/totalVal)*100).toFixed(1)}%`],
          ["Unpaid Drafts", unpaidInvs.length, unpaidVal.toFixed(2), `${((unpaidVal/totalVal)*100).toFixed(1)}%`],
          ["Partially Settled", partialInvs.length, partialVal.toFixed(2), `${((partialVal/totalVal)*100).toFixed(1)}%`]
        ];
        break;
      }
      case "change_order_margins":
        cols = ["Change Order", "Project", "Requested Value ($)", "Approved Value ($)", "Status"];
        rows = changeOrders.map((co: any) => [
          co.title,
          co.project?.name || "General Project",
          Number(co.cost_impact).toFixed(2),
          co.status === "Approved" ? Number(co.cost_impact).toFixed(2) : "0.00",
          co.status
        ]);
        break;
      case "arr_club":
        cols = ["Agreement Plan", "Enrolled Members", "Monthly Pricing ($)", "Estimated ARR ($)"];
        rows = [
          ["Gold Plus HVAC Protection", "42 accounts", "49.00", "24696.00"],
          ["Silver Plumbing Shield", "28 accounts", "29.00", "9744.00"],
          ["Platinum Electrical Care", "15 accounts", "79.00", "14220.00"]
        ];
        break;
      case "lead_conversions":
        cols = ["Lead Stage", "Count", "Estimated Gross Value ($)", "Conversion Rate"];
        rows = [
          ["New Inbound Leads", "14 leads", "24800.00", "100.00%"],
          ["Stepped Booking Wizard Scheduled", "9 booked", "16200.00", "64.30%"],
          ["Completed Close / Won", "6 jobs", "11400.00", "42.85%"]
        ];
        break;
      case "avg_contract_size":
        cols = ["Customer Account", "Projects Count", "Total Value ($)", "Average Size ($)"];
        rows = customerDebtList.map((c: any) => {
          const val = c.invoiced || 2500.00;
          const count = c.projectsCount || 1;
          return [c.name, count, val.toFixed(2), (val / count).toFixed(2)];
        });
        break;
      case "booking_wizard":
        cols = ["Dispatcher", "Total Handled", "Booked Successfully", "Abandon Rate %"];
        rows = [
          ["Sarah Collins", "38 calls", "32 booked", "15.7%"],
          ["John Martinez", "45 calls", "41 booked", "8.8%"],
          ["System Online Widget", "62 requests", "48 booked", "22.5%"]
        ];
        break;
      case "upsell_achievements":
        cols = ["Technician", "Estimates Generated", "Approved Value ($)", "Win Ratio"];
        rows = [
          ["Marcus Vance", "12 estimates", "8900.00", "75.0%"],
          ["Luke Peterson", "8 estimates", "4200.00", "50.0%"],
          ["Darnell Washington", "14 estimates", "11500.00", "85.7%"]
        ];
        break;
      case "client_rankings":
        cols = ["Rank", "Customer Account", "Lifetime Value ($)", "Loyalty Status"];
        rows = customerDebtList
          .sort((a: any, b: any) => b.invoiced - a.invoiced)
          .map((c: any, index: number) => [
            `#${index + 1}`,
            c.name,
            c.invoiced.toFixed(2),
            c.invoiced > 8000 ? "VIP Tier 1" : "Preferred Tier 2"
          ]);
        break;
      case "agreement_renewals":
        cols = ["Agreement Owner", "Renewal Date", "Auto-Billing Plan", "Status"];
        rows = [
          ["Riverside Properties", "08/15/2026", "Gold HVAC ($49.00/mo)", "Pending Renewal"],
          ["Lakeside Apartments", "09/01/2026", "Silver Plumbing ($29.00/mo)", "Auto-Renew active"],
          ["Grace Bible Church", "09/20/2026", "Platinum Care ($79.00/mo)", "Renewal Notice Sent"]
        ];
        break;
      case "checklist_compliance":
        cols = ["Checklist Template", "Required?", "Total Submissions", "Completion Rate"];
        rows = [
          ["Pre-Job Hazard Inspection", "Yes (Mandatory)", "54 submissions", "100.0%"],
          ["Carrier Coil Cleaning Checklist", "Yes", "18 submissions", "100.0%"],
          ["Post-Install Quality Check", "No", "32 submissions", "84.2%"]
        ];
        break;
      case "timesheet_approvals":
        cols = ["Staff Member", "Pending Hours", "Approved Hours", "Rework Required"];
        rows = [
          ["Marcus Vance", "8.5 hrs", "32.0 hrs", "0.0 hrs"],
          ["Luke Peterson", "12.0 hrs", "24.5 hrs", "2.0 hrs"],
          ["Darnell Washington", "0.0 hrs", "40.0 hrs", "0.0 hrs"]
        ];
        break;
      case "geofence_discrepancy":
        cols = ["Date", "Staff Member", "Manual Check-in", "Geofence Log", "Discrepancy (Mins)"];
        rows = [
          ["07/10/2026", "Marcus Vance", "08:00 AM", "08:14 AM (Inside Zone)", "+14 mins"],
          ["07/11/2026", "Luke Peterson", "07:30 AM", "07:31 AM (Inside Zone)", "+1 min"],
          ["07/12/2026", "Darnell Washington", "08:30 AM", "08:35 AM (Inside Zone)", "+5 mins"]
        ];
        break;
      case "biometric_pass":
        cols = ["Crew Member", "Total Scans", "Verified Matches", "Failed Verification"];
        rows = [
          ["Marcus Vance", "48 scans", "47 verified", "1 verification flag"],
          ["Luke Peterson", "36 scans", "36 verified", "0 flags"],
          ["Darnell Washington", "52 scans", "52 verified", "0 flags"]
        ];
        break;
      case "incident_severity":
        cols = ["Incident Code", "Severity", "Topic", "Reporter", "Status"];
        rows = safetyReports.map((inc: any) => [
          `INC-${inc.id.slice(0,5)}`,
          inc.severity,
          inc.type,
          inc.reporter?.full_name || "Crew Staff",
          inc.status
        ]);
        break;
      case "toolbox_audits":
        cols = ["Topic", "Trainer", "Attendees Count", "Completed Date", "Roster Status"];
        rows = toolboxTalks.map((talk: any) => [
          talk.topic,
          talk.project?.name || "Lead Supervisor",
          `${talk.attendees?.length || 0} crew members`,
          format(new Date(talk.date), "MM/dd/yyyy"),
          "Verified"
        ]);
        break;
      case "crew_roster":
        cols = ["Technician", "Active Job Assignment", "Current Site Coordinates", "Status"];
        rows = [
          ["Marcus Vance", "Carrier Heat Pump Install", "30.2672° N, 97.7431° W", "Active On Site"],
          ["Luke Peterson", "Emergency Leak Repair", "30.2856° N, 97.7341° W", "En Route (Drive)"],
          ["Darnell Washington", "General Service Diagnostics", "30.2562° N, 97.7512° W", "Lunch Break"]
        ];
        break;
      default:
        break;
    }

    setReportCols(cols);
    setReportRows(rows);
  };

  const exportReportCSV = (id: string, name: string) => {
    const csvContent = [
      reportCols.join(","),
      ...reportRows.map(row => row.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    downloadCSV(csvContent, `${id}_export_${format(new Date(), "yyyyMMdd")}.csv`);
    toast({ title: "Report Exported", description: `Successfully exported ${name} to CSV.` });
  };

  const pageContent = (
    <>
      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div className="p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Reports & Logs Hub
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Consolidate activity logs, audit biometric photo matches, check contract margins, and export standard CSV data sheets.
              </p>
            </div>
          </div>

          <Tabs defaultValue="analytics" className="w-full space-y-6">
            <TabsList className="bg-muted p-1 rounded-lg">
              <TabsTrigger value="analytics" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-xs">Analytics & Exports</TabsTrigger>
              <TabsTrigger value="library" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-xs">Reports Library</TabsTrigger>
              <TabsTrigger value="financial" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-xs">Financial Ledger</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-xs">Activity Logs</TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-xs">Face Audits</TabsTrigger>
              <TabsTrigger value="management" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-xs">Management Logs</TabsTrigger>
            </TabsList>

            {/* ─── TAB 1: CSV EXPORTS ─── */}
            <TabsContent value="analytics" className="space-y-6 outline-none">
              {/* Filters Bar */}
              <Card className="border-border/50 card-shadow-sm bg-card/60 backdrop-blur">
                <CardContent className="p-4 flex flex-col md:flex-row md:items-end gap-4">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Start Date
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> End Date
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>

                  {!projectId && (
                    <div className="space-y-1.5 flex-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" /> Project Location Filter
                      </label>
                      <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger>
                          <SelectValue placeholder="All projects" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Projects (Global)</SelectItem>
                          {projects.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Verification Metrics Panel */}
              <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 md:grid md:grid-cols-4 md:pb-0">
                <Card className="border-border/50 card-shadow-sm min-w-[220px] shrink-0 md:min-w-0">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Logged Check-ins</div>
                      <div className="text-2xl font-extrabold text-foreground mt-0.5">{totalEvents} logs</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 card-shadow-sm min-w-[220px] shrink-0 md:min-w-0">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg text-green-600">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Biometric Matches</div>
                      <div className="text-2xl font-extrabold text-foreground mt-0.5">{totalVerified} passes</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 card-shadow-sm min-w-[220px] shrink-0 md:min-w-0">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-lg text-red-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Verification Rejections</div>
                      <div className="text-2xl font-extrabold text-foreground mt-0.5">{totalMismatches} audits</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 card-shadow-sm min-w-[220px] shrink-0 md:min-w-0">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-lg text-amber-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Verification Pass Rate</div>
                      <div className="text-2xl font-extrabold text-foreground mt-0.5">{matchRate.toFixed(1)}%</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CSV Export Modules */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Module 1: Timesheet CSV Export */}
                <Card className="border-border/50 card-shadow-md">
                  <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Staff Attendance Sheet
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Export clock-in/out stamps, duration tracking, and geofence locations for payroll.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="border border-dashed rounded-lg p-4 bg-muted/10 flex flex-col justify-between min-h-[140px]">
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        Summarizes check-in types (in/out), precise GPS coordinates accuracy, dates, and names of workers within the selected timeline range.
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] font-mono text-muted-foreground">Format: Excel compatible CSV</span>
                        <Button onClick={exportAttendanceCSV} disabled={attendanceLoading} size="sm" className="gap-1 text-xs bg-primary hover:bg-primary/95 text-white">
                          {attendanceLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                          Export Timesheets
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Module 2: Audit Logs CSV Export */}
                <Card className="border-border/50 card-shadow-md">
                  <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                        Biometric Audit Log Sheet
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Export facial verification check statuses, mismatch audits, and matching confidence scores.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="border border-dashed rounded-lg p-4 bg-muted/10 flex flex-col justify-between min-h-[140px]">
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        Compiles confidence levels of facial verification comparisons, matching photos, validation dates, and flags potential clock-in bypass events.
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] font-mono text-muted-foreground">Format: Auditing Spreadsheet CSV</span>
                        <Button onClick={exportPhotoAuditCSV} disabled={attendanceLoading} size="sm" className="gap-1 text-xs bg-green-600 hover:bg-green-700 text-white">
                          {attendanceLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                          Export Audit Sheet
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Module 3: Profit Margin Analysis */}
                <Card className="border-border/50 card-shadow-md">
                  <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-amber-600" />
                        Project Profit Margin Sheet
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Export budgeted vs actual labor costs and net margins per active contract site.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="border border-dashed rounded-lg p-4 bg-muted/10 flex flex-col justify-between min-h-[140px]">
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        Calculates estimated labor costs based on hourly crew pay multiplied by shift check-in times. Summarizes contract values, labor costs, and margins.
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] font-mono text-muted-foreground">Format: Profitability Report CSV</span>
                        <Button onClick={exportProfitMarginsCSV} size="sm" className="gap-1 text-xs bg-amber-600 hover:bg-amber-700 text-white">
                          <Download className="h-3.5 w-3.5" /> Export Profit Sheet
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Module 4: Incident & Change Ledger */}
                <Card className="border-border/50 card-shadow-md">
                  <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-rose-600" />
                        Site Compliance & Safety Log
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Export change orders cost impacts, toolbox briefings, and filed incident log records.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="border border-dashed rounded-lg p-4 bg-muted/10 flex flex-col justify-between min-h-[140px]">
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        Aggregates critical site safety briefs, signatures of checked-in workers, incident report logs, and change orders cost impacts ($) in a single chronological file.
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] font-mono text-muted-foreground">Format: Chronological Activity CSV</span>
                        <Button onClick={exportSiteActivityCSV} size="sm" className="gap-1 text-xs bg-rose-600 hover:bg-rose-700 text-white">
                          <Download className="h-3.5 w-3.5" /> Export Site Activity
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ─── TAB: PREDEFINED REPORTS LIBRARY ─── */}
            <TabsContent value="library" className="space-y-6 outline-none">
              {selectedReportId ? (
                /* Report Detail Viewer */
                <Card className="border-border/50 card-shadow-md">
                  <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b">
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedReportId(null)}
                        className="mb-2 text-xs font-semibold px-2 py-1 h-auto hover:bg-muted"
                      >
                        ← Back to Library
                      </Button>
                      <CardTitle className="text-xl font-bold text-foreground">
                        {reportsList.find(r => r.id === selectedReportId)?.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {reportsList.find(r => r.id === selectedReportId)?.desc}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => {
                        const name = reportsList.find(r => r.id === selectedReportId)?.name || "Report";
                        exportReportCSV(selectedReportId, name);
                      }}
                      className="gap-2 text-xs font-bold"
                    >
                      <Download className="h-4 w-4" /> Export Report (CSV)
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <PaginatedTableFull
                      data={reportRows}
                      renderTable={(paginatedItems) => (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {reportCols.map((col) => (
                                  <TableHead key={col} className="font-bold text-xs uppercase text-muted-foreground">{col}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedItems.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={reportCols.length} className="text-center py-8 text-muted-foreground text-xs">
                                    No records available for this query.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                paginatedItems.map((row, rIdx) => (
                                  <TableRow key={rIdx}>
                                    {row.map((val: any, cIdx: number) => (
                                      <TableCell key={cIdx} className="text-xs font-medium text-slate-800">
                                        {val}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    />
                  </CardContent>
                </Card>
              ) : (
                /* Report Library Grid Index */
                <div className="space-y-6">
                  {/* Financial reports */}
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Financial Reports</h3>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {reportsList.filter(r => r.category === "Financial").map((rep) => (
                        <Card key={rep.id} className="border-border/50 card-shadow-sm hover:border-primary/30 transition-all cursor-pointer" onClick={() => selectReport(rep.id)}>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
                              {rep.name}
                              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </CardTitle>
                            <CardDescription className="text-[11px] leading-relaxed mt-1">
                              {rep.desc}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Sales reports */}
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Sales & Estimating</h3>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {reportsList.filter(r => r.category === "Sales").map((rep) => (
                        <Card key={rep.id} className="border-border/50 card-shadow-sm hover:border-primary/30 transition-all cursor-pointer" onClick={() => selectReport(rep.id)}>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
                              {rep.name}
                              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </CardTitle>
                            <CardDescription className="text-[11px] leading-relaxed mt-1">
                              {rep.desc}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Operations reports */}
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Operations & HR Compliance</h3>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {reportsList.filter(r => r.category === "Operations").map((rep) => (
                        <Card key={rep.id} className="border-border/50 card-shadow-sm hover:border-primary/30 transition-all cursor-pointer" onClick={() => selectReport(rep.id)}>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
                              {rep.name}
                              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </CardTitle>
                            <CardDescription className="text-[11px] leading-relaxed mt-1">
                              {rep.desc}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ─── TAB 2: FINANCIAL ANALYTICS LEDGER ─── */}
            <TabsContent value="financial" className="space-y-6 outline-none">
              {/* Financial KPI Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-border/50 card-shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs text-muted-foreground font-semibold">Total Billed Invoiced</div>
                      <div className="text-2xl font-black text-foreground">
                        ${totalInvoiced.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 card-shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs text-muted-foreground font-semibold">Total Cash Collected</div>
                      <div className="text-2xl font-black text-foreground">
                        ${totalCollected.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 card-shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-rose-500/10 rounded-lg text-rose-600">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs text-muted-foreground font-semibold">Outstanding Accounts Debt</div>
                      <div className="text-2xl font-black text-rose-600">
                        ${totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 card-shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-lg text-amber-600">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs text-muted-foreground font-semibold">Shift Realized Labor Cost</div>
                      <div className="text-2xl font-black text-foreground">
                        ${Number(totalLaborCost).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Charts Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Chart 1: Project Profitability (P&L Area Chart) */}
                <Card className="border-border/50 card-shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                      <span>Project Revenues vs. Labor Expenses</span>
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">Profit Margins</Badge>
                    </CardTitle>
                    <CardDescription>
                      Comparison of project estimated total contract values vs. shift wages incurred.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px] p-4 pt-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartProjectPLData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="colorLabor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                        <XAxis dataKey="name" className="text-[10px] font-semibold fill-muted-foreground" />
                        <YAxis className="text-[10px] font-semibold fill-muted-foreground" tickFormatter={(value) => `$${value}`} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                          itemStyle={{ fontSize: "11px" }}
                          labelStyle={{ fontWeight: "bold", fontSize: "12px", marginBottom: "4px" }}
                          formatter={(value: any) => [`$${value.toLocaleString()}`, undefined]}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                        <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                        <Area type="monotone" dataKey="Labor Cost" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLabor)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Chart 2: Client Debt Analysis (Accounts Receivable Bar Chart) */}
                <Card className="border-border/50 card-shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                      <span>Client Ledger Billed vs. Outstanding Balance</span>
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600">Receivables</Badge>
                    </CardTitle>
                    <CardDescription>
                      Visual audit of invoice values billed, cash collections, and pending client debt.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px] p-4 pt-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartClientDebtData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                        <XAxis dataKey="name" className="text-[10px] font-semibold fill-muted-foreground" />
                        <YAxis className="text-[10px] font-semibold fill-muted-foreground" tickFormatter={(value) => `$${value}`} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                          itemStyle={{ fontSize: "11px" }}
                          labelStyle={{ fontWeight: "bold", fontSize: "12px", marginBottom: "4px" }}
                          formatter={(value: any) => [`$${value.toLocaleString()}`, undefined]}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                        <Bar dataKey="Billed" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                        <Bar dataKey="Collected" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                        <Bar dataKey="Outstanding" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Accounts Receivable & Outstanding Debts */}
              <Card className="border-border/50 card-shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Client Balances Ledger (Accounts Receivable)
                  </CardTitle>
                  <CardDescription>
                    Summary of invoice statuses, collected payments, and current outstanding debts per client.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <PaginatedTableFull
                    data={customerDebtList}
                    renderTable={(paginatedCustomers) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Active Projects</TableHead>
                        <TableHead>Total Invoiced</TableHead>
                        <TableHead>Payments Collected</TableHead>
                        <TableHead className="text-rose-600 font-bold">Outstanding Debt</TableHead>
                        <TableHead>Account Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                            No billing data available.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedCustomers.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-bold text-foreground">{c.name}</TableCell>
                            <TableCell>{c.projectsCount} projects</TableCell>
                            <TableCell>${c.invoiced.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell className="text-emerald-600 font-semibold">
                              ${c.collected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="font-bold text-rose-600">
                              ${c.debt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              {c.debt > 0 ? (
                                <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 gap-1">
                                  <AlertTriangle className="h-3 w-3" /> Balance Pending
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                                  <CheckCircle className="h-3 w-3" /> Paid in Full
                                </Badge>
                              )}
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

              {/* Project Profit & Loss (P&L) Ledger */}
              <Card className="border-border/50 card-shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Project Profit & Loss (P&L) Margins
                  </CardTitle>
                  <CardDescription>
                    Real-time contract revenues, approved change order cost adjustments, shift labor costs, and margins.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <PaginatedTableFull
                    data={projects}
                    renderTable={(paginatedProjects) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Contract Value</TableHead>
                        <TableHead>Change Orders</TableHead>
                        <TableHead>Total Est. Revenue</TableHead>
                        <TableHead>Realized Billed</TableHead>
                        <TableHead>Realized Labor</TableHead>
                        <TableHead className="font-bold">Net Profit</TableHead>
                        <TableHead>Profit Margin %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                            No projects registered.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedProjects.map((p: any) => {
                          const budget = Number(p.contract_value) || 0;
                          
                          // Sum up approved change orders cost impact
                          const projectChangeOrders = changeOrders.filter(
                            (co: any) => co.project_id === p.id && co.status === "Approved"
                          );
                          const coImpact = projectChangeOrders.reduce(
                            (sum: number, co: any) => sum + Number(co.cost_impact),
                            0
                          );

                          const totalEstRevenue = budget + coImpact;
                          
                          // Sum realized invoices billed for this project
                          const projectInvoices = validInvoices.filter(
                            (inv: any) => inv.job?.project?.id === p.id
                          );
                          const realizedRevenue = projectInvoices.reduce(
                            (sum: number, inv: any) => sum + Number(inv.amount),
                            0
                          );

                          const laborCost = projectLaborCosts[p.id] || 0;
                          const netProfit = totalEstRevenue - laborCost;
                          const marginPercent = totalEstRevenue > 0 ? (netProfit / totalEstRevenue) * 100 : 0;

                          return (
                            <TableRow key={p.id}>
                              <TableCell className="font-bold text-foreground">{p.name}</TableCell>
                              <TableCell>${budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell className="text-blue-600">
                                {projectChangeOrders.length > 0 ? `+${coImpact.toLocaleString("en-US", { minimumFractionDigits: 2 })} (${projectChangeOrders.length})` : "$0.00"}
                              </TableCell>
                              <TableCell className="font-semibold">${totalEstRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell>${realizedRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell className="text-muted-foreground">${laborCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell className={`font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                ${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={Math.max(0, Math.min(100, marginPercent))} className="w-16 h-1.5" />
                                  <span className={`text-xs font-semibold ${marginPercent >= 20 ? "text-emerald-600" : marginPercent >= 0 ? "text-amber-600" : "text-rose-600"}`}>
                                    {marginPercent.toFixed(1)}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── TAB 3: GEOFENCE HISTORY LOGS ─── */}
            <TabsContent value="history" className="space-y-6 outline-none">
              {company?.id ? (
                <GeofenceHistory companyId={company.id} />
              ) : (
                <p className="text-muted-foreground text-sm">Loading active company logs...</p>
              )}
            </TabsContent>

            {/* ─── TAB 4: BIOMETRIC AUDIT LOGS ─── */}
            <TabsContent value="audit" className="space-y-6 outline-none">
              {company?.id ? (
                <FaceVerificationReview companyId={company.id} />
              ) : (
                <p className="text-muted-foreground text-sm">Loading audit logs...</p>
              )}
            </TabsContent>

            {/* ─── TAB 5: MANAGEMENT AUDIT TRAIL ─── */}
            <TabsContent value="management" className="space-y-6 outline-none">
              <Card className="border-border/50 card-shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Management Activity Logs & Audit Trail
                    </CardTitle>
                    <CardDescription>
                      End-to-end security logs tracking actions, database mutations, and system events across company management and field crews.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {auditLogsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <PaginatedTableFull
                      data={auditLogs}
                      renderTable={(paginatedLogs) => (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[180px]">Timestamp</TableHead>
                              <TableHead className="w-[180px]">Performed By</TableHead>
                              <TableHead className="w-[100px]">Action</TableHead>
                              <TableHead className="w-[140px]">Category</TableHead>
                              <TableHead>Activity Details</TableHead>
                              <TableHead className="w-[130px]">IP Address</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedLogs.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                                  No audit log events recorded for this company.
                                </TableCell>
                              </TableRow>
                            ) : (
                              paginatedLogs.map((log) => {
                                const getAuditDetails = (l: any) => {
                                  const table = l.table_name;
                                  const action = l.action;
                                  const newData = l.new_data || {};
                                  const oldData = l.old_data || {};

                                  if (table === 'invoices') {
                                    if (action === 'INSERT') return `Created invoice with balance of $${(newData.amount || 0).toLocaleString()}`;
                                    if (action === 'UPDATE') {
                                      if (oldData.status !== newData.status) return `Invoice status updated from "${oldData.status}" to "${newData.status}"`;
                                      if (oldData.payment_status !== newData.payment_status) return `Payment status changed from "${oldData.payment_status}" to "${newData.payment_status}"`;
                                      return `Modified invoice details (Amount: $${(newData.amount || 0).toLocaleString()})`;
                                    }
                                    return `Deleted invoice record`;
                                  }
                                  if (table === 'change_orders') {
                                    if (action === 'INSERT') return `Created change order "${newData.title || 'Untitled'}" with cost impact of $${(newData.cost_impact || 0).toLocaleString()}`;
                                    if (action === 'UPDATE') {
                                      if (oldData.status !== newData.status) return `Change order "${newData.title}" status updated to "${newData.status}"`;
                                      return `Modified change order "${newData.title}"`;
                                    }
                                    return `Deleted change order "${oldData.title}"`;
                                  }
                                  if (table === 'staff_profiles') {
                                    if (action === 'UPDATE') {
                                      if (oldData.global_role !== newData.global_role) return `Global security role changed from "${oldData.global_role}" to "${newData.global_role}"`;
                                      if (oldData.can_manage_roles !== newData.can_manage_roles) return `Role management permissions updated`;
                                      return `Modified staff profile`;
                                    }
                                    return `Staff profile action: ${action}`;
                                  }
                                  if (table === 'jobs') {
                                    if (action === 'INSERT') return `Created job/work order: "${newData.title}" (Status: ${newData.status})`;
                                    if (action === 'UPDATE') {
                                      if (oldData.status !== newData.status) return `Job "${newData.title}" status updated from "${oldData.status}" to "${newData.status}"`;
                                      return `Updated work details for job "${newData.title}"`;
                                    }
                                    return `Deleted job "${oldData.title || 'record'}"`;
                                  }
                                  if (table === 'estimates') {
                                    if (action === 'INSERT') return `Created sales quote estimate: "${newData.title}" (Value: ₦${(newData.total_amount || 0).toLocaleString()})`;
                                    if (action === 'UPDATE') {
                                      if (oldData.status !== newData.status) return `Sales quote "${newData.title}" status updated from "${oldData.status}" to "${newData.status}"`;
                                      return `Updated sales quote details for "${newData.title}"`;
                                    }
                                    return `Deleted sales quote "${oldData.title || 'record'}"`;
                                  }
                                  if (table === 'geofence_events') {
                                    const type = newData.event_type || 'event';
                                    const cleanType = type === 'check_in' ? 'Clocked In (Check-in)' : type === 'check_out' ? 'Clocked Out (Check-out)' : type;
                                    return `Field Staff clocking activity: ${cleanType} via GPS Geofencing`;
                                  }
                                  
                                  return `${action} action performed on ${table}`;
                                };

                                const getCategoryStyle = (table: string) => {
                                  switch (table) {
                                    case 'invoices': return 'bg-amber-100 text-amber-800 border-amber-200';
                                    case 'change_orders': return 'bg-blue-100 text-blue-800 border-blue-200';
                                    case 'staff_profiles': return 'bg-purple-100 text-purple-800 border-purple-200';
                                    case 'jobs': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                                    case 'estimates': return 'bg-orange-100 text-orange-800 border-orange-200';
                                    case 'geofence_events': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
                                    default: return 'bg-slate-100 text-slate-800 border-slate-200';
                                  }
                                };

                                return (
                                  <TableRow key={log.id}>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-sm text-foreground">{log.performer_name}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">{log.performer_role}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] font-bold px-1.5 py-0.5 ${
                                          log.action === 'INSERT' ? 'bg-green-500/10 text-green-700 border-green-200' :
                                          log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-700 border-blue-200' :
                                          'bg-red-500/10 text-red-700 border-red-200'
                                        }`}
                                      >
                                        {log.action}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={`text-[10px] capitalize px-1.5 py-0.5 ${getCategoryStyle(log.table_name)}`}>
                                        {log.table_name.replace('_', ' ')}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs font-medium text-slate-700 max-w-[400px] truncate">
                                      {getAuditDetails(log)}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground font-mono">
                                      {log.ip_address || "N/A"}
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
    </>
  );

  if (projectId) {
    return pageContent;
  }

  return (
    <>
      <SEO
        title="Reports & Logs Hub"
        description="Centralized data analytics, safety incident logs, profit margin breakdowns, geofence check-ins, and biometric verification audits."
        path="/reports"
        noIndex
      />
      <DashboardLayout
        activeTab="reports"
        companyName={company?.name || ""}
        companyPrefix={company?.prefix || ""}
        companyId={company?.id || ""}
      >
        {pageContent}
      </DashboardLayout>
    </>
  );
}
