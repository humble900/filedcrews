import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

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
  company_id: string;
  amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  job: Job | null;
  company: {
    automation_settings: any;
  } | null;
}

function CheckoutForm({ invoiceId, onSuccess }: { invoiceId: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href, // If redirect required (e.g. 3D secure)
      },
      redirect: 'if_required',
    });

    if (error) {
      toast({
        title: "Payment failed",
        description: error.message || "An error occurred during payment.",
        variant: "destructive",
      });
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // Mark as paid in DB
      await supabase.from("payments").insert({
        invoice_id: invoiceId,
        amount: paymentIntent.amount / 100,
        payment_method: "card",
        stripe_payment_id: paymentIntent.id,
        status: "completed",
        notes: "Stripe Payment"
      });
      
      toast({
        title: "Payment Successful!",
        description: "Your payment has been processed securely.",
      });
      onSuccess();
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 gap-2 shadow-lg shadow-emerald-500/20"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        Pay Now
      </Button>
    </form>
  );
}

export default function PublicPayPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // 1. Fetch invoice details & company Stripe PK
  const { data: invoice, isLoading: isInvoiceLoading, isError, refetch } = useQuery({
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
          ),
          company:companies(
            automation_settings
          )
        `)
        .eq("id", invoiceId)
        .single();
      
      if (error) throw error;
      
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

  // 2. Initialize Stripe and fetch PaymentIntent
  useEffect(() => {
    async function initPayment() {
      if (!invoice || invoice.payment_status === "Paid") return;

      const pk = invoice.company?.automation_settings?.stripe?.publishable_key || invoice.company?.automation_settings?.stripe_publishable_key;
      if (!pk) {
        setPaymentError("This company has not configured payment processing yet.");
        return;
      }

      setStripePromise(loadStripe(pk));

      try {
        const { data, error } = await supabase.functions.invoke("create-payment-intent", {
          body: { invoiceId: invoice.id, companyId: invoice.company_id }
        });

        if (error || !data?.ok) {
          throw new Error(data?.error || error?.message || "Failed to create payment intent");
        }

        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setPaymentError(err.message);
      }
    }

    initPayment();
  }, [invoice]);

  if (isInvoiceLoading) {
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
            ) : paymentError ? (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                {paymentError}
              </div>
            ) : stripePromise && clientSecret ? (
              <div className="space-y-4 pt-2">
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm invoiceId={invoice.id} onSuccess={refetch} />
                </Elements>
              </div>
            ) : (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Initializing secure checkout...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
