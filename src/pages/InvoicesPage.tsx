import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { PaginatedTableFull } from "@/components/PaginatedTable";
import FilterChipBar, { FilterChip } from "@/components/FilterChipBar";
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
  generateQuickBooksCSV,
  generateXeroCSV,
  downloadCSV,
} from "@/lib/quickbooks";
import {
  Loader2,
  Receipt,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  FileSpreadsheet,
  Printer,
  PenTool,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  Briefcase,
  Search,
  X,
  CreditCard,
  Banknote,
  TrendingDown,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface PricebookItem {
  id: string;
  item_name: string;
  unit_cost: number;
  kind: string;
  description: string | null;
  category: string | null;
  cost: number;
}

interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Job {
  id: string;
  title: string;
  project_id: string;
  customer_id: string;
  project?: { name: string };
  customer?: { name: string; billing_address: string | null };
}

interface Invoice {
  id: string;
  job_id: string;
  amount: number;
  status: string;
  payment_status: string;
  client_signature_url: string | null;
  created_at: string;
  job?: Job;
}

interface BuilderLineItem {
  itemId: string;
  name: string;
  rate: number;
  quantity: number;
}

export default function InvoicesPage({ projectId }: { projectId?: string }) {
  const { user, company, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [invStatusFilter, setInvStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  // Dialog States
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invJobId, setInvJobId] = useState("");
  const [invStatus, setInvStatus] = useState("Draft");
  const [invPaymentStatus, setInvPaymentStatus] = useState("Unpaid");
  const [invLines, setInvLines] = useState<BuilderLineItem[]>([]);

  // Pricebook States
  const [pbItemName, setPbItemName] = useState("");
  const [pbUnitCost, setPbUnitCost] = useState("");
  const [pbKind, setPbKind] = useState("service");
  const [pbDescription, setPbDescription] = useState("");
  const [pbCost, setPbCost] = useState("");
  const [pbCategory, setPbCategory] = useState("");
  const [editingPbItem, setEditingPbItem] = useState<PricebookItem | null>(null);
  const [pbDialogOpen, setPbDialogOpen] = useState(false);

  // PDF Preview State
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Signature States
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Payment Recording States
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [payInvoiceId, setPayInvoiceId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("card");
  const [payNotes, setPayNotes] = useState("");

  // 1. Fetch Pricebook items
  const { data: pricebook = [], isLoading: pbLoading } = useQuery({
    queryKey: ["pricebook", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("pricebook")
        .select("*")
        .eq("company_id", company.id)
        .order("item_name", { ascending: true });
      if (error) throw error;
      return data as PricebookItem[];
    },
    enabled: !!company?.id,
  });

  // 2. Fetch Jobs (for linking invoice)
  const { data: jobs = [] } = useQuery({
    queryKey: ["invoice_jobs", company?.id, projectId],
    queryFn: async () => {
      if (!company?.id) return [];
      let query = supabase
        .from("jobs")
        .select(`
          *,
          project:projects(name),
          customer:customers(name, billing_address)
        `);
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((j: any) => ({
        ...j,
        project: j.project ? { name: j.project.name } : undefined,
        customer: j.customer ? { name: j.customer.name, billing_address: j.customer.billing_address } : undefined,
      })) as Job[];
    },
    enabled: !!company?.id,
  });

  // 3. Fetch Invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      
      // Get all jobs for the company to filter invoices correctly
      const jobIds = jobs.map(j => j.id);
      if (jobIds.length === 0) return [];

      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          job:jobs(
            id,
            title,
            project_id,
            customer_id,
            project:projects(name),
            customer:customers(name, billing_address)
          )
        `)
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((inv: any) => ({
        ...inv,
        job: inv.job ? {
          id: inv.job.id,
          title: inv.job.title,
          project_id: inv.job.project_id,
          customer_id: inv.job.customer_id,
          project: inv.job.project ? { name: inv.job.project.name } : undefined,
          customer: inv.job.customer ? { name: inv.job.customer.name, billing_address: inv.job.customer.billing_address } : undefined,
        } : undefined,
      })) as Invoice[];
    },
    enabled: !!company?.id && jobs.length > 0,
  });

  // 3b. Fetch Payments
  const { data: payments = [] } = useQuery({
    queryKey: ["payments", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const invoiceIds = invoices.map(i => i.id);
      if (invoiceIds.length === 0) return [];

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .in("invoice_id", invoiceIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!company?.id && invoices.length > 0,
  });

  // Record manual/cash/card payment
  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!payInvoiceId) throw new Error("Invoice selection is required");
      const amountNum = parseFloat(payAmount);
      if (isNaN(amountNum) || amountNum <= 0) throw new Error("Enter a valid payment amount");

      const { error } = await supabase.from("payments").insert({
        invoice_id: payInvoiceId,
        amount: amountNum,
        payment_method: payMethod,
        notes: payNotes || null,
        status: "completed"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", company?.id] });
      queryClient.invalidateQueries({ queryKey: ["payments", company?.id] });
      toast({
        title: "Payment recorded",
        description: `Successfully logged $${parseFloat(payAmount).toFixed(2)} payment.`,
      });
      setPaymentDialogOpen(false);
      setPayAmount("");
      setPayNotes("");
    },
    onError: (err: any) => {
      toast({
        title: "Error recording payment",
        description: err.message,
        variant: "destructive"
      });
    }
  });

  // 3c. Compute AR Aging Buckets
  const arAging = useMemo(() => {
    let current = 0;
    let age1to30 = 0;
    let age31to60 = 0;
    let age61to90 = 0;
    let ageOver90 = 0;
    let totalUnpaid = 0;

    invoices.forEach((inv) => {
      if (inv.payment_status === "Paid") return;

      const createdDate = new Date(inv.created_at);
      const daysOld = differenceInDays(new Date(), createdDate);
      const unpaidAmount = inv.amount;

      totalUnpaid += unpaidAmount;
      if (daysOld <= 0) {
        current += unpaidAmount;
      } else if (daysOld <= 30) {
        age1to30 += unpaidAmount;
      } else if (daysOld <= 60) {
        age31to60 += unpaidAmount;
      } else if (daysOld <= 90) {
        age61to90 += unpaidAmount;
      } else {
        ageOver90 += unpaidAmount;
      }
    });

    return { current, age1to30, age31to60, age61to90, ageOver90, totalUnpaid };
  }, [invoices]);

  // Pricebook Mutations
  const savePricebookMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) throw new Error("No company linked");
      if (!pbItemName.trim()) throw new Error("Item name is required");

      const payload = {
        company_id: company.id,
        item_name: pbItemName.trim(),
        unit_cost: parseFloat(pbUnitCost) || 0.00,
        kind: pbKind,
        description: pbDescription.trim() || null,
        cost: parseFloat(pbCost) || 0.00,
        category: pbCategory.trim() || null,
      };

      if (editingPbItem) {
        const { error } = await supabase
          .from("pricebook")
          .update(payload)
          .eq("id", editingPbItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pricebook").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricebook", company?.id] });
      toast({
        title: editingPbItem ? "Pricebook item updated" : "Pricebook item added",
        description: `Successfully saved ${pbItemName}.`,
      });
      setPbItemName("");
      setPbUnitCost("");
      setPbKind("service");
      setPbDescription("");
      setPbCost("");
      setPbCategory("");
      setEditingPbItem(null);
      setPbDialogOpen(false);
    },
    onError: (err: any) => {
      toast({
        title: "Error saving pricebook item",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deletePricebookMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pricebook").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricebook", company?.id] });
      toast({
        title: "Item deleted",
        description: "Pricebook rate deleted.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error deleting item",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Invoice Mutations
  const saveInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!invJobId) throw new Error("Job selection is required");

      // Calculate total amount from lines
      const totalAmount = invLines.reduce((sum, item) => sum + (item.rate * item.quantity), 0);

      const payload = {
        job_id: invJobId,
        amount: totalAmount,
        status: invStatus,
        payment_status: invPaymentStatus,
      };

      if (editingInvoice) {
        const { error } = await supabase
          .from("invoices")
          .update(payload)
          .eq("id", editingInvoice.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("invoices").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", company?.id] });
      toast({
        title: editingInvoice ? "Invoice updated" : "Invoice created",
        description: "Successfully saved invoice details.",
      });
      closeInvoiceDialog();
    },
    onError: (err: any) => {
      toast({
        title: "Error saving invoice",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", company?.id] });
      if (selectedInvoiceId) setSelectedInvoiceId(null);
      toast({
        title: "Invoice deleted",
        description: "Invoice record has been removed.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error deleting invoice",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateSignatureMutation = useMutation({
    mutationFn: async ({ id, sigUrl }: { id: string; sigUrl: string }) => {
      const { error } = await supabase
        .from("invoices")
        .update({ client_signature_url: sigUrl })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", company?.id] });
      toast({
        title: "Signature saved",
        description: "Customer sign-off logged successfully.",
      });
      setSignatureDialogOpen(false);
    },
    onError: (err: any) => {
      toast({
        title: "Error saving signature",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Helpers
  const openInvoiceDialog = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setInvJobId(invoice.job_id);
      setInvStatus(invoice.status);
      setInvPaymentStatus(invoice.payment_status);
      
      // Seed lines list from pricebook or construct basic line item sum
      setInvLines([
        {
          itemId: "",
          name: "HVAC Servicing / Work Order Charge",
          rate: invoice.amount,
          quantity: 1,
        },
      ]);
    } else {
      setEditingInvoice(null);
      setInvJobId(jobs.length > 0 ? jobs[0].id : "");
      setInvStatus("Draft");
      setInvPaymentStatus("Unpaid");
      setInvLines([]);
    }
    setInvoiceDialogOpen(true);
  };

  const closeInvoiceDialog = () => {
    setInvoiceDialogOpen(false);
    setEditingInvoice(null);
  };

  const addLineItem = (itemId: string) => {
    const pbItem = pricebook.find((item) => item.id === itemId);
    if (!pbItem) return;

    setInvLines([
      ...invLines,
      {
        itemId: pbItem.id,
        name: pbItem.item_name,
        rate: pbItem.unit_cost,
        quantity: 1,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    setInvLines(invLines.filter((_, i) => i !== index));
  };

  const updateLineItemQuantity = (index: number, qty: number) => {
    setInvLines(
      invLines.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, qty) } : item))
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">Paid</Badge>;
      case "Sent":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Sent</Badge>;
      case "Void":
        return <Badge variant="secondary">Void</Badge>;
      case "Draft":
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Paid</Badge>;
      case "Partially Paid":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1"><Clock className="h-3 w-3" /> Partially Paid</Badge>;
      case "Overdue":
        return <Badge className="bg-red-500/10 text-red-600 border-red-200 gap-1"><AlertTriangle className="h-3 w-3" /> Overdue</Badge>;
      case "Unpaid":
      default:
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Unpaid</Badge>;
    }
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !selectedInvoiceId) return;
    
    const sigDataUrl = canvas.toDataURL();
    updateSignatureMutation.mutate({
      id: selectedInvoiceId,
      sigUrl: sigDataUrl,
    });
  };

  useEffect(() => {
    if (signatureDialogOpen && signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
      }
    }
  }, [signatureDialogOpen]);

  // Fetch sync logs
  const { data: syncLogs = [] } = useQuery({
    queryKey: ["accounting_sync_logs", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("accounting_sync_logs")
        .select(`
          *,
          synced_by_profile:staff_profiles(full_name)
        `)
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((log: any) => ({
        ...log,
        synced_by_name: log.synced_by_profile?.full_name || "Biller"
      }));
    },
    enabled: !!company?.id,
  });

  const createSyncLogMutation = useMutation({
    mutationFn: async ({ platform, count }: { platform: "QuickBooks" | "Xero"; count: number }) => {
      if (!company?.id) return;
      const { error } = await supabase.from("accounting_sync_logs").insert({
        company_id: company.id,
        platform,
        records_count: count,
        status: "success"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounting_sync_logs", company?.id] });
    }
  });

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  // Accounting Exports Trigger
  const handleExportQuickBooks = () => {
    const formatData = invoices.map((inv) => ({
      id: inv.id,
      amount: inv.amount,
      status: inv.status,
      payment_status: inv.payment_status,
      created_at: inv.created_at,
      customerName: inv.job?.customer?.name || "N/A",
      jobTitle: inv.job?.title || "N/A",
      projectName: inv.job?.project?.name || "N/A",
    }));

    const csvContent = generateQuickBooksCSV(formatData);
    downloadCSV(csvContent, `QuickBooks_Invoices_${format(new Date(), "yyyyMMdd")}.csv`);
    createSyncLogMutation.mutate({ platform: "QuickBooks", count: formatData.length });
    toast({ title: "Export complete", description: "QuickBooks Online CSV downloaded." });
  };

  const handleExportXero = () => {
    const formatData = invoices.map((inv) => ({
      id: inv.id,
      amount: inv.amount,
      status: inv.status,
      payment_status: inv.payment_status,
      created_at: inv.created_at,
      customerName: inv.job?.customer?.name || "N/A",
      jobTitle: inv.job?.title || "N/A",
      projectName: inv.job?.project?.name || "N/A",
    }));

    const csvContent = generateXeroCSV(formatData);
    downloadCSV(csvContent, `Xero_Invoices_${format(new Date(), "yyyyMMdd")}.csv`);
    createSyncLogMutation.mutate({ platform: "Xero", count: formatData.length });
    toast({ title: "Export complete", description: "Xero CSV template downloaded." });
  };

  if (authLoading || invoicesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pageContent = (
    <>
      <div className="p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Invoices & Pricebook
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Construct customer quotes, assign pricebook items, collect signatures, and download CSVs for QuickBooks/Xero.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleExportQuickBooks} className="gap-1.5 shrink-0 text-xs">
                <FileSpreadsheet className="h-4 w-4 text-green-600" /> Export QuickBooks
              </Button>
              <Button variant="outline" onClick={handleExportXero} className="gap-1.5 shrink-0 text-xs">
                <FileSpreadsheet className="h-4 w-4 text-blue-600" /> Export Xero
              </Button>
              <Button onClick={() => openInvoiceDialog()} className="gap-2 shrink-0">
                <Plus className="h-4 w-4" /> Create Invoice
              </Button>
            </div>
          </div>

          {/* Accounts Receivable Aging Ledger */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card className="border-border/40 bg-card/60">
              <CardContent className="p-3">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Current</span>
                <span className="text-lg font-black text-foreground block mt-1">${arAging.current.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/60">
              <CardContent className="p-3">
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider block">1–30 Days</span>
                <span className="text-lg font-black text-amber-600 block mt-1">${arAging.age1to30.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/60">
              <CardContent className="p-3">
                <span className="text-[10px] uppercase font-bold text-orange-500 tracking-wider block">31–60 Days</span>
                <span className="text-lg font-black text-orange-600 block mt-1">${arAging.age31to60.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/60">
              <CardContent className="p-3">
                <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider block">61–90 Days</span>
                <span className="text-lg font-black text-red-600 block mt-1">${arAging.age61to90.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-red-500/5">
              <CardContent className="p-3">
                <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider block">Over 90 Days</span>
                <span className="text-lg font-black text-red-700 block mt-1">${arAging.ageOver90.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Invoices List Board */}
            <Card className="lg:col-span-2 border-border/50 card-shadow-md">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-lg font-bold">Client Invoices</CardTitle>
                  <FilterChipBar
                    hasActiveFilters={invStatusFilter !== "ALL" || paymentFilter !== "ALL"}
                    onClearAll={() => {
                      setInvStatusFilter("ALL");
                      setPaymentFilter("ALL");
                    }}
                  >
                    <FilterChip
                      label="All Statuses"
                      selectedValue={invStatusFilter}
                      options={[
                        { label: "Draft", value: "Draft" },
                        { label: "Sent", value: "Sent" },
                        { label: "Paid", value: "Paid" },
                        { label: "Void", value: "Void" },
                      ]}
                      onSelect={setInvStatusFilter}
                      onClear={() => setInvStatusFilter("ALL")}
                    />
                    <FilterChip
                      label="All Payments"
                      selectedValue={paymentFilter}
                      options={[
                        { label: "Unpaid", value: "Unpaid" },
                        { label: "Partially Paid", value: "Partially Paid" },
                        { label: "Paid", value: "Paid" },
                      ]}
                      onSelect={setPaymentFilter}
                      onClear={() => setPaymentFilter("ALL")}
                    />
                  </FilterChipBar>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by client, job title, or invoice ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <PaginatedTableFull
                  data={invoices.filter((inv) => {
                    const q = searchQuery.toLowerCase();
                    const matchesSearch = !q ||
                      inv.id.toLowerCase().includes(q) ||
                      (inv.job?.customer?.name || "").toLowerCase().includes(q) ||
                      (inv.job?.title || "").toLowerCase().includes(q);
                    const matchesStatus = invStatusFilter === "ALL" || inv.status === invStatusFilter;
                    const matchesPayment = paymentFilter === "ALL" || inv.payment_status === paymentFilter;
                    return matchesSearch && matchesStatus && matchesPayment;
                  })}
                  renderTable={(paginatedInvoices) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Client & Job</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Signature</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                            No invoices generated yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedInvoices.map((inv) => (
                          <TableRow
                            key={inv.id}
                            className={`cursor-pointer transition-colors ${
                              selectedInvoiceId === inv.id ? "bg-muted/65" : "hover:bg-muted/30"
                            }`}
                            onClick={() => setSelectedInvoiceId(inv.id)}
                          >
                            <TableCell className="font-mono text-xs uppercase">{inv.id.substring(0, 8)}</TableCell>
                            <TableCell>
                              <div className="font-semibold text-foreground">{inv.job?.customer?.name || "—"}</div>
                              <div className="text-xs text-muted-foreground">{inv.job?.title || "—"}</div>
                            </TableCell>
                            <TableCell className="font-bold text-foreground">${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell>{getStatusBadge(inv.status)}</TableCell>
                            <TableCell>{getPaymentStatusBadge(inv.payment_status)}</TableCell>
                            <TableCell>
                              {inv.client_signature_url ? (
                                <Badge className="bg-green-500/10 text-green-600 border-green-200">Signed</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                {inv.payment_status !== "Paid" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setPayInvoiceId(inv.id);
                                      setPayAmount(inv.amount.toString());
                                      setPaymentDialogOpen(true);
                                    }}
                                    title="Record Payment"
                                    className="text-emerald-600 hover:bg-emerald-500/10"
                                  >
                                    <CreditCard className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedInvoiceId(inv.id);
                                    setPreviewDialogOpen(true);
                                  }}
                                  title="Print / PDF Invoice Preview"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedInvoiceId(inv.id);
                                    setSignatureDialogOpen(true);
                                  }}
                                  title="Collect Client Signature"
                                >
                                  <PenTool className="h-4 w-4 text-primary" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openInvoiceDialog(inv)}
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm("Delete this invoice record?")) {
                                      deleteInvoiceMutation.mutate(inv.id);
                                    }
                                  }}
                                  className="text-destructive hover:bg-destructive/10"
                                  title="Delete"
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

            {/* Pricebook Panel */}
            <Card className="border-border/50 card-shadow-md">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Pricebook Manager
                  </CardTitle>
                  <CardDescription>Establish unit cost values for materials and labor.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPbDialogOpen(true)} className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {pbLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : pricebook.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-lg bg-muted/20">
                    <p className="text-xs text-muted-foreground">Pricebook is empty.</p>
                    <Button variant="link" size="xs" onClick={() => setPbDialogOpen(true)} className="text-primary mt-1">
                      Add Service Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pricebook.map((item) => (
                      <div key={item.id} className="p-3 border border-border/40 rounded-lg bg-muted/10 flex items-center justify-between group">
                        <div>
                          <div className="font-semibold text-sm text-foreground flex flex-wrap items-center gap-1.5">
                            {item.item_name}
                            <Badge variant="secondary" className="text-[10px] py-0 px-1 capitalize">
                              {item.kind}
                            </Badge>
                            {item.category && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1">
                                {item.category}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-primary font-mono font-bold mt-0.5">
                            Price: ${item.unit_cost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            {item.cost > 0 && (
                              <span className="text-muted-foreground ml-2 font-normal">
                                (Cost: ${item.cost.toLocaleString("en-US", { minimumFractionDigits: 2 })})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingPbItem(item);
                              setPbItemName(item.item_name);
                              setPbUnitCost(item.unit_cost.toString());
                              setPbKind(item.kind || "service");
                              setPbDescription(item.description || "");
                              setPbCost(item.cost?.toString() || "");
                              setPbCategory(item.category || "");
                              setPbDialogOpen(true);
                            }}
                            className="h-7 w-7"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Delete item "${item.item_name}"?`)) {
                                deletePricebookMutation.mutate(item.id);
                              }
                            }}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sync History Logs Panel */}
            <Card className="border-border/50 card-shadow-md mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  Accounting Sync Log
                </CardTitle>
                <CardDescription className="text-[11px]">CSV ledger export downloads synced to QuickBooks/Xero.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 max-h-[220px] overflow-y-auto">
                {syncLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No export runs logged yet.</p>
                ) : (
                  <div className="divide-y text-xs">
                    {syncLogs.map((log) => (
                      <div key={log.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1">
                            {log.platform} Export
                            <Badge className="bg-green-500/10 text-green-600 border-green-200 text-[9px] py-0 px-1">
                              {log.status}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {log.records_count} invoices by {log.synced_by_name}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(log.created_at), "MMM dd, HH:mm")}
                          </span>
                          <div>
                            <Button
                              variant="link"
                              size="xs"
                              className="text-[10px] p-0 h-auto text-primary hover:underline mt-0.5"
                              onClick={() => {
                                if (log.platform === "QuickBooks") {
                                  handleExportQuickBooks();
                                } else {
                                  handleExportXero();
                                }
                              }}
                            >
                              Retry Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Invoice Builder Dialog */}
        <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                {editingInvoice ? "Modify Invoice Record" : "Quote-to-Invoice Builder"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Link Job / Work Order Scope *</label>
                <Select value={invJobId} onValueChange={setInvJobId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.title} ({j.customer?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pricebook Add Item dropdown */}
              <div className="space-y-2 border-t pt-3">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Select Line Items from Pricebook</label>
                <div className="flex gap-2">
                  <Select onValueChange={(val) => addLineItem(val)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Add item to quote" />
                    </SelectTrigger>
                    <SelectContent>
                      {pricebook.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.item_name} (${item.unit_cost})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Selected Line Items List */}
              <div className="space-y-2 max-h-[180px] overflow-y-auto border p-2 rounded-lg bg-muted/10">
                {invLines.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No lines added yet. Choose a pricebook item above.</p>
                ) : (
                  invLines.map((line, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs border-b pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                      <div className="flex-1">
                        <span className="font-semibold text-foreground">{line.name}</span>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          Rate: ${line.rate}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] font-semibold text-muted-foreground">Qty:</label>
                          <Input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => updateLineItemQuantity(idx, parseInt(e.target.value) || 1)}
                            className="h-7 w-12 text-center text-xs p-1"
                          />
                        </div>
                        <span className="font-bold font-mono text-foreground">${(line.rate * line.quantity).toLocaleString()}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(idx)}
                          className="h-6 w-6 text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Dynamic Totals */}
              <div className="flex items-center justify-between border-t pt-3 font-bold text-foreground">
                <span>Calculated Invoice Amount:</span>
                <span className="text-xl font-mono text-primary">
                  ${invLines.reduce((sum, item) => sum + (item.rate * item.quantity), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Invoice Status</label>
                  <Select value={invStatus} onValueChange={setInvStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Sent">Sent</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Void">Void</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Payment Status</label>
                  <Select value={invPaymentStatus} onValueChange={setInvPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                      <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeInvoiceDialog}>
                Cancel
              </Button>
              <Button onClick={() => saveInvoiceMutation.mutate()} disabled={saveInvoiceMutation.isPending}>
                {saveInvoiceMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pricebook Item Dialog */}
        <Dialog open={pbDialogOpen} onOpenChange={setPbDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                {editingPbItem ? "Modify Pricebook Item" : "Create Pricebook Item"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Item Name *</label>
                <Input
                  placeholder="e.g. Compressor Coil Replacement"
                  value={pbItemName}
                  onChange={(e) => setPbItemName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Retail Price ($) *</label>
                  <Input
                    type="number"
                    placeholder="120.00"
                    value={pbUnitCost}
                    onChange={(e) => setPbUnitCost(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Internal Cost ($)</label>
                  <Input
                    type="number"
                    placeholder="45.00"
                    value={pbCost}
                    onChange={(e) => setPbCost(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Kind</label>
                  <Select value={pbKind} onValueChange={setPbKind}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Category</label>
                  <Input
                    placeholder="e.g. HVAC, Plumbing"
                    value={pbCategory}
                    onChange={(e) => setPbCategory(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Description</label>
                <Input
                  placeholder="Optional item detail..."
                  value={pbDescription}
                  onChange={(e) => setPbDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPbDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => savePricebookMutation.mutate()} disabled={savePricebookMutation.isPending}>
                {savePricebookMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invoice PDF Print Overlay */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto print:p-0">
            <DialogHeader className="print:hidden">
              <DialogTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" />
                Invoice Print & PDF Template
              </DialogTitle>
            </DialogHeader>
            
            {/* Printable Area */}
            <div className="border p-8 rounded-lg bg-background text-foreground space-y-8 font-sans print:border-0 print:p-0">
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-primary tracking-tight">{company?.name || "FiledCrews"}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Ref Prefix: {company?.prefix}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold uppercase text-muted-foreground">INVOICE</h2>
                  <p className="font-mono text-xs font-bold text-foreground uppercase mt-1">#INV-{selectedInvoice?.id.substring(0, 8)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Date: {selectedInvoice ? format(new Date(selectedInvoice.created_at), "MMM dd, yyyy") : ""}</p>
                </div>
              </div>

              {/* Bill To & Job Info */}
              <div className="grid grid-cols-2 gap-8 text-sm">
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase">Bill To:</div>
                  <div className="font-bold text-foreground mt-1">{selectedInvoice?.job?.customer?.name}</div>
                  <div className="text-muted-foreground mt-0.5 whitespace-pre-line text-xs">
                    {selectedInvoice?.job?.customer?.billing_address || "No billing address logged."}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase">Work Order Scope:</div>
                  <div className="font-bold text-foreground mt-1">{selectedInvoice?.job?.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Project: {selectedInvoice?.job?.project?.name}</div>
                  <div className="text-xs font-semibold text-primary mt-2">
                    Payment Terms: Due Net 30 Days
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-bold">Product / Service Item</TableHead>
                      <TableHead className="text-center text-xs font-bold w-[100px]">Qty</TableHead>
                      <TableHead className="text-right text-xs font-bold w-[120px]">Rate</TableHead>
                      <TableHead className="text-right text-xs font-bold w-[120px]">Line Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium text-xs">
                        FSM Servicing - Duct clean, coils repair & filter checks
                      </TableCell>
                      <TableCell className="text-center text-xs font-mono">1</TableCell>
                      <TableCell className="text-right text-xs font-mono">
                        ${selectedInvoice?.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono font-bold text-foreground">
                        ${selectedInvoice?.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Subtotal & Signature details */}
              <div className="flex justify-between items-end gap-8 pt-4">
                {/* Signature URL if present */}
                <div className="border border-dashed p-4 rounded-lg bg-muted/10 w-[240px] text-center min-h-[90px] flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Client Sign-off</span>
                  {selectedInvoice?.client_signature_url ? (
                    <img src={selectedInvoice.client_signature_url} alt="Signature" className="h-10 object-contain mx-auto my-1 bg-white" />
                  ) : (
                    <span className="text-xs text-muted-foreground italic my-auto">Pending Signature</span>
                  )}
                  <span className="text-[9px] text-muted-foreground mt-1">Authorized Customer Signature</span>
                </div>

                <div className="text-right space-y-1.5 w-[200px]">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal:</span>
                    <span className="font-mono">${selectedInvoice?.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax (0%):</span>
                    <span className="font-mono">$0.00</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-foreground border-t pt-2">
                    <span>Total Due:</span>
                    <span className="font-mono text-primary">${selectedInvoice?.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="print:hidden">
              <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>Close</Button>
              <Button onClick={() => window.print()} className="gap-1.5"><Printer className="h-4 w-4" /> Print PDF</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Signature Capture Modal */}
        <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5 text-primary" />
                Collect Client Sign-off
              </DialogTitle>
              <CardDescription>Draw signature on the touchscreen board below.</CardDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-3 flex flex-col items-center">
              <canvas
                ref={signatureCanvasRef}
                width={400}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="border-2 border-dashed border-border/80 bg-white rounded-lg cursor-crosshair touch-none"
              />
              <div className="flex justify-between w-full">
                <Button variant="ghost" size="xs" onClick={clearSignature} className="text-xs text-muted-foreground hover:bg-muted p-1">
                  Clear Board
                </Button>
                <span className="text-[10px] text-muted-foreground my-auto">Use mouse or finger drawing</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSignatureDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveSignature} disabled={updateSignatureMutation.isPending}>
                {updateSignatureMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Signature
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Record Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Record Invoice Payment
              </DialogTitle>
              <CardDescription>Log a manual payment (Cash, Check, Bank, or Offline Card) to mark this invoice paid.</CardDescription>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Payment Amount ($) *</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Payment Method</label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="bank">Bank Transfer (ACH)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Reference Notes</label>
                <Input
                  placeholder="e.g. Check #1042, cash received in office"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => recordPaymentMutation.mutate()} disabled={recordPaymentMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {recordPaymentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </>
  );

  if (projectId) {
    return pageContent;
  }

  return (
    <>
      <SEO
        title="Billing & Invoicing"
        description="Quote builders, pricebook registries, QuickBooks export templates, and client sign-off ledger."
        path="/invoices"
        noIndex
      />
      <DashboardLayout
        activeTab="invoices"
        companyName={company?.name || ""}
        companyPrefix={company?.prefix || ""}
        companyId={company?.id || ""}
      >
        {pageContent}
      </DashboardLayout>
    </>
  );
}
