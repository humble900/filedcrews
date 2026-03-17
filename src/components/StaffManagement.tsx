import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StaffShiftManager from "./StaffShiftManager";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserPlus, Users, Trash2, Copy, X, CheckCircle, Eye, EyeOff, Bell, BellOff, Send, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import StaffAvatar from "./StaffAvatar";
import StaffPhotoUpload from "./StaffPhotoUpload";

interface CreatedStaff {
  fullName: string;
  username: string;
  password: string;
}

const StaffManagement = ({ companyId, prefix }: { companyId: string; prefix: string }) => {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [lastCreatedStaff, setLastCreatedStaff] = useState<CreatedStaff | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [sendingTestPush, setSendingTestPush] = useState<string | null>(null);
  const [shiftStaff, setShiftStaff] = useState<{ id: string; name: string } | null>(null);

  const { data: staff, refetch } = useQuery({
    queryKey: ["staff_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !fullName || !password) return;
    const fullUsername = `${prefix}${username}`.toUpperCase();
    setCreating(true);
    setLastCreatedStaff(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin_create_staff", {
        body: { username: fullUsername, password, full_name: fullName, company_id: companyId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setLastCreatedStaff({ fullName, username: fullUsername, password });
      setUsername("");
      setFullName("");
      setPassword("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create staff");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (staffId: string) => {
    setDeletingId(staffId);
    try {
      const { data, error } = await supabase.functions.invoke("admin_delete_staff", {
        body: { staff_id: staffId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Staff member deleted");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete staff");
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleSendTestPush = async (staffId: string, staffName: string) => {
    setSendingTestPush(staffId);
    try {
      const { data, error } = await supabase.functions.invoke("send_test_push", {
        body: { staffId },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Failed to send test push");
      toast.success(`Test push sent to ${staffName}`, {
        description: `Expo ticket: ${JSON.stringify(data.expoResponse?.data?.[0]?.id || data.expoResponse)}`,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to send test push");
    } finally {
      setSendingTestPush(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create Staff Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full lg:w-56"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Username</label>
              <div className="flex items-center gap-0">
                <span className="inline-flex h-10 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm font-mono font-medium text-muted-foreground">
                  {prefix}
                </span>
                <Input
                  placeholder="e.g. johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className="w-full lg:w-48 rounded-l-none"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full lg:w-48 pr-9"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={creating} className="w-full sm:w-auto">
              {creating ? "Creating…" : "Create Staff"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {lastCreatedStaff && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">
                    Staff "{lastCreatedStaff.fullName}" created successfully
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Username: <span className="font-mono font-medium text-foreground">@{lastCreatedStaff.username}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Password: <span className="font-mono font-medium text-foreground">{lastCreatedStaff.password}</span>
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => copyToClipboard(lastCreatedStaff.password)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Save this password now — it cannot be retrieved later.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 shrink-0"
                onClick={() => setLastCreatedStaff(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!staff?.length ? (
            <p className="text-muted-foreground text-sm">No staff created yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {staff.map((s) => (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
                   <div className="flex items-center gap-3">
                     <StaffPhotoUpload
                       staffId={s.id}
                       fullName={s.full_name}
                       currentPhotoUrl={(s as any).photo_url}
                       onPhotoUpdated={refetch}
                     />
                     <div>
                       <p className={`font-medium ${!s.is_active ? "text-muted-foreground" : ""}`}>{s.full_name}</p>
                       <p className="text-xs text-muted-foreground">
                         Username: <span className="font-mono">@{s.username}</span>
                       </p>
                     </div>
                   </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      Joined {format(new Date(s.created_at), "MMM d, yyyy")}
                    </span>
                     <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setShiftStaff({ id: s.id, name: s.full_name })}
                        title="Manage shifts"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              {(s as any).expo_push_token ? (
                                <Bell className="h-4 w-4 text-green-500" />
                              ) : (
                                <BellOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {(s as any).expo_push_token
                              ? `Push token: ${((s as any).expo_push_token as string).substring(0, 30)}...`
                              : "No push token registered"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {(s as any).expo_push_token && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={sendingTestPush === s.id}
                          onClick={() => handleSendTestPush(s.id, s.full_name)}
                          title="Send test face verification push"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                       <Switch
                        checked={s.is_active}
                        onCheckedChange={async (checked) => {
                          const { error } = await supabase
                            .from("staff_profiles")
                            .update({ is_active: checked })
                            .eq("id", s.id);
                          if (error) {
                            toast.error("Failed to update staff status");
                          } else {
                            toast.success(`${s.full_name} ${checked ? "activated" : "deactivated"}`);
                            refetch();
                          }
                        }}
                      />
                      <Badge variant={s.is_active ? "default" : "secondary"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {s.full_name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this staff member, their location history, and all related data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={deletingId === s.id}
                              onClick={() => handleDelete(s.id)}
                            >
                              {deletingId === s.id ? "Deleting…" : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffManagement;
