import { ReactNode, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin,
  Users,
  LogOut,
  Menu,
  LayoutDashboard,
  Calendar,
  Briefcase,
  Building2,
  ClipboardList,
  Receipt,
  ShieldAlert,
  TrendingUp,
  BarChart3,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Award,
  Clock,
  FileCheck,
  Package,
  Search,
  Settings,
  Store,
  BrainCircuit,
  CheckCircle,
  BookOpen
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { ConnectionStatus } from "./ConnectionStatus";
import { AICommandBar } from "./ai/AICommandBar";
import { cn } from "@/lib/utils";
import NotificationCenter from "./NotificationCenter";
import Omnisearch from "./Omnisearch";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { usePermissions, type Feature } from "@/hooks/usePermissions";
import { useTerminology } from "@/hooks/useTerminology";

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange?: (tab: string) => void;
  companyName: string;
  companyPrefix: string;
  companyId: string;
  geofenceEditing?: boolean;
}

const navItems: { id: string; label: string; mobileLabel?: string; icon: any; feature: Feature; group: string }[] = [
  { id: "inbox", label: "Action Inbox", icon: CheckCircle, feature: "inbox" as Feature, group: "Operations" },
  { id: "overview", label: "Overview", mobileLabel: "Home", icon: LayoutDashboard, feature: "overview", group: "Operations" },
  { id: "projects", label: "Projects", icon: Briefcase, feature: "projects", group: "Operations" },
  { id: "work-orders", label: "Work Orders", mobileLabel: "Orders", icon: ClipboardList, feature: "jobs", group: "Operations" },
  { id: "map", label: "Crew + Geofence", mobileLabel: "Map", icon: MapPin, feature: "map", group: "Operations" },

  { id: "crm", label: "CRM & Assets", mobileLabel: "CRM", icon: Building2, feature: "crm", group: "Finance & CRM" },
  { id: "estimates", label: "Estimates", icon: FileText, feature: "estimates", group: "Finance & CRM" },
  { id: "invoices", label: "Invoices", icon: Receipt, feature: "invoices", group: "Finance & CRM" },
  { id: "memberships", label: "Memberships", icon: Award, feature: "memberships", group: "Finance & CRM" },

  { id: "inventory", label: "Inventory & POs", mobileLabel: "Stock", icon: Package, feature: "inventory", group: "Management" },
  { id: "staff", label: "Staff Profiles", mobileLabel: "Staff", icon: Users, feature: "staff", group: "Management" },
  { id: "timesheets", label: "Timesheets", icon: Clock, feature: "timesheets", group: "Management" },
  { id: "change-orders", label: "Change Orders", icon: TrendingUp, feature: "change-orders", group: "Management" },

  { id: "safety", label: "Safety Hub", mobileLabel: "Safety", icon: ShieldAlert, feature: "safety", group: "Admin & Reports" },
  { id: "compliance", label: "Compliance", icon: FileCheck, feature: "compliance", group: "Admin & Reports" },
  { id: "reports", label: "Reports & Logs", mobileLabel: "Reports", icon: BarChart3, feature: "reports", group: "Admin & Reports" },
  { id: "tracker", label: "Tracker App", icon: Smartphone, feature: "tracker", group: "Admin & Reports" },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen, feature: "settings" as Feature, group: "Admin & Reports" },
  { id: "marketplace", label: "Marketplace", icon: Store, feature: "marketplace", group: "Admin & Reports" },
  { id: "settings", label: "Settings", icon: Settings, feature: "settings", group: "Admin & Reports" },
];

