import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Calculator, Receipt, ShieldCheck, ArrowRightLeft, Unplug, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { saveCompanyIntegration, disconnectCompanyIntegration } from "@/lib/integrations";

export const AccountingLinkWidget = ({ companyId }: { companyId?: string }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [qboConnected, setQboConnected] = useState(false);
  const [companySettings, setCompanySettings] = useState<any>({});

  useEffect(() => {
    if (!companyId) return;
    async function fetchCompanySettings() {
      const { data, error } = await supabase
        .from("companies")
        .select("automation_settings")
        .eq("id", companyId)
        .maybeSingle();

      if (data?.automation_settings) {
        setCompanySettings(data.automation_settings);
        const qb = data.automation_settings.quickbooks;
        const isConn = Boolean(qb?.connected || data.automation_settings.quickbooks_client_id);
        setQboConnected(isConn);
      }
    }
    fetchCompanySettings();
  }, [companyId]);

  const handleConnectQBO = async () => {
    if (!companyId) {
      toast.error("Company ID is required to link QuickBooks.");
      return;
    }
    setIsConnecting(true);
    toast.info("Initializing Intuit QuickBooks Online authorization...");
    try {
      const { data, error } = await supabase.functions.invoke("accounting_sync", {
        body: { action: "connect", provider: "quickbooks" }
      });
      if (error) throw error;
      
      const updated = await saveCompanyIntegration(
        companyId,
        "quickbooks",
        {
          client_id: data.client_id,
          client_secret: data.client_secret,
        },
        companySettings
      );
      setCompanySettings(updated);
      setQboConnected(true);
      toast.success("Successfully linked to QuickBooks Online!");
    } catch (err: any) {
      toast.error("Failed to connect QuickBooks: " + err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectQBO = async () => {
    if (!companyId) return;
    setIsDisconnecting(true);
    try {
      const { error } = await supabase.functions.invoke("accounting_sync", {
        body: { action: "disconnect", provider: "quickbooks" }
      });
      if (error) throw error;
      
      const updated = await disconnectCompanyIntegration(companyId, "quickbooks", companySettings);
      setCompanySettings(updated);
      setQboConnected(false);
      toast.success("QuickBooks Online disconnected and credentials purged.");
    } catch (err: any) {
      toast.error("Failed to disconnect: " + err.message);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleManualSync = async () => {
    if (!qboConnected) {
      toast.error("Please connect an accounting ledger first.");
      return;
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("accounting_sync", {
        body: { tenant_id: companyId, action: "sync_invoices" },
      });

      if (error) {
        console.error("Edge function failed:", error);
        toast.error("Accounting synchronization failed", {
          description: error.message || "Unable to connect to QuickBooks."
        });
        return;
      }
      
      toast.success(`Synced ${data?.synced_count || 0} invoices to QuickBooks!`, {
        description: "Your ledger is now up to date."
      });
    } catch (err: any) {
      console.error("Edge function fetch failed", err);
      toast.error("Accounting synchronization failed", {
        description: "A network error occurred while attempting to sync."
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card id="accounting-widget" className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-card card-shadow-md">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-500" />
              Accounting Sync
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Automatically push finalized invoices and payments to your general ledger.
            </CardDescription>
          </div>
          {qboConnected ? (
            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 px-2 py-1 gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure Link Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground px-2 py-1">
              Not Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 space-y-3 w-full">
          <div className="flex items-center gap-3 text-sm">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${qboConnected ? 'bg-indigo-500/10 text-indigo-500' : 'bg-muted text-muted-foreground'}`}>
              <Receipt className="h-5 w-5" />
            </div>
            <ArrowRightLeft className={`h-4 w-4 ${qboConnected ? 'text-indigo-500 animate-pulse' : 'text-muted-foreground/30'}`} />
            <div className="h-10 px-4 rounded-full bg-[#2CA01C]/10 border border-[#2CA01C]/20 flex items-center justify-center text-[#2CA01C] font-bold tracking-tight text-xs">
              <span className="opacity-80 mr-1">qbo</span> QuickBooks
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            When a job is completed and the invoice is paid, FiledCrews will automatically create the Customer and Invoice records in QuickBooks, eliminating double data entry.
          </p>
        </div>
        
        <div className="w-full md:w-auto flex flex-col gap-2 shrink-0">
          {!qboConnected ? (
            <Button 
              className="w-full bg-[#2CA01C] hover:bg-[#2CA01C]/90 text-white font-bold h-10 shadow-sm"
              onClick={handleConnectQBO}
              disabled={isConnecting}
            >
              {isConnecting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Linking Account...</> : "Connect to QuickBooks"}
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="w-full font-bold h-10 gap-2 border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-600"
                onClick={handleManualSync}
                disabled={isSyncing}
              >
                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                Run Manual Sync
              </Button>

              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="flex-1 text-[10px] h-7 text-emerald-600 hover:bg-emerald-500/10"
                  onClick={handleConnectQBO}
                  disabled={isConnecting}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Reconnect
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="flex-1 text-[10px] h-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                  onClick={handleDisconnectQBO}
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Unplug className="h-3 w-3 mr-1" />} Disconnect
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
