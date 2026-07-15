import { useState, useEffect, useRef } from "react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  Plus,
  Building2,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Wrench,
  Calendar,
  History,
  Edit2,
  UserCheck,
  DollarSign,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useTablePagination } from "@/hooks/useTablePagination";
import TablePaginationBar from "@/components/TablePaginationBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LeadsPipeline from "@/components/LeadsPipeline";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  created_at: string;
}

interface ServiceEntry {
  date: string;
  notes: string;
  field_crew: string;
}

interface Asset {
  id: string;
  customer_id: string;
  name: string;
  serial_number: string | null;
  install_date: string | null;
  service_history: ServiceEntry[];
  created_at: string;
  make: string | null;
  model: string | null;
  warranty_expiry: string | null;
  equipment_type: string | null;
}

export default function CRMPage({ projectId }: { projectId?: string }) {
  const { user, company, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Dialog states
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");

  const [apiKey, setApiKey] = useState<string>("");
  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("get-maps-key");
        if (data?.key) {
          setApiKey(data.key);
        } else {
          setApiKey("AIzaSyC9uIJFFtEeqXJDCQdz-m346o3B7X7cZNw");
        }
      } catch (e) {
        setApiKey("AIzaSyC9uIJFFtEeqXJDCQdz-m346o3B7X7cZNw");
      }
    })();
  }, []);

  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [assetSerial, setAssetSerial] = useState("");
  const [assetInstallDate, setAssetInstallDate] = useState("");
  const [assetMake, setAssetMake] = useState("");
  const [assetModel, setAssetModel] = useState("");
  const [assetWarranty, setAssetWarranty] = useState("");
  const [assetType, setAssetType] = useState("");
  const [assetLocationId, setAssetLocationId] = useState("NONE");
  
  // Location states
  const [locDialogOpen, setLocDialogOpen] = useState(false);
  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [newLogNotes, setNewLogNotes] = useState("");
  const [newLogTech, setNewLogTech] = useState("");

  // 1. Fetch Customers
  const { data: customers = [], isLoading: custLoading } = useQuery({
    queryKey: ["customers", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("company_id", company.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!company?.id,
  });

  // 2. Fetch Assets for selected customer (with location name join)
  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ["assets", selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return [];
      const { data, error } = await supabase
        .from("assets")
        .select("*, location:locations(name)")
        .eq("customer_id", selectedCustomerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Map JSON service_history
      return (data || []).map((asset: any) => ({
        ...asset,
        service_history: Array.isArray(asset.service_history)
          ? (asset.service_history as ServiceEntry[])
          : [],
      })) as Asset[];
    },
    enabled: !!selectedCustomerId,
  });

  // Fetch Service Locations for selected customer
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ["locations", selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return [];
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("customer_id", selectedCustomerId)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCustomerId,
  });

  // Fetch invoices for the selected customer to calculate client balance & outstanding debts
  const { data: customerInvoices = [] } = useQuery({
    queryKey: ["customer_invoices", selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id,
          amount,
          status,
          payment_status,
          job:jobs!inner(
            id,
            project:projects!inner(
              id,
              customer_id
            )
          )
        `)
        .eq("job.project.customer_id", selectedCustomerId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCustomerId,
  });

  // 3. Customer Mutations
  const saveCustomerMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) throw new Error("No company linked");
      if (!custName.trim()) throw new Error("Name is required");

      const payload = {
        company_id: company.id,
        name: custName.trim(),
        email: custEmail.trim() || null,
        phone: custPhone.trim() || null,
        billing_address: custAddress.trim() || null,
      };

      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update(payload)
          .eq("id", editingCustomer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", company?.id] });
      toast({
        title: editingCustomer ? "Customer updated" : "Customer created",
        description: `Successfully saved ${custName}.`,
      });
      closeCustomerDialog();
    },
    onError: (err: any) => {
      toast({
        title: "Error saving customer",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", company?.id] });
      if (selectedCustomerId) setSelectedCustomerId(null);
      toast({
        title: "Customer deleted",
        description: "The customer has been successfully removed.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error deleting customer",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // 4. Asset Mutations
  const createAssetMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomerId) throw new Error("No customer selected");
      if (!assetName.trim()) throw new Error("Asset name is required");

      const payload = {
        customer_id: selectedCustomerId,
        name: assetName.trim(),
        serial_number: assetSerial.trim() || null,
        install_date: assetInstallDate || null,
        service_history: [],
        make: assetMake.trim() || null,
        model: assetModel.trim() || null,
        warranty_expiry: assetWarranty || null,
        equipment_type: assetType.trim() || null,
        location_id: assetLocationId === "NONE" ? null : assetLocationId,
      };

      const { error } = await supabase.from("assets").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", selectedCustomerId] });
      toast({
        title: "Asset added",
        description: `Successfully added ${assetName} to customer.`,
      });
      closeAssetDialog();
    },
    onError: (err: any) => {
      toast({
        title: "Error adding asset",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Location Mutations
  const addLocationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomerId) throw new Error("No customer active");
      if (!locName.trim() || !locAddress.trim()) throw new Error("Name and Address are required");

      const { error } = await supabase.from("locations").insert({
        company_id: company?.id,
        customer_id: selectedCustomerId,
        name: locName.trim(),
        address: locAddress.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", selectedCustomerId] });
      setLocDialogOpen(false);
      setLocName("");
      setLocAddress("");
      toast({
        title: "Location added",
        description: "Successfully added sub-location site.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to add location",
        description: err.message,
        variant: "destructive",
      });
    }
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (locId: string) => {
      const { error } = await supabase.from("locations").delete().eq("id", locId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", selectedCustomerId] });
      toast({
        title: "Location removed",
        description: "Site has been deleted.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to remove location",
        description: err.message,
        variant: "destructive",
      });
    }
  });

  const updateAssetHistoryMutation = useMutation({
    mutationFn: async ({ assetId, updatedHistory }: { assetId: string; updatedHistory: ServiceEntry[] }) => {
      const { error } = await supabase
        .from("assets")
        .update({ service_history: updatedHistory as any })
        .eq("id", assetId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assets", selectedCustomerId] });
      
      // Update selected asset in state
      if (selectedAsset && selectedAsset.id === variables.assetId) {
        setSelectedAsset({
          ...selectedAsset,
          service_history: variables.updatedHistory,
        });
      }
      
      toast({
        title: "Service history updated",
        description: "The new service event has been logged.",
      });
      setNewLogNotes("");
      setNewLogTech("");
    },
    onError: (err: any) => {
      toast({
        title: "Error logging service event",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", selectedCustomerId] });
      toast({
        title: "Asset removed",
        description: "The equipment asset has been deleted.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error deleting asset",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Helpers
  const openCustomerDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setCustName(customer.name);
      setCustEmail(customer.email || "");
      setCustPhone(customer.phone || "");
      setCustAddress(customer.billing_address || "");
    } else {
      setEditingCustomer(null);
      setCustName("");
      setCustEmail("");
      setCustPhone("");
      setCustAddress("");
    }
    setCustomerDialogOpen(true);
  };

  const closeCustomerDialog = () => {
    setCustomerDialogOpen(false);
    setEditingCustomer(null);
  };

  const openAssetDialog = () => {
    setAssetName("");
    setAssetSerial("");
    setAssetInstallDate(format(new Date(), "yyyy-MM-dd"));
    setAssetDialogOpen(true);
  };

  const closeAssetDialog = () => {
    setAssetDialogOpen(false);
    setAssetName("");
    setAssetSerial("");
    setAssetInstallDate("");
    setAssetMake("");
    setAssetModel("");
    setAssetWarranty("");
    setAssetType("");
    setAssetLocationId("NONE");
  };

  const logServiceEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    if (!newLogNotes.trim()) {
      toast({ title: "Validation error", description: "Service notes are required.", variant: "destructive" });
      return;
    }

    const newEntry: ServiceEntry = {
      date: format(new Date(), "yyyy-MM-dd HH:mm"),
      notes: newLogNotes.trim(),
      field_crew: newLogTech.trim() || "System Admin",
    };

    const updatedHistory = [...selectedAsset.service_history, newEntry];
    updateAssetHistoryMutation.mutate({
      assetId: selectedAsset.id,
      updatedHistory,
    });
  };

  // Filter customers by search
  const filteredCustomers = (authLoading || custLoading) ? [] : customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery)
  );

  const crmPagination = useTablePagination(filteredCustomers);

  if (authLoading || custLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Financial aggregates for the selected customer
  const validCustInvoices = customerInvoices.filter((inv: any) => inv.status !== "Draft" && inv.status !== "Void");
  const custTotalInvoiced = validCustInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const custTotalCollected = validCustInvoices.reduce((sum, inv) => {
    if (inv.payment_status === "Paid") return sum + Number(inv.amount || 0);
    if (inv.payment_status === "Partially Paid") return sum + (Number(inv.amount || 0) * 0.5);
    return sum;
  }, 0);
  const custDebt = custTotalInvoiced - custTotalCollected;

  const pageContent = (
    <>
      <div className="p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                CRM & Assets
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Maintain complete profiles of customers and keep record of site-installed equipment assets.
              </p>
            </div>
            <Button onClick={() => openCustomerDialog()} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Add Customer
            </Button>
          </div>

          <Tabs defaultValue="directory" className="w-full space-y-6">
            <TabsList className="bg-muted/40 p-1 border border-border/40 rounded-xl max-w-xs grid grid-cols-2">
              <TabsTrigger value="directory" className="rounded-lg text-xs font-semibold">Clients & Assets</TabsTrigger>
              <TabsTrigger value="leads" className="rounded-lg text-xs font-semibold">Leads Pipeline</TabsTrigger>
            </TabsList>

            <TabsContent value="directory" className="space-y-6 focus-visible:outline-none">
              <div className="grid gap-6 lg:grid-cols-3">
            {/* Customer Table List */}
            <Card className="lg:col-span-2 border-border/50 card-shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Client Directory
                </CardTitle>
                <CardDescription>
                  List of registered customer companies and contact information.
                </CardDescription>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="table-container">
                <div className="scrollbar-hidden overflow-x-auto max-h-[55vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Billing Address</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {crmPagination.paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                            {searchQuery ? "No matching clients found." : "No clients registered yet."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        crmPagination.paginatedData.map((cust) => (
                          <TableRow
                            key={cust.id}
                            className={`cursor-pointer transition-colors ${
                              selectedCustomerId === cust.id ? "bg-muted/65" : "hover:bg-muted/30"
                            }`}
                            onClick={() => setSelectedCustomerId(cust.id)}
                          >
                            <TableCell className="font-semibold text-foreground">{cust.name}</TableCell>
                            <TableCell className="text-muted-foreground max-w-[150px] truncate">
                              {cust.email || "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{cust.phone || "—"}</TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate">
                              {cust.billing_address || "—"}
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openCustomerDialog(cust)}
                                  title="Edit customer info"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm(`Delete customer "${cust.name}" and all their associated assets?`)) {
                                      deleteCustomerMutation.mutate(cust.id);
                                    }
                                  }}
                                  className="text-destructive hover:bg-destructive/10"
                                  title="Delete customer"
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
                </div>
                <TablePaginationBar
                  totalItems={crmPagination.totalItems}
                  startIndex={crmPagination.startIndex}
                  endIndex={crmPagination.endIndex}
                  pageSize={crmPagination.pageSize}
                  canPrev={crmPagination.canPrev}
                  canNext={crmPagination.canNext}
                  onPrev={crmPagination.goPrev}
                  onNext={crmPagination.goNext}
                  onPageSizeChange={crmPagination.setPageSize}
                />
                </div>
              </CardContent>
            </Card>

             {/* Right details column */}
            <div className="space-y-6 lg:col-span-1">
              {selectedCustomerId && selectedCustomer && (
                <Card className="border-border/50 card-shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Financial Summary
                    </CardTitle>
                    <CardDescription>
                      Billing collections status for client.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {custTotalInvoiced > 0 ? (
                      <div className="h-[140px] w-full flex items-center justify-center relative my-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="72%"
                            outerRadius="100%"
                            barSize={8}
                            data={[{ name: "Collected", value: custTotalInvoiced > 0 ? (custTotalCollected / custTotalInvoiced) * 100 : 0, fill: "#10b981" }]}
                            startAngle={90}
                            endAngle={-270}
                          >
                            <PolarAngleAxis
                              type="number"
                              domain={[0, 100]}
                              angleAxisId={0}
                              tick={false}
                            />
                            <RadialBar
                              background={{ fill: "hsl(var(--muted)/0.3)" }}
                              dataKey="value"
                              cornerRadius={6}
                            />
                          </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-black text-foreground tracking-tight">
                            {Math.round(custTotalInvoiced > 0 ? (custTotalCollected / custTotalInvoiced) * 100 : 0)}%
                          </span>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                            Collected
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        No active invoice history.
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="bg-muted/30 rounded-lg p-2">
                        <p className="text-[9px] uppercase font-bold text-muted-foreground">Invoiced</p>
                        <p className="font-extrabold text-foreground mt-0.5">
                          ${custTotalInvoiced.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-emerald-500/5 rounded-lg p-2">
                        <p className="text-[9px] uppercase font-bold text-emerald-600">Collected</p>
                        <p className="font-extrabold text-emerald-600 mt-0.5">
                          ${custTotalCollected.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card text-xs">
                      <div>
                        <span className="font-bold text-muted-foreground block text-[9px] uppercase">Outstanding Debt</span>
                        <span className={`text-base font-black ${custDebt > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          ${custDebt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        {custDebt > 0 ? (
                          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 gap-1">
                            <AlertTriangle className="h-3 w-3" /> Balance Due
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                            <CheckCircle className="h-3 w-3" /> Settled
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Grid wrapping Equipment Assets and Service Locations */}
              <div className="grid grid-cols-1 gap-4">
                {/* Asset Management Panel */}
                <Card className="border-border/50 card-shadow-md">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Wrench className="h-4.5 w-4.5 text-primary" />
                        Equipment Assets
                      </CardTitle>
                      <CardDescription className="text-[10px]">
                        {selectedCustomer ? `Installed gear for ${selectedCustomer.name}` : "Select a client."}
                      </CardDescription>
                    </div>
                    {selectedCustomer && (
                      <Button variant="outline" size="xs" onClick={openAssetDialog} className="gap-1 text-[11px] h-7">
                        <Plus className="h-3 w-3" /> Add
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!selectedCustomerId ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                        <Wrench className="h-8 w-8 text-muted-foreground/45 mb-2" />
                        <p className="text-xs">Click a customer to manage gear.</p>
                      </div>
                    ) : assetsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : assets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                        <Plus className="h-6 w-6 text-muted-foreground/40 mb-1 cursor-pointer" onClick={openAssetDialog} />
                        <p className="text-xs font-medium">No assets logged</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {assets.map((asset) => (
                          <Card key={asset.id} className="bg-muted/20 border-border/40 relative group overflow-hidden">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5 flex-wrap">
                                    {asset.name}
                                    {asset.equipment_type && (
                                      <Badge variant="secondary" className="text-[9px] py-0 px-1 capitalize">
                                        {asset.equipment_type}
                                      </Badge>
                                    )}
                                    {(asset as any).location?.name && (
                                      <Badge variant="outline" className="text-[9px] py-0 px-1 bg-indigo-50/15 text-indigo-400 border-indigo-500/25">
                                        {(asset as any).location.name}
                                      </Badge>
                                    )}
                                  </h4>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {asset.make && <span>{asset.make} {asset.model} · </span>}
                                    S/N: <span className="font-mono">{asset.serial_number || "N/A"}</span>
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm(`Remove this asset: "${asset.name}"?`)) {
                                      deleteAssetMutation.mutate(asset.id);
                                    }
                                  }}
                                  className="h-6 w-6 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete asset"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Installed: {asset.install_date ? format(new Date(asset.install_date + "T00:00:00"), "MMM dd, yyyy") : "Unknown"}
                                </span>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 gap-1 text-primary text-[10px]"
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setHistoryDialogOpen(true);
                                  }}
                                >
                                  <History className="h-3 w-3" />
                                  Logs ({asset.service_history.length})
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Service Locations Panel */}
                <Card className="border-border/50 card-shadow-md">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <MapPin className="h-4.5 w-4.5 text-primary" />
                        Service Locations
                      </CardTitle>
                      <CardDescription className="text-[10px]">
                        Multi-site deployment and route check-in sub-locations.
                      </CardDescription>
                    </div>
                    {selectedCustomer && (
                      <Button variant="outline" size="xs" onClick={() => setLocDialogOpen(true)} className="gap-1 text-[11px] h-7">
                        <Plus className="h-3 w-3" /> Add
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!selectedCustomerId ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                        <MapPin className="h-8 w-8 text-muted-foreground/45 mb-2" />
                        <p className="text-xs">Select a customer to view sub-locations.</p>
                      </div>
                    ) : locationsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : locations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                        <Plus className="h-6 w-6 text-muted-foreground/40 mb-1 cursor-pointer" onClick={() => setLocDialogOpen(true)} />
                        <p className="text-xs font-medium">No sub-locations configured</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {locations.map((loc: any) => (
                          <Card key={loc.id} className="bg-muted/20 border-border/40 relative group overflow-hidden">
                            <CardContent className="p-3 space-y-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-bold text-foreground text-xs leading-none">
                                    {loc.name}
                                  </h4>
                                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                    <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                                    {loc.address}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm(`Remove location "${loc.name}"?`)) {
                                      deleteLocationMutation.mutate(loc.id);
                                    }
                                  }}
                                  className="h-6 w-6 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete location"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leads" className="focus-visible:outline-none">
          <LeadsPipeline companyId={company?.id || ""} />
        </TabsContent>
      </Tabs>

        {/* Customer Dialog */}
        <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {editingCustomer ? "Edit Client Info" : "Register New Client"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Client Name *</label>
                <Input
                  placeholder="e.g. Acme Corporation, John Doe"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Email Address</label>
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Phone Number</label>
                  <Input
                    placeholder="555-0199"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Billing Address</label>
                <Input
                  ref={addressInputRef}
                  placeholder="e.g. 123 Financial Ave, New York NY (Type to search address...)"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                />
                {customerDialogOpen && (
                  <BillingAddressAutocomplete
                    inputRef={addressInputRef}
                    onAddressSelect={(addr) => setCustAddress(addr)}
                  />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeCustomerDialog}>
                Cancel
              </Button>
              <Button
                onClick={() => saveCustomerMutation.mutate()}
                disabled={saveCustomerMutation.isPending}
              >
                {saveCustomerMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Asset Dialog */}
        <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Add Equipment Asset
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Equipment Name *</label>
                <Input
                  placeholder="e.g. Carrier 5-Ton HVAC Heat Pump"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Make / Brand</label>
                  <Input
                    placeholder="e.g. Carrier"
                    value={assetMake}
                    onChange={(e) => setAssetMake(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Model Number</label>
                  <Input
                    placeholder="e.g. 50-HJ-060"
                    value={assetModel}
                    onChange={(e) => setAssetModel(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Equipment Type</label>
                  <Input
                    placeholder="e.g. AC unit, Boiler"
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Serial Number</label>
                  <Input
                    placeholder="e.g. CRR-5T-987456-X"
                    value={assetSerial}
                    onChange={(e) => setAssetSerial(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Install Date</label>
                  <Input
                    type="date"
                    value={assetInstallDate}
                    onChange={(e) => setAssetInstallDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Warranty Expiry</label>
                  <Input
                    type="date"
                    value={assetWarranty}
                    onChange={(e) => setAssetWarranty(e.target.value)}
                  />
                </div>
              </div>
              
              {locations.length > 0 && (
                <div className="space-y-1 mt-2">
                  <label className="text-xs font-semibold text-foreground">Installed Location Site</label>
                  <Select value={assetLocationId} onValueChange={setAssetLocationId}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Main Billing Address</SelectItem>
                      {locations.map((loc: any) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeAssetDialog}>
                Cancel
              </Button>
              <Button onClick={() => createAssetMutation.mutate()} disabled={createAssetMutation.isPending}>
                {createAssetMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Asset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Location Dialog */}
        <Dialog open={locDialogOpen} onOpenChange={setLocDialogOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Add Service Location
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Location Name *</label>
                <Input
                  placeholder="e.g. North Warehouse, West Annex"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Address *</label>
                <Input
                  placeholder="e.g. 456 Industrial Blvd, Dallas TX"
                  value={locAddress}
                  onChange={(e) => setLocAddress(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLocDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => addLocationMutation.mutate()}
                disabled={addLocationMutation.isPending || !locName.trim() || !locAddress.trim()}
              >
                {addLocationMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Location
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Service History Dialog */}
        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Service & Maintenance Logs
              </DialogTitle>
              {selectedAsset && (
                <CardDescription className="text-sm font-semibold text-foreground mt-1">
                  {selectedAsset.name} {selectedAsset.serial_number && `(S/N: ${selectedAsset.serial_number})`}
                </CardDescription>
              )}
            </DialogHeader>

            {/* Service Log list */}
            <div className="flex-1 overflow-y-auto my-4 pr-1 space-y-3 min-h-[150px]">
              {selectedAsset?.service_history.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  No service event logged for this equipment.
                </p>
              ) : (
                selectedAsset?.service_history.map((log, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border/40 bg-muted/15 space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {log.date}
                      </span>
                      <span>Staff: {log.field_crew}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{log.notes}</p>
                  </div>
                ))
              )}
            </div>

            {/* Log a new Service Event */}
            <form onSubmit={logServiceEvent} className="border-t pt-4 space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Log Service Activity</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-[11px] font-semibold text-muted-foreground">Service Notes / Actions Taken *</label>
                  <Textarea
                    placeholder="Describe maintenance actions, filter changes, pressure readings, etc."
                    value={newLogNotes}
                    onChange={(e) => setNewLogNotes(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[11px] font-semibold text-muted-foreground">Field Crew / Sign-off</label>
                  <Input
                    placeholder="e.g. Steve Harris"
                    value={newLogTech}
                    onChange={(e) => setNewLogTech(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateAssetHistoryMutation.isPending}
                  className="gap-1"
                >
                  {updateAssetHistoryMutation.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Save Log Entry
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );

  if (projectId) {
    return apiKey ? (
      <APIProvider apiKey={apiKey} libraries={["places"]}>
        {pageContent}
      </APIProvider>
    ) : (
      pageContent
    );
  }

  return (
    <>
      <SEO
        title="CRM & Installed Assets"
        description="Manage your client profiles and trace field-installed equipment service logs."
        path="/crm"
        noIndex
      />
      <DashboardLayout
        activeTab="crm"
        companyName={company?.name || ""}
        companyPrefix={company?.prefix || ""}
        companyId={company?.id || ""}
      >
        {apiKey ? (
          <APIProvider apiKey={apiKey} libraries={["places"]}>
            {pageContent}
          </APIProvider>
        ) : (
          pageContent
        )}
      </DashboardLayout>
    </>
  );
}

/** Invisible helper that lives inside <APIProvider> and binds Places Autocomplete to a ref */
function BillingAddressAutocomplete({
  inputRef,
  onAddressSelect,
}: {
  inputRef: React.RefObject<HTMLInputElement>;
  onAddressSelect: (address: string) => void;
}) {
  const placesLib = useMapsLibrary("places");

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const ac = new placesLib.Autocomplete(inputRef.current, {
      fields: ["formatted_address"],
    });

    const listener = ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place.formatted_address) {
        onAddressSelect(place.formatted_address);
      }
    });

    return () => {
      listener.remove();
      // Clean up the autocomplete container google injects
      const pacContainers = document.querySelectorAll(".pac-container");
      pacContainers.forEach((el) => el.remove());
    };
  }, [placesLib, inputRef, onAddressSelect]);

  return null;
}
