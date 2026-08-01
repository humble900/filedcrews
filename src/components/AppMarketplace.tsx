import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plug, Zap, Search, ShieldCheck, Box, Settings2, BarChart3, Truck, Unplug } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { saveCompanyIntegration, disconnectCompanyIntegration } from "@/lib/integrations";
import { AccountingLinkWidget } from "./AccountingLinkWidget";

interface AppIntegration {
  id: string;
  key: "quickbooks" | "xero" | "ferguson" | "samsara" | "mailchimp";
  name: string;
  category: "accounting" | "supply_house" | "fleet" | "ai" | "marketing";
  description: string;
  icon: any;
  status: "connected" | "disconnected" | "coming_soon";
  isPremium?: boolean;
}

const APP_DIRECTORY: AppIntegration[] = [
  { id: "qbo", key: "quickbooks", name: "QuickBooks Online", category: "accounting", description: "Two-way sync for invoices, payments, and customers.", icon: BarChart3, status: "disconnected" },
  { id: "xero", key: "xero", name: "Xero Accounting", category: "accounting", description: "Seamless accounting ledger synchronization.", icon: BarChart3, status: "disconnected" },
  { id: "mailchimp", key: "mailchimp", name: "Mailchimp CRM", category: "marketing", description: "Sync CRM contacts for email campaigns.", icon: Zap, status: "disconnected" },
  { id: "ferguson", key: "ferguson", name: "Ferguson Supply", category: "supply_house", description: "Live catalog pricing and PO generation.", icon: Box, status: "coming_soon" },
  { id: "samsara", key: "samsara", name: "Samsara Fleet", category: "fleet", description: "Live vehicle GPS and telematics tracking.", icon: Truck, status: "coming_soon", isPremium: true },
];

export const AppMarketplace = ({ companyId }: { companyId?: string }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [apps, setApps] = useState<AppIntegration[]>(APP_DIRECTORY);
  const [companySettings, setCompanySettings] = useState<any>({});

  useEffect(() => {
    if (!companyId) return;
    async function loadCompanyIntegrations() {
      const { data } = await supabase
        .from("companies")
        .select("automation_settings")
        .eq("id", companyId)
        .maybeSingle();

      if (data?.automation_settings) {
        const settings = data.automation_settings;
        setCompanySettings(settings);

        setApps((current) =>
          current.map((app) => {
            if (app.status === "coming_soon") return app;
            const providerData = settings[app.key];
            const isConn = Boolean(providerData?.connected || settings[`${app.key}_client_id`]);
            return { ...app, status: isConn ? "connected" : "disconnected" };
          })
        );
      }
    }
    loadCompanyIntegrations();
  }, [companyId]);

  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || app.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleConnect = async (app: AppIntegration) => {
    if (!companyId) {
      toast.error("Company ID required.");
      return;
    }

    if (app.status === "connected") {
      // Disconnect flow
      try {
        const updated = await disconnectCompanyIntegration(companyId, app.key as any, companySettings);
        setCompanySettings(updated);
        setApps((current) =>
          current.map((item) => (item.id === app.id ? { ...item, status: "disconnected" } : item))
        );
        toast.success(`${app.name} disconnected and credentials purged.`);
      } catch (err: any) {
        toast.error(`Failed to disconnect ${app.name}: ${err.message}`);
      }
    } else {
      // Connect flow
      try {
        const updated = await saveCompanyIntegration(
          companyId,
          app.key as any,
          {
            client_id: `${app.key}_id_${Date.now().toString().slice(-6)}`,
            client_secret: `${app.key}_secret_${Date.now().toString().slice(-6)}`,
          },
          companySettings
        );
        setCompanySettings(updated);
        setApps((current) =>
          current.map((item) => (item.id === app.id ? { ...item, status: "connected" } : item))
        );
        toast.success(`${app.name} connected successfully!`);
      } catch (err: any) {
        toast.error(`Failed to connect ${app.name}: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Plug className="h-6 w-6 text-indigo-500" />
            App Integrations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Connect third-party tools to supercharge your field operations.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search integrations..." 
            className="pl-9 bg-card border-border/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {["all", "accounting", "supply_house", "fleet", "marketing"].map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat)}
            className={`capitalize ${activeCategory === cat ? "bg-indigo-600 text-white hover:bg-indigo-700" : ""}`}
          >
            {cat.replace("_", " ")}
          </Button>
        ))}
      </div>

      {/* Accounting Quick-Link Widget */}
      {(activeCategory === "all" || activeCategory === "accounting") && !searchQuery && (
        <div className="mb-6">
          <AccountingLinkWidget companyId={companyId} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApps.map((app) => (
          <Card key={app.id} className="border-border/50 card-shadow-sm flex flex-col transition-all hover:border-indigo-500/30">
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <app.icon className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="flex flex-col items-end gap-1">
                {app.status === "connected" && (
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/25 text-[10px] uppercase font-bold gap-1">
                    <ShieldCheck className="h-3 w-3" /> Connected
                  </Badge>
                )}
                {app.isPremium && (
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] uppercase font-bold">
                    Premium
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <CardTitle className="text-base">{app.name}</CardTitle>
              <CardDescription className="mt-1 text-xs">{app.description}</CardDescription>
            </CardContent>
            <CardFooter className="pt-0">
              {app.status === "coming_soon" ? (
                <Button variant="outline" className="w-full text-xs" disabled>Coming Soon</Button>
              ) : app.category === "accounting" ? (
                <Button 
                  variant={app.status === "connected" ? "outline" : "default"} 
                  className={`w-full text-xs font-bold ${app.status === "connected" ? "" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                  onClick={() => document.getElementById("accounting-widget")?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {app.status === "connected" ? "Manage Settings" : "Connect Ledger"}
                </Button>
              ) : (
                <Button 
                  variant={app.status === "connected" ? "outline" : "default"} 
                  className={`w-full text-xs font-bold gap-2 ${app.status === "connected" ? "text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                  onClick={() => handleToggleConnect(app)}
                >
                  {app.status === "connected" ? (
                    <><Unplug className="h-3.5 w-3.5" /> Disconnect</>
                  ) : (
                    <><Settings2 className="h-3.5 w-3.5" /> Connect App</>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
