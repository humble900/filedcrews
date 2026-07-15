import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  PenTool,
  Star,
  CheckCircle2,
  Info,
} from "lucide-react";
import { format } from "date-fns";

// ─── Interfaces ─────────────────────────────────────────────────────
interface Estimate {
  id: string;
  company_id: string;
  customer_id: string;
  title: string;
  status: string;
  total_amount: number;
  valid_until: string | null;
  notes: string | null;
  signature_url: string | null;
  signed_at: string | null;
  introduction: string | null;
  introduction_image_url: string | null;
  discount_amount: number;
  tax_percent: number;
  disclaimer: string | null;
  client_message: string | null;
}

interface EstimateItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  is_optional: boolean;
  selected_by_client: boolean;
  image_url: string | null;
}

interface EstimateOption {
  id: string;
  name: string;
  sort_order: number;
  total: number;
  is_recommended: boolean;
  items: EstimateItem[];
}

export default function PublicApprovalPage() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Optional item selections tracked in client portal
  const [toggledOptionalItems, setToggledOptionalItems] = useState<Record<string, boolean>>({});

  // 1. Fetch estimate details via approval token
  const { data: estimate, isLoading, isError, refetch } = useQuery({
    queryKey: ["public_estimate", token],
    queryFn: async () => {
      if (!token) throw new Error("Missing approval token");
      const { data, error } = await supabase
        .from("estimates")
        .select("*")
        .eq("approval_token", token)
        .single();
      if (error) throw error;
      return data as Estimate;
    },
    enabled: !!token,
  });

  // 2. Fetch options + items for this estimate
  const { data: options = [] } = useQuery({
    queryKey: ["public_estimate_options", estimate?.id],
    queryFn: async () => {
      if (!estimate?.id) return [];
      const { data, error } = await supabase
        .from("estimate_options")
        .select(`
          *,
          items:estimate_items(*)
        `)
        .eq("estimate_id", estimate.id)
        .order("sort_order");
      if (error) throw error;
      return data as EstimateOption[];
    },
    enabled: !!estimate?.id,
  });

  // Auto-select recommended option or first option
  useEffect(() => {
    if (options.length > 0 && !selectedOptionId) {
      const rec = options.find(o => o.is_recommended) || options[0];
      setSelectedOptionId(rec.id);
    }
  }, [options, selectedOptionId]);

  // Set default selection state for items
  useEffect(() => {
    if (options.length > 0) {
      const initialStates: Record<string, boolean> = {};
      options.forEach(opt => {
        opt.items.forEach(item => {
          if (item.is_optional) {
            initialStates[item.id] = item.selected_by_client;
          }
        });
      });
      setToggledOptionalItems(initialStates);
    }
  }, [options]);

  // 3. Signature Canvas setup
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#1e293b"; // Slate-800
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
      }
    }
  }, [estimate]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
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
    const canvas = canvasRef.current;
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

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Calculations helper for options in client portal
  const getCalculatedTotal = (opt: EstimateOption) => {
    const subtotal = opt.items
      .filter(item => !item.is_optional || toggledOptionalItems[item.id] !== false)
      .reduce((s, i) => s + (i.unit_price * i.quantity), 0);
    const discount = estimate ? Number(estimate.discount_amount || 0) : 0;
    const tax = (subtotal - discount) * ((estimate ? Number(estimate.tax_percent || 0) : 0) / 100);
    return { subtotal, discount, tax, total: subtotal - discount + tax };
  };

  // 4. Approval Mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!estimate) throw new Error("No estimate loaded");
      if (!selectedOptionId) throw new Error("Select an option tier");

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Signature board error");
      const sigData = canvas.toDataURL();

      const selectedOption = options.find(o => o.id === selectedOptionId);
      if (!selectedOption) throw new Error("Invalid option selected");

      const calcs = getCalculatedTotal(selectedOption);

      // A. Save selected options checklist state back to database
      for (const item of selectedOption.items) {
        if (item.is_optional) {
          const isChecked = toggledOptionalItems[item.id] !== false;
          await supabase
            .from("estimate_items")
            .update({ selected_by_client: isChecked })
            .eq("id", item.id);
        }
      }

      // B. Update estimate record with the final signed amount
      const { error } = await supabase
        .from("estimates")
        .update({
          status: "Approved",
          total_amount: calcs.total,
          signature_url: sigData,
          signed_at: new Date().toISOString(),
          notes: signerName ? `Approved by ${signerName}.` : null,
        })
        .eq("id", estimate.id);
      if (error) throw error;

      // C. Log an action item alert for the team
      await supabase.from("action_items").insert({
        company_id: estimate.company_id,
        type: "estimate_approved",
        entity_type: "estimate",
        entity_id: estimate.id,
        title: "Estimate Approved!",
        description: `Estimate Proposal "${estimate.title}" was approved by customer. Ready for job booking.`,
        severity: "High",
        action_url: "/estimates"
      });
    },
    onSuccess: () => {
      toast({
        title: "Proposal Approved!",
        description: "Thank you! Your approval has been submitted to the provider."
      });
      refetch();
    },
    onError: (err: any) => {
      toast({
        title: "Error submitting approval",
        description: err.message,
        variant: "destructive"
      });
    }
  });

  // Decline Mutation
  const declineMutation = useMutation({
    mutationFn: async () => {
      if (!estimate) throw new Error("No estimate loaded");
      const { error } = await supabase
        .from("estimates")
        .update({ status: "Declined" })
        .eq("id", estimate.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Proposal Declined",
        description: "Status updated. The provider has been notified."
      });
      refetch();
    },
    onError: (err: any) => {
      toast({
        title: "Error declining",
        description: err.message,
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground mt-2">Loading estimate details...</span>
      </div>
    );
  }

  if (isError || !estimate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Proposal Not Found</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          This estimate link may have expired or is invalid. Please contact your coordinator.
        </p>
      </div>
    );
  }

  const isFinalized = estimate.status === "Approved" || estimate.status === "Converted";
  const isDeclined = estimate.status === "Declined";
  const activeOption = options.find((o) => isFinalized ? true : o.id === selectedOptionId);
  const activeCalcs = activeOption ? getCalculatedTotal(activeOption) : { subtotal: 0, discount: 0, tax: 0, total: 0 };

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6">
      <div className="max-w-[900px] mx-auto space-y-6">
        
        {/* Banner cover photo if provided */}
        {estimate.introduction_image_url && (
          <div className="h-44 sm:h-64 rounded-2xl overflow-hidden border shadow-sm relative">
            <img src={estimate.introduction_image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white space-y-1">
              <h1 className="text-xl sm:text-2xl font-black">{estimate.title}</h1>
              <p className="text-xs text-white/80 font-medium">Service Proposal Quote details</p>
            </div>
          </div>
        )}

        {/* Proposal Header Card */}
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <div className="bg-primary/5 p-6 border-b border-border/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              {!estimate.introduction_image_url && (
                <>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Proposal Quote</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{estimate.title}</p>
                </>
              )}
              {estimate.introduction_image_url && (
                <div className="text-xs font-bold text-muted-foreground uppercase">Reference ID: #{estimate.id.substring(0,8).toUpperCase()}</div>
              )}
            </div>
            <div className="shrink-0">
              {isFinalized ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-sm gap-1 py-1 px-3">
                  <CheckCircle2 className="h-4 w-4" /> Approved Proposal
                </Badge>
              ) : isDeclined ? (
                <Badge className="bg-red-500/10 text-red-600 border-red-200 text-sm gap-1 py-1 px-3">
                  <XCircle className="h-4 w-4" /> Proposal Declined
                </Badge>
              ) : (
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 text-sm gap-1 py-1 px-3">
                  Pending Approval
                </Badge>
              )}
            </div>
          </div>
          <CardContent className="p-6 space-y-4">
            {estimate.introduction && (
              <div className="text-sm text-slate-600 leading-relaxed italic whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-dashed">
                "{estimate.introduction}"
              </div>
            )}
            
            {estimate.client_message && (
              <div className="text-xs text-slate-700 leading-relaxed pt-2">
                <span className="font-bold text-slate-800">Coordinator Message:</span> {estimate.client_message}
              </div>
            )}

            {estimate.valid_until && (
              <div className="text-xs text-muted-foreground pt-2 border-t flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-primary" />
                <span>Proposal valid until:</span>
                <span className="font-semibold text-foreground">{format(new Date(estimate.valid_until), "MMM dd, yyyy")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Good/Better/Best Option Tiers Selector */}
        {!isFinalized && !isDeclined && options.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">Select a Proposal Tier Package:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {options.map((opt) => {
                const optCalcs = getCalculatedTotal(opt);
                return (
                  <Card
                    key={opt.id}
                    className={`cursor-pointer transition-all border-2 relative overflow-hidden ${
                      selectedOptionId === opt.id
                        ? "border-primary shadow-md bg-white ring-2 ring-primary/10"
                        : "border-border/40 hover:border-border/80 bg-white"
                    }`}
                    onClick={() => setSelectedOptionId(opt.id)}
                  >
                    {opt.is_recommended && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                    )}
                    <CardHeader className="pb-2 pt-4 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base font-bold">{opt.name}</CardTitle>
                      {opt.is_recommended && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1 text-[9px] py-0 px-1">
                          <Star className="h-2.5 w-2.5 fill-amber-500" /> Recommended
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-2xl font-black font-mono text-primary">
                        ${optCalcs.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      <div className="space-y-1.5 border-t pt-2 max-h-[120px] overflow-y-auto">
                        {opt.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-xs">
                            <span className="text-muted-foreground truncate max-w-[70%]">{item.name}</span>
                            <span className="font-mono font-semibold">${(item.unit_price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Option Line Items Table */}
        {activeOption && (
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">
                {isFinalized ? "Approved Proposal Scope" : "Proposed Option Scope details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="w-[100px] text-center text-xs">Quantity</TableHead>
                    <TableHead className="w-[120px] text-right text-xs">Rate</TableHead>
                    <TableHead className="w-[120px] text-right text-xs">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeOption.items.map((item) => {
                    const isChecked = toggledOptionalItems[item.id] !== false;
                    const showItem = !item.is_optional || isChecked;
                    return (
                      <TableRow key={item.id} className={`hover:bg-slate-50/20 ${!showItem ? "opacity-35 line-through bg-slate-50/5" : ""}`}>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            {item.image_url && (
                              <img src={item.image_url} alt="" className="h-10 w-10 rounded-lg object-cover border shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-800">{item.name}</span>
                                {item.is_optional && (
                                  <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary/30 text-primary bg-primary/5 uppercase font-bold shrink-0">
                                    Optional Upgrade
                                  </Badge>
                                )}
                              </div>
                              {item.description && <div className="text-[10px] text-muted-foreground mt-0.5">{item.description}</div>}
                              
                              {item.is_optional && !isFinalized && !isDeclined && (
                                <div className="pt-2 flex items-center gap-1.5">
                                  <input
                                    type="checkbox"
                                    id={`chk-${item.id}`}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      setToggledOptionalItems(prev => ({
                                        ...prev,
                                        [item.id]: e.target.checked
                                      }));
                                    }}
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                  />
                                  <label htmlFor={`chk-${item.id}`} className="text-xs text-primary font-bold cursor-pointer select-none hover:underline">
                                    {isChecked ? "Added to quote" : "Click to add upgrade (+$" + item.unit_price.toLocaleString() + ")"}
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">{item.quantity}</TableCell>
                        <TableCell className="text-right font-mono text-xs">${item.unit_price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold text-slate-800">${(item.unit_price * item.quantity).toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pricing breakdown summary */}
              <div className="p-5 border-t bg-slate-50/30 flex flex-col items-end space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between w-64">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">${activeCalcs.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                {Number(estimate.discount_amount) > 0 && (
                  <div className="flex justify-between w-64 text-rose-600">
                    <span>Discount:</span>
                    <span className="font-mono font-semibold">-${Number(estimate.discount_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {Number(estimate.tax_percent) > 0 && (
                  <div className="flex justify-between w-64">
                    <span>Sales Tax ({estimate.tax_percent}%):</span>
                    <span className="font-mono font-semibold">${activeCalcs.tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between w-64 border-t pt-2 text-sm font-black text-slate-800">
                  <span>Total Proposal Amount:</span>
                  <span className="font-mono text-primary">
                    ${activeCalcs.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer Card */}
        {estimate.disclaimer && (
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-wider">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed leading-relaxed">{estimate.disclaimer}</p>
            </CardContent>
          </Card>
        )}

        {/* Signature & Confirmation Card */}
        {!isFinalized && !isDeclined && (
          <Card className="border-border/40 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <PenTool className="h-5 w-5 text-primary" /> Sign and Approve Proposal
              </CardTitle>
              <CardDescription>Draw signature in the canvas board to authorize job execution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Print Name *</label>
                <Input
                  placeholder="Enter full legal name"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="max-w-[400px]"
                />
              </div>

              <div className="space-y-1.5 flex flex-col items-start">
                <label className="text-xs font-semibold text-slate-700">Signature Board *</label>
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="border-2 border-dashed border-slate-200 bg-white rounded-xl cursor-crosshair touch-none max-w-full"
                />
                <Button variant="link" size="xs" onClick={clearCanvas} className="text-muted-foreground p-0 mt-1">
                  Clear Signature board
                </Button>
              </div>
            </CardContent>
            <div className="p-6 border-t flex flex-col sm:flex-row justify-between gap-3 bg-slate-50/10">
              <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => declineMutation.mutate()}>
                Decline Proposal Quote
              </Button>
              <Button
                onClick={() => approveMutation.mutate()}
                disabled={!signerName.trim() || approveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
              >
                {approveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Authorize & Book Job
              </Button>
            </div>
          </Card>
        )}

        {isFinalized && estimate.signature_url && (
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Client Sign-off details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border border-dashed p-4 rounded-xl max-w-[320px] text-center bg-white">
                <img src={estimate.signature_url} alt="Signature" className="h-16 object-contain mx-auto bg-white" />
                <div className="text-[10px] text-muted-foreground mt-2 border-t pt-1 font-semibold uppercase">
                  Signed at: {estimate.signed_at ? format(new Date(estimate.signed_at), "MMM dd, yyyy HH:mm") : ""}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
