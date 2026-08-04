import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import SEO from "@/components/SEO";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTablePagination } from "@/hooks/useTablePagination";
import TablePaginationBar from "@/components/TablePaginationBar";
import { PaginatedTableFull } from "@/components/PaginatedTable";
import FilterChipBar, { FilterChip } from "@/components/FilterChipBar";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  TrendingUp,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  DollarSign,
  PenTool,
  Search,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface ChangeOrder {
  id: string;
  project_id: string;
  cost_impact: number;
  title: string;
  description: string | null;
  status: string;
  signature_url: string | null;
  created_at: string;
  project?: Project;
}

export default function ChangeOrdersPage() {
  const { user, company, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Dialog States
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);

  // Form States
  const [coProject, setCoProject] = useState("");
  const [coTitle, setCoTitle] = useState("");
  const [coCost, setCoCost] = useState("");
  const [coDesc, setCoDesc] = useState("");

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [coStatusFilter, setCoStatusFilter] = useState("ALL");

  // Signature States
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // 1. Fetch Projects
  const { data: projects = [] } = useQuery({
    queryKey: ["co_projects", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("company_id", company.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!company?.id,
  });

  // 2. Fetch Change Orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["change_orders", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("change_orders")
        .select(`
          *,
          project:projects(id, name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((o: any) => ({
        ...o,
        project: o.project ? { id: o.project.id, name: o.project.name } : undefined,
      })) as ChangeOrder[];
    },
    enabled: !!company?.id,
  });

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!coProject) throw new Error("Project selection is required");
      if (!coTitle.trim()) throw new Error("Change order title is required");

      const payload = {
        project_id: coProject,
        title: coTitle.trim(),
        cost_impact: parseFloat(coCost) || 0.00,
        description: coDesc.trim() || null,
        status: "Pending",
      };

      const { error } = await supabase.from("change_orders").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change_orders", company?.id] });
      toast({
        title: "Request registered",
        description: "Field change order request successfully logged.",
      });
      closeOrderDialog();
    },
    onError: (err: any) => {
      toast({
        title: "Error saving change order",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const rejectOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("change_orders")
        .update({ status: "Rejected" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change_orders", company?.id] });
      toast({
        title: "Order Rejected",
        description: "The change order has been rejected.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error updating order",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const approveOrderWithSignatureMutation = useMutation({
    mutationFn: async ({ id, sigUrl }: { id: string; sigUrl: string }) => {
      const { error } = await supabase
        .from("change_orders")
        .update({
          status: "Approved",
          signature_url: sigUrl,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change_orders", company?.id] });
      toast({
        title: "Order Approved",
        description: "The change order has been signed off and approved.",
      });
      setSignatureDialogOpen(false);
    },
    onError: (err: any) => {
      toast({
        title: "Error approving order",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("change_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change_orders", company?.id] });
      setSelectedOrderId(null);
      toast({ title: "Order deleted", description: "Change order deleted successfully." });
    },
    onError: (err: any) => {
      toast({
        title: "Error deleting change order",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Helpers
  const openOrderDialog = () => {
    setCoProject(projects.length > 0 ? projects[0].id : "");
    setCoTitle("");
    setCoCost("0");
    setCoDesc("");
    setOrderDialogOpen(true);
  };

  const closeOrderDialog = () => {
    setOrderDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
      case "Rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-200 gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      case "Pending":
      default:
        return <Badge variant="outline" className="bg-amber-500/5 text-amber-500 border-amber-200 gap-1"><Clock className="h-3 w-3 animate-pulse" /> Pending</Badge>;
    }
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
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
    const canvas = sigCanvasRef.current;
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
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas || !selectedOrderId) return;
    
    const sigDataUrl = canvas.toDataURL();
    approveOrderWithSignatureMutation.mutate({
      id: selectedOrderId,
      sigUrl: sigDataUrl,
    });
  };

  useEffect(() => {
    if (signatureDialogOpen && sigCanvasRef.current) {
      const canvas = sigCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
      }
    }
  }, [signatureDialogOpen]);

  // Calculations
  const approvedTotal = orders
    .filter((o) => o.status === "Approved")
    .reduce((sum, o) => sum + Number(o.cost_impact), 0);

  const pendingTotal = orders
    .filter((o) => o.status === "Pending")
    .reduce((sum, o) => sum + Number(o.cost_impact), 0);

  const approvedCount = orders.filter((o) => o.status === "Approved").length;

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  if (ordersLoading) {
    return (
      <DashboardLayout activeTab="change-orders" companyName={company?.name || ""} companyPrefix={company?.prefix || ""} companyId={company?.id || ""}>
        <div className="flex justify-center items-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEO
        title="Change Orders Hub"
        description="Verify change requests, authorize cost impacts, and record digital signatures."
        path="/change-orders"
        noIndex
      />
      <DashboardLayout
        activeTab="change-orders"
        companyName={company?.name || ""}
        companyPrefix={company?.prefix || ""}
        companyId={company?.id || ""}
      >
        <div className="p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Project Change Orders
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Authorize contract cost impacts, examine field modification requests, and collect digital verification signatures.
              </p>
            </div>
            <Button onClick={openOrderDialog} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Request Change Order
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="border-border/50 card-shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg text-green-600">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Approved Cost Changes</div>
                  <div className="text-2xl font-extrabold text-foreground mt-0.5">
                    +${approvedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 card-shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg text-amber-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Pending Requests Value</div>
                  <div className="text-2xl font-extrabold text-foreground mt-0.5">
                    +${pendingTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 card-shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Approved Modification Orders</div>
                  <div className="text-2xl font-extrabold text-foreground mt-0.5">
                    {approvedCount} Orders
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Change Orders Directory */}
            <Card className="lg:col-span-2 border-border/50 card-shadow-md">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-lg font-bold">Change Order Registry</CardTitle>
                  <FilterChipBar
                    hasActiveFilters={coStatusFilter !== "ALL"}
                    onClearAll={() => setCoStatusFilter("ALL")}
                  >
                    <FilterChip
                      label="All Statuses"
                      selectedValue={coStatusFilter}
                      options={[
                        { label: "Pending", value: "Pending" },
                        { label: "Approved", value: "Approved" },
                        { label: "Rejected", value: "Rejected" },
                      ]}
                      onSelect={setCoStatusFilter}
                      onClear={() => setCoStatusFilter("ALL")}
                    />
                  </FilterChipBar>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, project, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <PaginatedTableFull
                  data={orders.filter((o) => {
                    const q = searchQuery.toLowerCase();
                    const matchesSearch = !q ||
                      o.title.toLowerCase().includes(q) ||
                      o.description.toLowerCase().includes(q) ||
                      (o.project?.name || "").toLowerCase().includes(q);
                    const matchesStatus = coStatusFilter === "ALL" || o.status === coStatusFilter;
                    return matchesSearch && matchesStatus;
                  })}
                  renderTable={(paginatedOrders) => (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order Title</TableHead>
                          <TableHead>Project Location</TableHead>
                          <TableHead>Cost Impact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                              No change orders registered.
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedOrders.map((order) => (
                            <TableRow
                              key={order.id}
                              className={`cursor-pointer transition-colors ${
                                selectedOrderId === order.id ? "bg-muted/65" : "hover:bg-muted/30"
                              }`}
                              onClick={() => setSelectedOrderId(order.id)}
                            >
                              <TableCell className="font-semibold text-foreground">{order.title}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{order.project?.name}</TableCell>
                              <TableCell className="font-bold text-primary font-mono text-xs">
                                +${order.cost_impact.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell>{getStatusBadge(order.status)}</TableCell>
                              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm("Delete this change order request?")) {
                                      deleteOrderMutation.mutate(order.id);
                                    }
                                  }}
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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

            {/* Change Order details & Actions */}
            <div className="space-y-6">
              {!selectedOrderId ? (
                <Card className="border-border/50 card-shadow-md">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                    <TrendingUp className="h-10 w-10 text-muted-foreground/40 mb-2" />
                    <p className="text-xs">Select a Change Order request to view detailed descriptions, signed approvals, or execute status transitions.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50 card-shadow-md">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-bold">{selectedOrder?.title}</CardTitle>
                        <CardDescription className="text-xs mt-1 font-semibold flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" /> Project: {selectedOrder?.project?.name}
                        </CardDescription>
                      </div>
                      {selectedOrder && getStatusBadge(selectedOrder.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4 text-sm">
                    <div className="flex justify-between items-center bg-muted/15 border border-border/40 p-3 rounded-lg">
                      <span className="text-xs text-muted-foreground font-semibold">Cost Impact:</span>
                      <span className="text-lg font-black text-primary font-mono">
                        +${selectedOrder?.cost_impact.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {selectedOrder?.description && (
                      <div className="space-y-1.5">
                        <div className="text-xs font-bold text-muted-foreground uppercase">Description / Purpose:</div>
                        <p className="text-xs bg-muted/30 p-2 border rounded leading-relaxed text-foreground">
                          {selectedOrder.description}
                        </p>
                      </div>
                    )}

                    {/* Authorized signature */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="text-xs font-bold text-muted-foreground uppercase">Authorization Sign-off:</div>
                      {selectedOrder?.signature_url ? (
                        <div className="border border-dashed p-3 rounded bg-muted/10 text-center">
                          <img src={selectedOrder.signature_url} alt="Admin Sign-off" className="h-12 object-contain mx-auto bg-white" />
                          <span className="text-[9px] text-muted-foreground mt-1 block">Admin Digital Approval Signature</span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Signature Pending Approval</p>
                      )}
                    </div>

                    {/* Action buttons if Pending */}
                    {selectedOrder?.status === "Pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => rejectOrderMutation.mutate(selectedOrder.id)}
                          className="flex-1 text-destructive hover:bg-destructive/10"
                        >
                          Reject
                        </Button>
                        <Button
                          onClick={() => setSignatureDialogOpen(true)}
                          className="flex-1 gap-1"
                        >
                          <PenTool className="h-4 w-4" /> Sign & Approve
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Change Order Creation Dialog */}
        <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Request Change Order
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Change Scope Title *</label>
                <Input
                  placeholder="e.g. Concrete slab height expansion"
                  value={coTitle}
                  onChange={(e) => setCoTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Linked Project *</label>
                  <Select value={coProject} onValueChange={setCoProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Cost Impact ($) *</label>
                  <Input
                    type="number"
                    placeholder="2500"
                    value={coCost}
                    onChange={(e) => setCoCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Detailed Description / Rationale</label>
                <Textarea
                  placeholder="Outline the cause of deviation, material requirements, or client instructions..."
                  value={coDesc}
                  onChange={(e) => setCoDesc(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeOrderDialog}>
                Cancel
              </Button>
              <Button onClick={() => createOrderMutation.mutate()} disabled={createOrderMutation.isPending}>
                {createOrderMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Order Signature approval Dialog */}
        <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5 text-primary" />
                Authorize Change Order
              </DialogTitle>
              <CardDescription>Draw signature on the touchscreen board below to approve.</CardDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-3 flex flex-col items-center">
              <canvas
                ref={sigCanvasRef}
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
              <Button onClick={saveSignature} disabled={approveOrderWithSignatureMutation.isPending}>
                {approveOrderWithSignatureMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Authorize & Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}
