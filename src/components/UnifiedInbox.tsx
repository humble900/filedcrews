import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Send, PhoneCall, Mail, MessageSquare, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface UnifiedInboxProps {
  customerId: string;
  jobId?: string;
}

export const UnifiedInbox = ({ customerId, jobId }: UnifiedInboxProps) => {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [channelOverride, setChannelOverride] = useState<string>("auto");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch communications
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["communications", customerId, jobId],
    queryFn: async () => {
      let query = supabase
        .from("communications_log")
        .select(`
          *,
          staff_profiles (full_name)
        `)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: true });

      if (jobId) {
        query = query.eq("job_id", jobId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000, // Poll every 5s for new inbound messages
  });

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!newMessage.trim()) return;

      const payload: any = {
        customer_id: customerId,
        content: newMessage.trim(),
      };
      if (jobId) payload.job_id = jobId;
      if (channelOverride !== "auto") payload.channel_override = channelOverride;

      const { data, error } = await supabase.functions.invoke("communication_hub", {
        body: payload,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["communications", customerId] });
      toast.success("Message sent");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send message");
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageMutation.mutate();
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="h-3 w-3" />;
      case "sms": return <MessageSquare className="h-3 w-3" />;
      case "whatsapp": return <MessageSquare className="h-3 w-3 text-green-500" />;
      case "phone": return <PhoneCall className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  return (
    <Card className="h-[500px] flex flex-col bg-slate-950/50 border-slate-800">
      <CardHeader className="py-3 px-4 border-b border-slate-800 bg-slate-900/50">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-400" />
            Unified Inbox
          </span>
          <Select value={channelOverride} onValueChange={setChannelOverride}>
            <SelectTrigger className="h-7 w-[130px] text-xs bg-slate-800 border-slate-700">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (Preferred)</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="phone">Voice AI Call</SelectItem>
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden flex flex-col relative">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <MessageSquare className="h-8 w-8 opacity-20" />
              <p className="text-xs">No communications yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg: any) => {
                const isOutbound = msg.direction === "outbound";
                return (
                  <div key={msg.id} className={cn("flex flex-col", isOutbound ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                      {!isOutbound && getChannelIcon(msg.channel)}
                      <span>
                        {isOutbound ? (msg.staff_profiles?.full_name || "System") : "Customer"}
                      </span>
                      {isOutbound && getChannelIcon(msg.channel)}
                    </div>
                    
                    <div 
                      className={cn(
                        "px-3 py-2 rounded-xl text-sm max-w-[80%]",
                        isOutbound 
                          ? "bg-blue-600/20 text-blue-100 border border-blue-500/30 rounded-tr-sm" 
                          : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm"
                      )}
                    >
                      {msg.content}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[9px] text-slate-600">
                        {format(new Date(msg.created_at), "h:mm a")}
                      </span>
                      {isOutbound && (
                        <span className={cn(
                          "text-[9px] font-medium uppercase",
                          msg.status === "delivered" ? "text-emerald-500" :
                          msg.status === "failed" ? "text-rose-500" :
                          "text-slate-500"
                        )}>
                          {msg.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <form 
          onSubmit={handleSend}
          className="p-3 border-t border-slate-800 bg-slate-900/50 flex items-end gap-2"
        >
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="bg-slate-950 border-slate-700 h-9"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-9 w-9 shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={sendMessageMutation.isPending || !newMessage.trim()}
          >
            {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
