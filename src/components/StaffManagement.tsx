import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3">
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-48"
              required
            />
            <Input
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-56"
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-48"
              required
            />
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
                    <p className="font-medium">{s.full_name}</p>
                    <p className="text-sm text-muted-foreground font-mono">@{s.username}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(s.created_at), "MMM d, yyyy")}
                    </span>
                    <Badge variant={s.is_active ? "default" : "secondary"}>
                      {s.is_active ? "Active" : "Inactive"}
                    </Badge>
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
