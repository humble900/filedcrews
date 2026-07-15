import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, AlertTriangle, CheckCircle, Info, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface NotificationCenterProps {
  companyId: string;
}

interface NotificationItem {
  id: string;
  message: string;
  created_at: string;
  type: "info" | "success" | "warning";
  read: boolean;
}

export default function NotificationCenter({ companyId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    // 1. Fetch initial recent geofence events for the company's staff
    const fetchRecentAlerts = async () => {
      // Get company staff profiles
      const { data: staffData } = await supabase
        .from("staff_profiles")
        .select("id, full_name")
        .eq("company_id", companyId);

      const staffMap = new Map<string, string>();
      staffData?.forEach((s) => staffMap.set(s.id, s.full_name));

      const staffIds = staffData?.map((s) => s.id) || [];
      if (staffIds.length === 0) return;

      const { data: events, error } = await supabase
        .from("geofence_events")
        .select("id, event_type, created_at, face_check_status, staff_id, geofences(name)")
        .in("staff_id", staffIds)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Failed to load notifications:", error);
        return;
      }

      const items: NotificationItem[] = (events as any[]).map((e) => {
        const staffName = staffMap.get(e.staff_id) || "Staff Member";
        const siteName = e.geofences?.name || "Geofence";
        let message = "";
        let type: "info" | "success" | "warning" = "info";

        if (e.face_check_status === "mismatch") {
          message = `Face mismatch alert: ${staffName} entered ${siteName}`;
          type = "warning";
        } else if (e.event_type === "entered" || e.event_type === "logged_in_inside") {
          message = `${staffName} checked into ${siteName}`;
          type = "success";
        } else {
          message = `${staffName} exited ${siteName}`;
          type = "info";
        }

        return {
          id: e.id,
          message,
          created_at: e.created_at,
          type,
          read: true, // initial load marked as read
        };
      });

      setNotifications(items);
    };

    fetchRecentAlerts();

    // 2. Set up realtime listener for new geofence events
    const channel = supabase
      .channel("company_realtime_events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "geofence_events",
        },
        async (payload) => {
          // Verify if staff belongs to company
          const { data: staff } = await supabase
            .from("staff_profiles")
            .select("full_name, company_id")
            .eq("id", payload.new.staff_id)
            .single();

          if (!staff || staff.company_id !== companyId) return;

          // Fetch geofence name
          const { data: gf } = await supabase
            .from("geofences")
            .select("name")
            .eq("id", payload.new.geofence_id)
            .single();

          const staffName = staff.full_name;
          const siteName = gf?.name || "Geofence";
          let message = "";
          let type: "info" | "success" | "warning" = "info";

          if (payload.new.face_check_status === "mismatch") {
            message = `Face mismatch alert: ${staffName} entered ${siteName}`;
            type = "warning";
            toast.error(message, {
              description: "AI detected a selfie mismatch on entry. Please review.",
              duration: 8000,
            });
          } else if (payload.new.event_type === "entered" || payload.new.event_type === "logged_in_inside") {
            message = `${staffName} checked into ${siteName}`;
            type = "success";
            toast.success(message);
          } else {
            message = `${staffName} exited ${siteName}`;
            type = "info";
            toast.info(message);
          }

          const newItem: NotificationItem = {
            id: payload.new.id,
            message,
            created_at: payload.new.created_at,
            type,
            read: false,
          };

          setNotifications((prev) => [newItem, ...prev.slice(0, 14)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: "info" | "success" | "warning") => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-sidebar-foreground/80 hover:text-sidebar-foreground">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border-border/50 card-shadow-lg z-50 mr-4" align="end">
        <div className="flex items-center justify-between border-b p-3 bg-muted/40">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-primary" />
            Alerts & Notifications
          </span>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[10px] font-semibold text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No recent alerts or logs.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 flex items-start gap-2.5 hover:bg-muted/10 transition-colors ${
                  !n.read ? "bg-primary/5" : ""
                }`}
              >
                {getIcon(n.type)}
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className={`text-xs text-foreground leading-snug break-words ${!n.read ? "font-bold" : ""}`}>
                    {n.message}
                  </p>
                  <p className="text-[9px] text-muted-foreground font-mono">
                    {format(new Date(n.created_at), "HH:mm:ss · MMM d")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
