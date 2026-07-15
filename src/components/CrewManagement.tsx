import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Trash2,
  UserPlus,
  X,
  Loader2,
  Edit2,
  FolderKanban,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Crew {
  id: string;
  name: string;
  description: string | null;
}

interface CrewMember {
  id: string;
  crew_id: string;
  staff_id: string;
  staff_profiles: {
    id: string;
    full_name: string;
    username: string;
    job_title: string | null;
  } | null;
}

interface StaffProfile {
  id: string;
  full_name: string;
  username: string;
  job_title: string | null;
}

export default function CrewManagement({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const [crewName, setCrewName] = useState("");
  const [crewDesc, setCrewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);

  // Edit Crew State
  const [editingCrew, setEditingCrew] = useState<Crew | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Member select state
  const [selectedStaffId, setSelectedStaffId] = useState("");

  // 1. Fetch Crews
  const { data: crews = [], isLoading: crewsLoading } = useQuery({
    queryKey: ["crews", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crews")
        .select("*")
        .eq("company_id", companyId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Crew[];
    },
  });

  // 2. Fetch all Staff
  const { data: allStaff = [] } = useQuery({
    queryKey: ["staff_profiles_all", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, full_name, username, job_title")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data as StaffProfile[];
    },
  });

  // 3. Fetch members for the selected crew
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["crew_members", selectedCrewId],
    queryFn: async () => {
      if (!selectedCrewId) return [];
      const { data, error } = await supabase
        .from("crew_members")
        .select(`
          id,
          crew_id,
          staff_id,
          staff_profiles:staff_profiles(id, full_name, username, job_title)
        `)
        .eq("crew_id", selectedCrewId);
      if (error) throw error;
      return data as any as CrewMember[];
    },
    enabled: !!selectedCrewId,
  });

  // 4. Create Crew Mutation
  const createCrewMutation = useMutation({
    mutationFn: async () => {
      if (!crewName.trim()) throw new Error("Crew name is required");
      const { error } = await supabase.from("crews").insert({
        company_id: companyId,
        name: crewName.trim(),
        description: crewDesc.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crews", companyId] });
      setCrewName("");
      setCrewDesc("");
      toast.success("Crew created successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create crew");
    },
  });

  // 5. Update Crew Mutation
  const updateCrewMutation = useMutation({
    mutationFn: async () => {
      if (!editingCrew) return;
      const { error } = await supabase
        .from("crews")
        .update({
          name: editName.trim(),
          description: editDesc.trim() || null,
        })
        .eq("id", editingCrew.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crews", companyId] });
      toast.success("Crew details updated");
      setEditingCrew(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update crew");
    },
  });

  // 6. Delete Crew Mutation
  const deleteCrewMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["crews", companyId] });
      if (selectedCrewId === deletedId) setSelectedCrewId(null);
      toast.success("Crew deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete crew");
    },
  });

  // 7. Add Member Mutation
  const addMemberMutation = useMutation({
    mutationFn: async (staffId: string) => {
      if (!selectedCrewId) throw new Error("No crew selected");
      const { error } = await supabase.from("crew_members").insert({
        crew_id: selectedCrewId,
        staff_id: staffId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew_members", selectedCrewId] });
      setSelectedStaffId("");
      toast.success("Crew member added");
    },
    onError: (err: any) => {
      if (err.message?.includes("unique_crew_staff")) {
        toast.error("This staff member is already in the crew.");
      } else {
        toast.error(err.message || "Failed to add member");
      }
    },
  });

  // 8. Remove Member Mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("crew_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew_members", selectedCrewId] });
      toast.success("Crew member removed");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove member");
    },
  });

  // Filter staff that are not yet in the current crew
  const availableStaff = allStaff.filter(
    (s) => !members.some((m) => m.staff_id === s.id)
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Side: Create & Manage list */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Create Crew Group
              </CardTitle>
              <CardDescription>
                Group multiple field crew members to assign them to projects instantly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createCrewMutation.mutate();
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Crew Group Name</label>
                  <Input
                    placeholder="e.g. Electrical Team, Plumbers"
                    value={crewName}
                    onChange={(e) => setCrewName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Description (Optional)</label>
                  <Input
                    placeholder="e.g. Primary worksite electricians"
                    value={crewDesc}
                    onChange={(e) => setCrewDesc(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={createCrewMutation.isPending}
                  className="w-full gap-2"
                >
                  {createCrewMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create Crew
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Crews List */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Available Crews</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {crewsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : crews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No crew groups created yet.
                </p>
              ) : (
                <div className="divide-y divide-border/60">
                  {crews.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCrewId(c.id)}
                      className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                        selectedCrewId === c.id
                          ? "bg-primary/5 border-l-2 border-primary"
                          : "hover:bg-accent/30"
                      }`}
                    >
                      <div className="space-y-0.5 max-w-[70%]">
                        <p className="font-semibold text-sm truncate text-foreground">
                          {c.name}
                        </p>
                        {c.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {c.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCrew(c);
                            setEditName(c.name);
                            setEditDesc(c.description || "");
                          }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this crew group?")) {
                              deleteCrewMutation.mutate(c.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Crew Members Panel */}
        <div className="md:col-span-2">
          {selectedCrewId ? (
            <Card className="border-border/50 shadow-sm h-full">
              <CardHeader className="border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FolderKanban className="h-5 w-5 text-primary" />
                    {crews.find((c) => c.id === selectedCrewId)?.name} Crew
                  </CardTitle>
                  <CardDescription>
                    Manage the members belonging to this crew.
                  </CardDescription>
                </div>
                {/* Add member select */}
                {availableStaff.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedStaffId}
                      onValueChange={(val) => {
                        setSelectedStaffId(val);
                        addMemberMutation.mutate(val);
                      }}
                    >
                      <SelectTrigger className="w-56 text-xs h-9">
                        <SelectValue placeholder="Add member to crew..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStaff.map((s) => (
                          <SelectItem key={s.id} value={s.id} className="text-xs">
                            {s.full_name} (@{s.username}) {s.job_title ? `· ${s.job_title}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    All active staff are in this crew.
                  </span>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                {membersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-xl space-y-2">
                    <UserPlus className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
                    <p className="text-sm font-medium text-foreground">No crew members yet</p>
                    <p className="text-xs text-muted-foreground">
                      Use the dropdown above to add members to this crew.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/20 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {m.staff_profiles?.full_name?.charAt(0) || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate text-foreground">
                              {m.staff_profiles?.full_name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              @{m.staff_profiles?.username}
                              {m.staff_profiles?.job_title && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium text-[9px]">
                                  {m.staff_profiles.job_title}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-500 rounded-full hover:bg-rose-50/50"
                          onClick={() => removeMemberMutation.mutate(m.id)}
                          disabled={removeMemberMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-12 text-center h-full min-h-[300px]">
              <Users className="h-10 w-10 text-muted-foreground opacity-40 mb-3" />
              <p className="font-semibold text-foreground text-sm">No Crew Selected</p>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Select a crew group from the list on the left to manage members.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Crew Dialog Modal */}
      <Dialog open={!!editingCrew} onOpenChange={(open) => !open && setEditingCrew(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Crew Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Crew Group Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCrew(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateCrewMutation.mutate()}
              disabled={updateCrewMutation.isPending}
              className="gap-1.5"
            >
              {updateCrewMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