function SidebarContent({
  activeTab,
  onTabChange,
  companyName,
  companyId,
  geofenceEditing,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
}: {
  activeTab: string;
  onTabChange?: (tab: string) => void;
  companyName?: string;
  companyId: string;
  geofenceEditing?: boolean;
  onNavigate?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { signOut, company } = useAuth();
  const { hasPermission, userRole } = usePermissions();
  const { t } = useTerminology();
  const navigate = useNavigate();
  const location = useLocation();

  const getNavLabel = (item: { id: string; label: string }) => {
    if (item.id === "projects") return t("Projects");
    if (item.id === "work-orders") {
      const jobTerm = t("jobs");
      return jobTerm.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    if (item.id === "map") return `${t("Crew")} + Geofence`;
    if (item.id === "staff") return t("CrewMembers");
    if (item.id === "timesheets") return `${t("Job")} Timesheets`;
    return item.label;
  };

  // Filter nav items to only show features the user has access to and that are enabled in company settings
  const visibleNavItems = navItems.filter((item) => {
    if (!hasPermission(item.feature)) return false;

    // Progressive disclosure module check
    const enabledModules = (company?.enabled_modules as Record<string, boolean>) || {};
    
    if (item.feature === 'safety' && enabledModules.safety === false) return false;
    if (item.feature === 'change-orders' && enabledModules.change_orders === false) return false;
    if (item.feature === 'memberships' && enabledModules.memberships === false) return false;
    if (item.feature === 'timesheets' && enabledModules.timesheets === false) return false;

    return true;
  });

  if ((company as any)?.ai_agent_enabled) {
    visibleNavItems.splice(visibleNavItems.findIndex(i => i.id === 'settings'), 0, {
      id: "ai-agent",
      label: "AI Agent",
      icon: BrainCircuit,
      feature: "ai-agent" as any,
      group: "AI & Automation"
    });
  }

  // Group items dynamically for modern sidebar presentation
  const groupedNavItems = useMemo(() => {
    const groups: Record<string, typeof visibleNavItems> = {
      "Operations": [],
      "Finance & CRM": [],
      "Management": [],
      "Admin & Reports": []
    };
    visibleNavItems.forEach((item) => {
      if (groups[item.group]) {
        groups[item.group].push(item);
      }
    });
    return groups;
  }, [visibleNavItems]);

  // Fetch projects list for selector dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ["projects_selector_list", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, ref_number")
        .eq("company_id", companyId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Extract active project id from path if matching /projects/:id
  const match = location.pathname.match(/^\/projects\/([a-f0-9-]+)/i);
  const currentProjectId = match ? match[1] : "global";

  const handleProjectSwap = (val: string) => {
    if (val === "global") {
      navigate("/projects");
    } else {
      navigate(`/projects/${val}`);
    }
  };

  return (
    <>
      <div className={cn("p-4 border-b border-sidebar-border space-y-4", isCollapsed && "p-3")}>
        <div className="flex items-center justify-between gap-2">
          {!isCollapsed ? (
            <div className="flex items-center gap-2 truncate">
              <img src="/favicon.png" alt="Ocrem" className="h-7 w-7 rounded-lg shrink-0" />
              <span className="text-sm font-bold text-white truncate">FiledCrews</span>
            </div>
          ) : (
            <img src="/favicon.png" alt="Ocrem" className="h-7 w-7 rounded-lg mx-auto shrink-0" />
          )}
          {!isCollapsed && companyId && <NotificationCenter companyId={companyId} />}
        </div>
        
        {!isCollapsed && companyName && (
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-sidebar-foreground/50 uppercase font-black tracking-wider truncate flex-1">{companyName}</p>
            <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 border-sidebar-foreground/20 text-sidebar-foreground/60 font-bold uppercase tracking-wider shrink-0">
              {userRole}
            </Badge>
          </div>
        )}

        {/* Quick Search Shortcut Button in Sidebar */}
        <div className="px-1 pt-1.5">
          <Button
            variant="outline"
            className="w-full h-8 justify-start gap-2 bg-sidebar-accent/15 border-sidebar-border/60 hover:bg-sidebar-accent/30 text-sidebar-foreground/60 text-xs font-semibold px-2"
            onClick={() => window.dispatchEvent(new CustomEvent("trigger-omnisearch"))}
          >
            <Search className="h-4 w-4 text-primary shrink-0" />
            {!isCollapsed ? (
              <>
                <span className="flex-1 text-left">Quick Search</span>
                <kbd className="bg-sidebar-accent/30 text-[9px] px-1 py-0.5 rounded border border-sidebar-border font-mono text-sidebar-foreground/45 shrink-0">
                  ⌘K
                </kbd>
              </>
            ) : null}
          </Button>
        </div>

        {/* Project Selector / Swapper Dropdown (hidden when collapsed) */}
        {!isCollapsed && companyId && (
          <div className="space-y-1.5 pt-1">
            <label className="text-[9px] uppercase font-bold text-sidebar-foreground/45 tracking-widest block">
              Project Context
            </label>
            <Select value={currentProjectId} onValueChange={handleProjectSwap}>
              <SelectTrigger className="w-full h-8 bg-sidebar-accent/30 border-sidebar-border hover:bg-sidebar-accent/50 text-sidebar-foreground text-xs font-semibold">
                <SelectValue placeholder="Select context..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global" className="text-xs font-semibold">
                  🌐 Global Dashboard
                </SelectItem>
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded">{p.ref_number}</span>
                      <span className="truncate">{p.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentProjectId !== "global" && (() => {
              const activeProj = projects.find((p: any) => p.id === currentProjectId);
              return activeProj ? (
                <div className="flex items-center gap-1.5 px-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-[10px] text-emerald-400 font-semibold truncate">{activeProj.name}</span>
                  <span className="text-[9px] text-sidebar-foreground/40 font-mono shrink-0">{activeProj.ref_number}</span>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Navigation - Hidden Scrollbar & Touch Scrollable */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto scrollbar-none">
        {Object.entries(groupedNavItems).map(([groupName, items]) => {
          if (items.length === 0) return null;
          return (
            <div key={groupName} className="space-y-1">
              {!isCollapsed && (
                <p className="text-[9px] uppercase font-bold text-sidebar-foreground/35 px-3 tracking-wider pb-1">
                  {groupName}
                </p>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const isProjectRoute = location.pathname.startsWith("/projects/");
                let isActive = activeTab === item.id;
                if (isProjectRoute) {
                  const tabParam = new URLSearchParams(location.search).get("tab") || "overview";
                  const tabToNavMap: Record<string, string> = {
                    overview: "overview", jobs: "work-orders", "work-orders": "work-orders",
                    team: "staff", billing: "invoices", safety: "safety", reports: "reports",
                  };
                  isActive = (tabToNavMap[tabParam] || "overview") === item.id;
                } else {
                  const pathMap: Record<string, string> = {
                    "/crm": "crm", "/projects": "projects", "/jobs": "work-orders", "/work-orders": "work-orders",
                    "/invoices": "invoices", "/safety": "safety", "/change-orders": "change-orders",
                    "/reports": "reports", "/billing": "settings", "/settings": "settings", "/memberships": "memberships",
                    "/inventory": "inventory", "/timesheets": "timesheets", "/estimates": "estimates",
                    "/compliance": "compliance"
                  };
                  const pathTab = pathMap[location.pathname];
                  if (pathTab) isActive = pathTab === item.id;
                }
                const isDisabled = geofenceEditing && item.id !== "map";

                return (
                  <button
                    key={item.id}
                    title={getNavLabel(item)}
                    onClick={() => {
                      if (isDisabled) return;
                      onTabChange?.(item.id);
                      onNavigate?.();
                    }}
                    disabled={isDisabled}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all w-full text-left",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm font-bold"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
                      isCollapsed && "justify-center px-0 gap-0",
                      isDisabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span>{getNavLabel(item)}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer controls */}
      <div className={cn("p-3 border-t border-sidebar-border space-y-1.5", isCollapsed && "p-2")}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 text-[10px] uppercase font-bold tracking-wider h-8",
            isCollapsed && "justify-center px-0 gap-0"
          )}
          onClick={onToggleCollapse}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span>Minimize Menu</span>
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 text-xs font-semibold h-8",
            isCollapsed && "justify-center px-0 gap-0"
          )}
          onClick={signOut}
          disabled={geofenceEditing}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
  activeTab,
  onTabChange,
  companyName,
  companyPrefix,
  companyId,
  geofenceEditing,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });
  const { hasPermission } = usePermissions();
  const { signOut, isTrialExpired } = useAuth();
  const { t } = useTerminology();
  const location = useLocation();
  const navigate = useNavigate();

  const getNavLabel = (item: { id: string; label: string }) => {
    if (item.id === "projects") return t("Projects");
    if (item.id === "work-orders") {
      const jobTerm = t("jobs");
      return jobTerm.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    if (item.id === "map") return `${t("Crew")} + Geofence`;
    if (item.id === "staff") return t("CrewMembers");
    if (item.id === "timesheets") return `${t("Job")} Timesheets`;
    return item.label;
  };

  const getMobileLabel = (item: { id: string; label: string; mobileLabel?: string }) => {
    if (item.id === "projects") return t("Projects");
    if (item.id === "work-orders") {
      const jobsWord = t("jobs");
      if (jobsWord === "patrol shifts") return "Patrols";
      if (jobsWord === "mow visits") return "Visits";
      if (jobsWord === "cleanings") return "Cleans";
      return "Orders";
    }
    if (item.id === "map") return t("Crew");
    if (item.id === "staff") return t("CrewMembers");
    return item.mobileLabel || item.label;
  };

  // Detect project mode: sidebar is hidden when inside a project workspace
  const isProjectMode = /^\/projects\/[a-f0-9-]+/i.test(location.pathname);

  // Filter nav items visible to this user
  const visibleNavItems = navItems.filter((item) => hasPermission(item.feature));

  // First 4 visible items for bottom quick-access nav
  const mobileQuickNavItems = visibleNavItems.slice(0, 4);

  // Extract active project id from path if matching /projects/:id
  const match = location.pathname.match(/^\/projects\/([a-f0-9-]+)/i);
  const currentProjectId = match ? match[1] : "global";

  const handleNavigation = (itemId: string) => {
    if (currentProjectId !== "global") {
      if (itemId === "overview") {
        navigate(`/projects/${currentProjectId}?tab=overview`);
      } else if (itemId === "projects") {
        navigate("/projects");
      } else if (itemId === "work-orders") {
        navigate(`/projects/${currentProjectId}?tab=work-orders`);
      } else if (itemId === "staff") {
        navigate(`/projects/${currentProjectId}?tab=team`);
      } else if (itemId === "invoices") {
        navigate(`/projects/${currentProjectId}?tab=billing`);
      } else if (itemId === "safety") {
        navigate(`/projects/${currentProjectId}?tab=safety`);
      } else if (itemId === "reports") {
        navigate(`/projects/${currentProjectId}?tab=reports`);
      } else {
        // Global pages fallback for items that do not exist inside project-scoped workspace
        if (itemId === "crm") {
          navigate("/crm");
        } else if (itemId === "inventory") {
          navigate("/inventory");
        } else if (itemId === "memberships") {
          navigate("/memberships");
        } else if (itemId === "timesheets") {
          navigate("/timesheets");
        } else if (itemId === "estimates") {
          navigate("/estimates");
        } else if (itemId === "change-orders") {
          navigate("/change-orders");
        } else if (itemId === "compliance") {
          navigate("/compliance");
        } else if (itemId === "marketplace") {
          navigate("/marketplace");
        } else if (itemId === "ai-agent") {
          navigate("/ai-agent");
        } else if (itemId === "billing" || itemId === "settings") {
          navigate("/settings?tab=billing");
        } else if (itemId === "map") {
          navigate("/", { state: { tab: "map" } });
        } else if (itemId === "tracker") {
          navigate("/", { state: { tab: "tracker" } });
        } else {
          navigate("/");
        }
      }
    } else {
      // Global navigation
      if (itemId === "crm") {
        navigate("/crm");
      } else if (itemId === "projects") {
        navigate("/projects");
      } else if (itemId === "work-orders") {
        navigate("/work-orders");
      } else if (itemId === "invoices") {
        navigate("/invoices");
      } else if (itemId === "safety") {
        navigate("/safety");
      } else if (itemId === "change-orders") {
        navigate("/change-orders");
      } else if (itemId === "reports") {
        navigate("/reports");
      } else if (itemId === "billing" || itemId === "settings") {
        navigate("/settings");
      } else if (itemId === "memberships") {
        navigate("/memberships");
      } else if (itemId === "inventory") {
        navigate("/inventory");
      } else if (itemId === "timesheets") {
        navigate("/timesheets");
      } else if (itemId === "estimates") {
        navigate("/estimates");
      } else if (itemId === "compliance") {
        navigate("/compliance");
      } else if (itemId === "marketplace") {
        navigate("/marketplace");
      } else if (itemId === "ai-agent") {
        navigate("/ai-agent");
      } else {
        if (location.pathname !== "/") {
          navigate("/", { state: { tab: itemId } });
        } else if (onTabChange) {
          onTabChange(itemId);
        } else {
          navigate("/", { state: { tab: itemId } });
        }
      }
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ═══ MOBILE: Compact Top Header (always visible) ═══ */}
      <header className="md:hidden glass-header sticky top-0 z-40 flex items-center justify-between px-3 py-2.5 safe-top">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="Ocrem" className="h-7 w-7 rounded-lg" />
          <div>
            <span className="font-bold text-xs leading-tight block">{companyName}</span>
            <span className="text-[9px] text-muted-foreground font-semibold">FiledCrews</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.dispatchEvent(new CustomEvent("trigger-omnisearch"))}
            className="h-8 w-8 text-muted-foreground hover:text-white"
          >
            <Search className="h-4 w-4" />
          </Button>
          {companyId && <NotificationCenter companyId={companyId} />}
        </div>
      </header>

      {/* ═══ DESKTOP: Fixed Sticky Sidebar (hidden in project mode) ═══ */}
      {!isProjectMode && (
        <aside
          className={cn(
            "hidden md:flex bg-sidebar text-sidebar-foreground flex-col shrink-0 sticky top-0 h-screen border-r border-sidebar-border transition-all duration-300 ease-in-out",
            isCollapsed ? "w-16" : "w-60"
          )}
        >
          <SidebarContent
            activeTab={activeTab}
            onTabChange={handleNavigation}
            companyName={companyName}
            companyId={companyId}
            geofenceEditing={geofenceEditing}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
          />
        </aside>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <main className={cn(
        "flex-1 overflow-y-auto bg-background text-foreground h-screen",
        isProjectMode ? "pb-0" : "pb-16 md:pb-0"
      )}>
        {isTrialExpired && !location.pathname.startsWith('/settings') && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6 bg-card border border-border/50 rounded-2xl p-8 shadow-2xl">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/15 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold">Trial Period Expired</h2>
                <p className="text-muted-foreground text-sm">
                  Your 14-day free trial has ended. Upgrade to a paid plan or join our Founding Partner Charter ($2,899/yr for up to 20 seats) to continue using FiledCrews.
                </p>
              </div>
              <Button onClick={() => navigate('/settings?tab=billing')} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500">
                View Plans & Upgrade
              </Button>
            </div>
          </div>
        )}
        <ConnectionStatus />
        <Outlet />
        {children}
        <AICommandBar />
      </main>

      {/* ═══ MOBILE: Bottom Navigation Bar (hidden in project mode — project has its own tabs) ═══ */}
      {!isProjectMode && (
        <nav className="md:hidden bottom-nav glass-header border-t border-border/30">
          <div className="grid grid-cols-5">
            {/* Quick access tabs (first 4 features user has access to) */}
            {mobileQuickNavItems.slice(0, 4).map((item) => (
              <button
                key={item.id}
                className={`bottom-nav-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => {
                  handleNavigation(item.id);
                }}
              >
                <item.icon className="h-5 w-5" />
                <span>{getMobileLabel(item)}</span>
              </button>
            ))}

            {/* Hamburger — opens full sidebar */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="bottom-nav-item">
                  <Menu className="h-5 w-5" />
                  <span>More</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl p-0 bg-background max-h-[75vh] overflow-y-auto">
                <div className="p-1.5 flex justify-center">
                  <div className="w-9 h-1 rounded-full bg-muted-foreground/20" />
                </div>
                <div className="px-4 pb-6 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-2">
                    All Features
                  </p>
                  {visibleNavItems.map((item) => (
                    <button
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-semibold transition-colors touch-target",
                        activeTab === item.id
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                      onClick={() => {
                        handleNavigation(item.id);
                        setMobileOpen(false);
                      }}
                    >
                      <item.icon className="h-5 w-5" />
                      {getNavLabel(item)}
                    </button>
                  ))}
                  <div className="h-px bg-border my-2" />
                  <button
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/5 transition-colors touch-target"
                    onClick={async () => {
                      await signOut();
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      )}
      {companyId && <Omnisearch companyId={companyId} />}
    </div>
  );
}
