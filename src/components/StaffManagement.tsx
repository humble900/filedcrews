import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const StaffManagement = () => {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

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
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin_create_staff", {
        body: { username, password, full_name: fullName },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Staff "${fullName}" created`);
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
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-56"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Username</label>
              <Input
                placeholder="e.g. johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-48"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-48"
                required
              />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create Staff"}
            </Button>
          </form>
        </CardContent>
      </Card>

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
                <div key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className={`font-medium ${!s.is_active ? "text-muted-foreground" : ""}`}>{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Username: <span className="font-mono">@{s.username}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      Joined {format(new Date(s.created_at), "MMM d, yyyy")}
                    </span>
                    <div className="flex items-center gap-2">
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
