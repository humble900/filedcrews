import { ReactNode, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MapPin, Users, Circle, Smartphone, LogOut, Menu, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  companyName: string;
  companyPrefix: string;
  geofenceEditing?: boolean;
}

const navItems = [
  { id: "map", label: "Live Map", icon: MapPin },
  { id: "geofences", label: "Geofences", icon: Circle },
  { id: "staff", label: "Staff", icon: Users },
  { id: "tracker", label: "Tracker", icon: Smartphone },
];

function SidebarContent({
  activeTab,
  onTabChange,
  geofenceEditing,
  onNavigate,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  geofenceEditing?: boolean;
  onNavigate?: () => void;
}) {
  const { signOut } = useAuth();

  return (
    <>
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <MapPin className="h-7 w-7 text-sidebar-primary" />
          <span className="text-lg font-bold">Staff Tracker</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isDisabled = geofenceEditing && item.id !== "geofences";
          return (
            <button
              key={item.id}
              onClick={() => {
                if (isDisabled) return;
                onTabChange(item.id);
                onNavigate?.();
              }}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                isDisabled && "opacity-40 cursor-not-allowed"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={signOut}
          disabled={geofenceEditing}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
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
  geofenceEditing,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-sidebar-primary" />
          <span className="font-bold">Staff Tracker</span>
        </div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground">
            <SidebarContent
              activeTab={activeTab}
              onTabChange={onTabChange}
              geofenceEditing={geofenceEditing}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground flex-col shrink-0">
        <SidebarContent
          activeTab={activeTab}
          onTabChange={onTabChange}
          geofenceEditing={geofenceEditing}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
