import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SEO from "@/components/SEO";
import DashboardLayout from "@/components/DashboardLayout";
import { AccountingLinkWidget } from "@/components/AccountingLinkWidget";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Store, Search, BarChart3, Box, Truck, Zap, CheckCircle2, ArrowRight } from "lucide-react";

type AppCategory = 'all' | 'ai' | 'accounting' | 'supply_house' | 'fleet' | 'marketing';
type AppStatus = 'connected' | 'disconnected' | 'coming_soon';

const CATEGORIES: { label: string; value: AppCategory }[] = [
  { label: 'All', value: 'all' },
  { label: 'AI & Automation', value: 'ai' },
  { label: 'Accounting', value: 'accounting' },
  { label: 'Supply House', value: 'supply_house' },
  { label: 'Fleet', value: 'fleet' },
  { label: 'Marketing', value: 'marketing' },
];

const APP_DIRECTORY = [
  { id: "ai_agent", name: "FiledCrew AI Agent", category: "ai", description: "Your autonomous AI coworker. Auto-dispatch, smart scheduling, natural language commands, and intelligent field operations automation.", logo: "/ai-agent-logo.jpg", status: "disconnected" as const },
  { id: "qbo", name: "QuickBooks Online", category: "accounting", description: "Two-way sync for invoices, payments, and customers.", icon: BarChart3, status: "disconnected" as const },
  { id: "xero", name: "Xero", category: "accounting", description: "Seamless accounting ledger synchronization.", icon: BarChart3, status: "disconnected" as const },
  { id: "ferguson", name: "Ferguson Supply", category: "supply_house", description: "Live catalog pricing and PO generation.", icon: Box, status: "coming_soon" as const },
  { id: "samsara", name: "Samsara Fleet", category: "fleet", description: "Live vehicle GPS and telematics tracking.", icon: Truck, status: "coming_soon" as const },
  { id: "mailchimp", name: "Mailchimp", category: "marketing", description: "Sync CRM contacts for email campaigns.", icon: Zap, status: "disconnected" as const },
];

export default function MarketplacePage() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<AppCategory>("all");

  const filteredApps = APP_DIRECTORY.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || app.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout activeTab="marketplace">
      <SEO title="App Marketplace | FiledCrews" />
      
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
                <Store className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">App Marketplace</h1>
            </div>
            <p className="text-slate-500 text-lg ml-[60px]">
              Connect your favorite tools and extend the power of your platform.
            </p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {CATEGORIES.map(cat => (
              <Button
                key={cat.value}
                variant={activeCategory === cat.value ? "default" : "outline"}
                className={`rounded-full px-5 transition-colors ${
                  activeCategory === cat.value 
                    ? "bg-slate-900 text-white hover:bg-slate-800" 
                    : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200"
                }`}
                onClick={() => setActiveCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
          
          <div className="relative w-full lg:w-80 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search apps..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-slate-200 focus-visible:ring-primary/20 h-11 rounded-full shadow-sm"
            />
          </div>
        </div>

        {/* Accounting Link Widget */}
        {(activeCategory === "all" || activeCategory === "accounting") && (
          <div className="mt-8" id="accounting-widget">
            <AccountingLinkWidget companyId={company?.id} />
          </div>
        )}

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {filteredApps.map(app => {
            const Icon = app.icon;
            const isComingSoon = app.status === "coming_soon";
            const isAiAgent = app.id === "ai_agent";
            
            return (
              <Card key={app.id} className="group relative overflow-hidden bg-white border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col h-full rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
                      {app.logo ? (
                        <img src={app.logo} alt={app.name} className="h-full w-full object-cover" />
                      ) : (
                        Icon && <Icon className="h-7 w-7 text-slate-700" strokeWidth={1.5} />
                      )}
                    </div>
                    {isComingSoon && (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 font-medium">
                        Coming Soon
                      </Badge>
                    )}
                    {app.status === "connected" && (
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200/50 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Connected
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900">{app.name}</CardTitle>
                  <CardDescription className="text-slate-500 mt-2 text-base leading-relaxed line-clamp-2 min-h-[48px]">
                    {app.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-grow">
                </CardContent>
                
                <CardFooter className="pt-0 pb-6">
                  {isAiAgent ? (
                    <Button 
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm h-11 text-base font-medium transition-all"
                      onClick={() => navigate('/marketplace/ai-agent')}
                    >
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : isComingSoon ? (
                    <Button disabled variant="outline" className="w-full rounded-xl border-slate-200 text-slate-400 bg-slate-50/50 h-11 text-base font-medium">
                      Coming Soon
                    </Button>
                  ) : app.category === 'accounting' ? (
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 h-11 text-base font-medium transition-colors"
                      onClick={() => {
                        const el = document.getElementById('accounting-widget');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      Manage Connection
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 h-11 text-base font-medium transition-colors">
                      Connect App
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
        
        {filteredApps.length === 0 && (
          <div className="text-center py-20 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 mt-8">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No apps found</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">We couldn't find any apps matching your search. Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
