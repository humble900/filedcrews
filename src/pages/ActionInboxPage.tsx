import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import SEO from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertTriangle, AlertCircle, Clock, Search, MessageSquare, Briefcase, FileText, User } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function ActionInboxPage() {
  const { company } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "message" | "alert">("all");

  const { data: actionItems = [], isLoading: loadingActions } = useQuery({
    queryKey: ["action_items", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("action_items")
        .select("*")
        .eq("company_id", company.id)
        .eq("resolved", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  const { data: commsLogs = [], isLoading: loadingComms } = useQuery({
    queryKey: ["inbound_comms", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("communications_log")
        .select(`
          *,
          customers(first_name, last_name, phone)
        `)
        .eq("tenant_id", company.id)
        .eq("direction", "inbound")
        .eq("status", "received") // unread state could be mapped to "received"
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  const resolveActionItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("action_items")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Action item resolved");
      queryClient.invalidateQueries({ queryKey: ["action_items", company?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to resolve item");
    }
  });

  const markCommReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("communications_log")
        .update({ status: "delivered" }) // mapping delivered as 'read'
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message marked as read");
      queryClient.invalidateQueries({ queryKey: ["inbound_comms", company?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update message");
    }
  });

  // Normalize into a single feed
  const unifiedFeed = [
    ...actionItems.map((a: any) => ({
      type: 'alert',
      id: a.id,
      title: a.title,
      description: a.description,
      severity: a.severity,
      created_at: a.created_at,
      raw: a
    })),
    ...commsLogs.map((c: any) => ({
      type: 'message',
      id: c.id,
      title: `New ${c.channel.toUpperCase()} from ${c.customers?.first_name || 'Customer'}`,
      description: c.content,
      severity: 'Medium',
      created_at: c.created_at,
      raw: c
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredFeed = unifiedFeed.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical": return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400";
      case "high": return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400";
      case "medium": return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400";
      default: return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical": return <AlertTriangle className="h-4 w-4" />;
      case "high": return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout activeTab="inbox" companyName={company?.name || ""} companyPrefix={company?.prefix || ""} companyId={company?.id || ""}>
      <SEO title="Action Inbox" />
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Action Inbox</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
              Your operational to-do list. Resolve alerts and reply to customers.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search inbox..." 
                className="pl-9 bg-white dark:bg-slate-900 border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl overflow-x-auto w-fit">
          <button 
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${filterType === "all" ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
          >
            All Items ({unifiedFeed.length})
          </button>
          <button 
            onClick={() => setFilterType("alert")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${filterType === "alert" ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
          >
            System Alerts ({actionItems.length})
          </button>
          <button 
            onClick={() => setFilterType("message")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${filterType === "message" ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
          >
            Unread Messages ({commsLogs.length})
          </button>
        </div>

        {/* Inbox Feed */}
        <div className="space-y-3">
          {(loadingActions || loadingComms) ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredFeed.length === 0 ? (
            <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Inbox Zero!</h3>
              <p className="text-slate-500 mt-1 max-w-sm mx-auto">You're all caught up. No pending action items or unread messages.</p>
            </div>
          ) : (
            filteredFeed.map((item) => (
              <Card key={item.id} className="border-border/50 hover:border-primary/20 transition-all duration-200 group bg-white dark:bg-slate-950 overflow-hidden relative">
                {/* Visual Indicator Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.type === 'message' ? 'bg-indigo-500' : (item.severity?.toLowerCase() === 'critical' ? 'bg-rose-500' : 'bg-amber-500')}`} />
                
                <CardContent className="p-5 flex flex-col md:flex-row gap-6 md:items-center">
                  <div className="flex-1 space-y-2 pl-3">
                    <div className="flex items-center gap-3">
                      {item.type === 'message' ? (
                        <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> Message
                        </Badge>
                      ) : (
                        <Badge variant="outline" className={`flex items-center gap-1 ${getSeverityColor(item.severity)}`}>
                          {getSeverityIcon(item.severity)} {item.severity} Alert
                        </Badge>
                      )}
                      <span className="text-xs font-semibold text-slate-400">
                        {format(new Date(item.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                    {item.description && (
                      <p className="text-slate-600 dark:text-slate-300 font-medium line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 md:border-l md:border-border/50 md:pl-6">
                    {item.type === 'alert' && item.raw.action_url && (
                      <Button variant="outline" className="w-full md:w-auto border-border/50 shadow-sm font-bold" onClick={() => window.location.href = item.raw.action_url}>
                        View Details
                      </Button>
                    )}
                    {item.type === 'message' && (
                      <Button variant="outline" className="w-full md:w-auto border-border/50 shadow-sm font-bold">
                        Reply
                      </Button>
                    )}
                    <Button 
                      onClick={() => item.type === 'alert' ? resolveActionItemMutation.mutate(item.id) : markCommReadMutation.mutate(item.id)}
                      className="w-full md:w-auto shadow-md font-bold"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" /> Mark Done
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
