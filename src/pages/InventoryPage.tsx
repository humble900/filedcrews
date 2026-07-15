import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Plus,
  Warehouse,
  FileSpreadsheet,
  AlertTriangle,
  Loader2,
  Trash2,
  CheckCircle,
  Truck,
  Inbox,
  TrendingUp,
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

export default function InventoryPage() {
  const { company } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeSubTab, setActiveSubTab] = useState<"catalog" | "warehouses" | "pos">("catalog");

  // Dialog & Form states
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [whName, setWhName] = useState("");
  const [whLoc, setWhLoc] = useState("");

  const [partDialogOpen, setPartDialogOpen] = useState(false);
  const [partNum, setPartNum] = useState("");
  const [partName, setPartName] = useState("");
  const [partDesc, setPartDesc] = useState("");
  const [partCost, setPartCost] = useState("0");
  const [partStock, setPartStock] = useState("0");
  const [partMinStock, setPartMinStock] = useState("0");
  const [partWarehouseId, setPartWarehouseId] = useState("NONE");

  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [poVendor, setPoVendor] = useState("");
  const [poNum, setPoNum] = useState(`PO-${Date.now().toString().slice(-6)}`);
  const [poLines, setPoLines] = useState<{ itemName: string; qty: number; cost: number }[]>([
    { itemName: "", qty: 1, cost: 0 },
  ]);

  // Queries
  const { data: warehouses = [], isLoading: loadingWH } = useQuery({
    queryKey: ["warehouses", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .eq("company_id", company.id)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  const { data: inventory = [], isLoading: loadingInv } = useQuery({
    queryKey: ["inventory_items", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*, warehouse:warehouses(name)")
        .eq("company_id", company.id)
        .order("part_number");
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  const { data: purchaseOrders = [], isLoading: loadingPOs } = useQuery({
    queryKey: ["purchase_orders", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, items:purchase_order_items(*)")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  // Mutations
  const addWarehouseMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) return;
      const { error } = await supabase.from("warehouses").insert({
        company_id: company.id,
        name: whName.trim(),
        location: whLoc.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses", company?.id] });
      setWarehouseDialogOpen(false);
      setWhName("");
      setWhLoc("");
      toast({ title: "Warehouse added", description: "Successfully created storage warehouse." });
    },
    onError: (err: any) => {
      toast({ title: "Error adding warehouse", description: err.message, variant: "destructive" });
    },
  });

  const addPartMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) return;
      const { error } = await supabase.from("inventory_items").insert({
        company_id: company.id,
        part_number: partNum.trim(),
        name: partName.trim(),
        description: partDesc.trim() || null,
        unit_cost: parseFloat(partCost) || 0,
        current_stock: parseInt(partStock) || 0,
        minimum_stock: parseInt(partMinStock) || 0,
        warehouse_id: partWarehouseId === "NONE" ? null : partWarehouseId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_items", company?.id] });
      setPartDialogOpen(false);
      setPartNum("");
      setPartName("");
      setPartDesc("");
      setPartCost("0");
      setPartStock("0");
      setPartMinStock("0");
      setPartWarehouseId("NONE");
      toast({ title: "Part added", description: "Added to catalog." });
    },
    onError: (err: any) => {
      toast({ title: "Error adding part", description: err.message, variant: "destructive" });
    },
  });

  const createPoMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) return;
      const totalAmount = poLines.reduce((acc, line) => acc + line.qty * line.cost, 0);
      const { data: po, error: poErr } = await supabase
        .from("purchase_orders")
        .insert({
          company_id: company.id,
          po_number: poNum.trim(),
          vendor_name: poVendor.trim(),
          total_amount: totalAmount,
          status: "Draft",
        })
        .select()
        .single();

      if (poErr) throw poErr;

      const itemsPayload = poLines.map((line) => ({
        po_id: po.id,
        item_name: line.itemName.trim(),
        quantity: line.qty,
        unit_cost: line.cost,
      }));

      const { error: itemsErr } = await supabase.from("purchase_order_items").insert(itemsPayload);
      if (itemsErr) throw itemsErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders", company?.id] });
      setPoDialogOpen(false);
      setPoVendor("");
      setPoNum(`PO-${Date.now().toString().slice(-6)}`);
      setPoLines([{ itemName: "", qty: 1, cost: 0 }]);
      toast({ title: "PO Created", description: "Draft purchase order added." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to create PO", description: err.message, variant: "destructive" });
    },
  });

  const updatePoStatusMutation = useMutation({
    mutationFn: async ({ poId, status }: { poId: string; status: string }) => {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status })
        .eq("id", poId);
      if (error) throw error;

      // Business logic: if marked "Received", add items directly to inventory stock!
      if (status === "Received") {
        const po = purchaseOrders.find((p) => p.id === poId);
        if (po && Array.isArray(po.items)) {
          for (const item of po.items) {
            // Find existing matching part name to increment, or fallback
            const existingItem = inventory.find(
              (i) => i.name.toLowerCase() === item.item_name.toLowerCase()
            );
            if (existingItem) {
              const newStock = existingItem.current_stock + item.quantity;
              await supabase
                .from("inventory_items")
                .update({ current_stock: newStock })
                .eq("id", existingItem.id);
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders", company?.id] });
      queryClient.invalidateQueries({ queryKey: ["inventory_items", company?.id] });
      toast({ title: "PO Updated", description: "Purchase order status updated successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update PO status", description: err.message, variant: "destructive" });
    },
  });

  // Delete helpers
  const deletePartMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_items", company?.id] });
      toast({ title: "Part deleted", description: "Successfully removed from catalog." });
    },
    onError: (err: any) => {
      toast({ title: "Error deleting part", description: err.message, variant: "destructive" });
    },
  });

  // Stats
  const totalPartsInStock = inventory.reduce((acc, item) => acc + item.current_stock, 0);
  const lowStockParts = inventory.filter((item) => item.current_stock <= item.minimum_stock).length;
  const draftPOs = purchaseOrders.filter((po) => po.status === "Draft").length;
  const sentPOs = purchaseOrders.filter((po) => po.status === "Sent").length;

  return (
    <>
      <SEO title="Inventory & Parts catalog" />
      <DashboardLayout
        activeTab="inventory"
        companyId={company?.id || ""}
        companyName={company?.name || ""}
        companyPrefix={company?.prefix || ""}
      >
        <div className="p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                Parts & Inventory Management
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Manage service components stock, physical warehouses, and wholesale vendor Purchase Orders.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setWarehouseDialogOpen(true)}
                variant="outline"
                className="text-xs gap-1.5"
              >
                <Warehouse className="h-4 w-4" />
                Create Warehouse
              </Button>
              <Button
                size="sm"
                onClick={() => setPartDialogOpen(true)}
                className="text-xs gap-1.5 bg-primary text-white hover:bg-primary/95 font-bold"
              >
                <Plus className="h-4 w-4" />
                Log Inventory Part
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border/40 bg-card/45 backdrop-blur-sm">
              <CardContent className="p-4 space-y-2">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Parts Logged</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black">{totalPartsInStock}</span>
                  <Package className="h-5 w-5 text-primary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/45 backdrop-blur-sm">
              <CardContent className="p-4 space-y-2">
                <p className="text-[10px] uppercase font-bold text-amber-500">Low Stock Warnings</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-amber-400">{lowStockParts}</span>
                  <AlertTriangle className="h-5 w-5 text-amber-500/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/45 backdrop-blur-sm">
              <CardContent className="p-4 space-y-2">
                <p className="text-[10px] uppercase font-bold text-indigo-500">Draft POs</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-indigo-400">{draftPOs}</span>
                  <FileSpreadsheet className="h-5 w-5 text-indigo-500/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/45 backdrop-blur-sm">
              <CardContent className="p-4 space-y-2">
                <p className="text-[10px] uppercase font-bold text-emerald-500">Sent Orders</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-emerald-400">{sentPOs}</span>
                  <Truck className="h-5 w-5 text-emerald-500/60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sub-tabs Links */}
          <div className="flex gap-2 border-b border-border/20 pb-2">
            <Button
              variant={activeSubTab === "catalog" ? "default" : "outline"}
              onClick={() => setActiveSubTab("catalog")}
              size="sm"
              className="text-xs font-bold"
            >
              Inventory Catalog
            </Button>
            <Button
              variant={activeSubTab === "warehouses" ? "default" : "outline"}
              onClick={() => setActiveSubTab("warehouses")}
              size="sm"
              className="text-xs font-bold"
            >
              Warehouses
            </Button>
            <Button
              variant={activeSubTab === "pos" ? "default" : "outline"}
              onClick={() => setActiveSubTab("pos")}
              size="sm"
              className="text-xs font-bold"
            >
              Purchase Orders
            </Button>
          </div>

          {/* Catalog Tab */}
          {activeSubTab === "catalog" && (
            <Card className="border-border/40">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Package className="h-4.5 w-4.5 text-primary" />
                    Parts Catalog
                  </CardTitle>
                  <CardDescription className="text-xs">
                    List of physical gear and replacement components inside company depots.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part No.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Depot/Warehouse</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Min. Level</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingInv ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : inventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground italic">
                          No inventory items registered. Add your first part!
                        </TableCell>
                      </TableRow>
                    ) : (
                      inventory.map((item: any) => {
                        const isLowStock = item.current_stock <= item.minimum_stock;
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-xs font-bold">{item.part_number}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-xs text-foreground">{item.name}</span>
                                {item.description && <span className="text-[10px] text-muted-foreground">{item.description}</span>}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {item.warehouse?.name || "Main Office depot"}
                            </TableCell>
                            <TableCell className="text-xs font-bold">${item.unit_cost}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-black ${isLowStock ? "text-amber-500" : "text-foreground"}`}>
                                  {item.current_stock}
                                </span>
                                {isLowStock && (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[9px] py-0 px-1 font-bold uppercase">
                                    Low
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">{item.minimum_stock}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm(`Delete part "${item.name}"?`)) {
                                    deletePartMutation.mutate(item.id);
                                  }
                                }}
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Warehouses Tab */}
          {activeSubTab === "warehouses" && (
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="text-base font-bold">Storage Warehouses</CardTitle>
                <CardDescription className="text-xs">Physical facilities or trucks holding stock.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Warehouse Name</TableHead>
                      <TableHead>Address / Location</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingWH ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : warehouses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground italic">
                          No warehouses registered yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      warehouses.map((wh: any) => (
                        <TableRow key={wh.id}>
                          <TableCell className="font-bold text-xs">{wh.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{wh.location || "N/A"}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">
                            {format(new Date(wh.created_at), "MMM dd, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Purchase Orders Tab */}
          {activeSubTab === "pos" && (
            <Card className="border-border/40">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Purchase Orders (POs)</CardTitle>
                  <CardDescription className="text-xs">Procure material and parts from vendors.</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setPoDialogOpen(true)}
                  className="h-8 gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Generate PO
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPOs ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : purchaseOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground italic">
                          No purchase orders recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      purchaseOrders.map((po: any) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-mono text-xs font-bold text-indigo-400">{po.po_number}</TableCell>
                          <TableCell className="text-xs font-semibold">{po.vendor_name}</TableCell>
                          <TableCell className="text-xs font-bold">${po.total_amount}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                po.status === "Received"
                                  ? "default"
                                  : po.status === "Sent"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-[10px] py-0 px-1 h-5 capitalize"
                            >
                              {po.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">
                            {format(new Date(po.created_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right flex items-center justify-end gap-1.5">
                            {po.status === "Draft" && (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => updatePoStatusMutation.mutate({ poId: po.id, status: "Sent" })}
                                className="h-7 text-[10px] font-bold"
                              >
                                Mark Sent
                              </Button>
                            )}
                            {po.status === "Sent" && (
                              <Button
                                size="xs"
                                onClick={() => updatePoStatusMutation.mutate({ poId: po.id, status: "Received" })}
                                className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              >
                                Mark Received
                              </Button>
                            )}
                            {po.status === "Received" && (
                              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Inventory Updated
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ─── Add Warehouse Dialog ─── */}
        <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-primary" />
                Create Storage Warehouse
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Warehouse Name *</label>
                <Input
                  placeholder="e.g. Dallas Main Depot, Truck #4"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Depot Location / Note</label>
                <Input
                  placeholder="e.g. Warehouse Lane Sector A"
                  value={whLoc}
                  onChange={(e) => setWhLoc(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWarehouseDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => addWarehouseMutation.mutate()}
                disabled={addWarehouseMutation.isPending || !whName.trim()}
                className="bg-primary text-white hover:bg-primary/95 font-bold"
              >
                {addWarehouseMutation.isPending ? "Creating…" : "Save Depot"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Add Part Dialog ─── */}
        <Dialog open={partDialogOpen} onOpenChange={setPartDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Log Part Catalog Item
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Part Number *</label>
                  <Input
                    placeholder="e.g. BRASS-VALVE-12"
                    value={partNum}
                    onChange={(e) => setPartNum(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Part Name *</label>
                  <Input
                    placeholder="e.g. 1/2-Inch Brass Ball Valve"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Description</label>
                <Input
                  placeholder="e.g. Lead-free plumbing compression valve"
                  value={partDesc}
                  onChange={(e) => setPartDesc(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Unit Cost ($)</label>
                  <Input
                    type="number"
                    value={partCost}
                    onChange={(e) => setPartCost(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Current Stock</label>
                  <Input
                    type="number"
                    value={partStock}
                    onChange={(e) => setPartStock(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Min Stock Alarm</label>
                  <Input
                    type="number"
                    value={partMinStock}
                    onChange={(e) => setPartMinStock(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Storage Warehouse Depot</label>
                <Select value={partWarehouseId} onValueChange={setPartWarehouseId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select Warehouse Depot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Main Office depot</SelectItem>
                    {warehouses.map((wh: any) => (
                      <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPartDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => addPartMutation.mutate()}
                disabled={addPartMutation.isPending || !partNum.trim() || !partName.trim()}
                className="bg-primary text-white hover:bg-primary/95 font-bold"
              >
                {addPartMutation.isPending ? "Adding…" : "Add Part to Stock"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Create PO Dialog ─── */}
        <Dialog open={poDialogOpen} onOpenChange={setPoDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Generate Wholesale Purchase Order
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">PO Number</label>
                  <Input value={poNum} readOnly className="bg-muted/40 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Vendor Name *</label>
                  <Input
                    placeholder="e.g. Ferguson HVAC Supply"
                    value={poVendor}
                    onChange={(e) => setPoVendor(e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Line items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Order Line Items</span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setPoLines([...poLines, { itemName: "", qty: 1, cost: 0 }])}
                    className="h-auto p-0 text-xs text-primary"
                  >
                    + Add Line
                  </Button>
                </div>

                <div className="space-y-3">
                  {poLines.map((line, idx) => (
                    <div key={idx} className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] text-muted-foreground">Item Name *</label>
                        <Input
                          placeholder="e.g. Brass Ball Valve"
                          value={line.itemName}
                          onChange={(e) => {
                            const newLines = [...poLines];
                            newLines[idx].itemName = e.target.value;
                            setPoLines(newLines);
                          }}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="w-16 space-y-1">
                        <label className="text-[9px] text-muted-foreground">Qty</label>
                        <Input
                          type="number"
                          value={line.qty}
                          onChange={(e) => {
                            const newLines = [...poLines];
                            newLines[idx].qty = parseInt(e.target.value) || 0;
                            setPoLines(newLines);
                          }}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="w-20 space-y-1">
                        <label className="text-[9px] text-muted-foreground">Cost ($)</label>
                        <Input
                          type="number"
                          value={line.cost}
                          onChange={(e) => {
                            const newLines = [...poLines];
                            newLines[idx].cost = parseFloat(e.target.value) || 0;
                            setPoLines(newLines);
                          }}
                          className="h-9 text-xs"
                        />
                      </div>
                      {poLines.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPoLines(poLines.filter((_, i) => i !== idx))}
                          className="h-9 w-9 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPoDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createPoMutation.mutate()}
                disabled={createPoMutation.isPending || !poVendor.trim() || poLines.some((l) => !l.itemName.trim())}
                className="bg-primary text-white hover:bg-primary/95 font-bold animate-pulse"
              >
                {createPoMutation.isPending ? "Generating…" : "Generate PO"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}
