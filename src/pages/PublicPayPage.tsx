import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Lock,
  Building,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";

// ─── Interfaces ─────────────────────────────────────────────────────
interface Customer {
  name: string;
  email: string | null;
}

interface Job {
  title: string;
  customer: Customer | null;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  job: Job | null;
}

export default function PublicPayPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { toast } = useToast();
  const [payMethod, setPayMethod] = useState("card");

  // 1. Fetch invoice details
  const { data: invoice, isLoading, isError, refetch } = useQuery({
    queryKey: ["public_invoice", invoiceId],
    queryFn: async () => {
      if (!invoiceId) throw new Error("Missing invoice reference");
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          job:jobs(
            title,
            customer:customers(name, email)
          )
        `)
        .eq("id", invoiceId)
        .single();
      if (error) throw error;
      
      // Typecast job associations
      const row = data as any;
      return {
        ...row,
        job: row.job ? {
          title: row.job.title,
          customer: row.job.customer ? {
            name: row.job.customer.name,
            email: row.job.customer.email
          } : null
        } : null
      } as Invoice;
    },
    enabled: !!invoiceId,
  });

  // 2. Stripe checkout simulator mutation
  const simulatePaymentMutation = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error("Invoice details not loaded");

      // Insert record into payments table
      const { error: payError } = await supabase.from("payments").insert({
        invoice_id: invoice.id,
        amount: invoice.amount,
        payment_method: payMethod,
        stripe_payment_id: `ch_sim_${Math.random().toString(36).substring(2, 11)}`,
        status: "completed",
        notes: "Stripe Simulator payment"
      });
      if (payError) throw payError;
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful!",
        description: "Your payment has been processed and logged successfully."
      });
      refetch();
    },
    onError: (err: any) => {
      toast({
        title: "Payment failed",
        description: err.message,
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground mt-2">Loading checkout details...</span>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Invoice Not Found</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          This payment checkout link may have expired or is invalid. Please contact the biller.
        </p>
      </div>
    );
  }

  const isPaid = invoice.payment_status === "Paid";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-[450px] mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
            <Lock className="h-5 w-5 text-primary" />
            Secure Payment Portal
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Processed securely via Stripe Checkout encryption.</p>
        </div>

        <Card className="border-border/40 shadow-md overflow-hidden bg-white">
          <div className="bg-primary/5 p-6 border-b border-border/30 text-center">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount Due</div>
            <div className="text-3xl font-black font-mono text-primary mt-1">
              ${invoice.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-3 flex justify-center">
              {isPaid ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-200 gap-1 py-1 px-3">
                  <CheckCircle className="h-4 w-4" /> Fully Paid
                </Badge>
              ) : (
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 gap-1 py-1 px-3">
                  Unpaid Invoice
                </Badge>
              )}
            </div>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-3 text-sm border-b pb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Reference:</span>
                <span className="font-mono font-semibold uppercase text-slate-800">#INV-{invoice.id.substring(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer Name:</span>
                <span className="font-semibold text-slate-800">{invoice.job?.customer?.name || "Client"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Work Order:</span>
                <span className="font-semibold text-slate-800 max-w-[200px] truncate">{invoice.job?.title || "HVAC Services"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issued Date:</span>
                <span className="font-semibold text-slate-800">{format(new Date(invoice.created_at), "MMM dd, yyyy")}</span>
              </div>
            </div>

            {isPaid ? (
              <div className="p-4 border border-dashed rounded-lg bg-green-50/50 text-center space-y-2">
                <p className="text-xs text-green-600 font-semibold">Payment Completed Successfully</p>
                <p className="text-[10px] text-muted-foreground">
                  Thank you! A confirmation receipt has been sent to your email.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={payMethod === "card" ? "default" : "outline"}
                      onClick={() => setPayMethod("card")}
                      className="text-xs h-9 gap-1.5"
                    >
                      <CreditCard className="h-4 w-4" /> Credit Card
                    </Button>
                    <Button
                      variant={payMethod === "bank" ? "default" : "outline"}
                      onClick={() => setPayMethod("bank")}
                      className="text-xs h-9 gap-1.5"
                    >
                      <Building className="h-4 w-4" /> Bank ACH
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() => simulatePaymentMutation.mutate()}
                  disabled={simulatePaymentMutation.isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 gap-2 mt-2 shadow-lg shadow-emerald-500/20"
                >
                  {simulatePaymentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Pay ${invoice.amount.toLocaleString()} Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
