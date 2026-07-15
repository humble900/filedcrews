import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import SEO from "@/components/SEO";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  FileCheck,
  Plus,
  Trash2,
  ListTodo,
  CheckCircle,
  Eye,
  Wrench,
} from "lucide-react";
import { format } from "date-fns";

// ─── Interfaces ─────────────────────────────────────────────────────
interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  schema: { label: string; type: "checkbox" | "text" | "number" }[];
  is_required: boolean;
  created_at: string;
}

interface FormResponse {
  id: string;
  template_id: string;
  job_id: string;
  submitted_by: string;
  data: Record<string, any>;
  submitted_at: string;
  template?: FormTemplate;
  staff?: { name: string };
  job?: { title: string };
}

export default function CompliancePage() {
  const { company, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);

  // Form states - Template Builder
  const [tplName, setTplName] = useState("");
  const [tplDesc, setTplDesc] = useState("");
  const [tplFields, setTplFields] = useState<{ label: string; type: "checkbox" | "text" | "number" }[]>([
    { label: "Check condenser coil cleanliness", type: "checkbox" }
  ]);
  const [tplRequired, setTplRequired] = useState(true);

  // 1. Fetch Form Templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["form_templates", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .eq("company_id", company.id)
        .order("name");
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        schema: Array.isArray(t.schema) ? t.schema : []
      })) as FormTemplate[];
    },
    enabled: !!company?.id,
  });

  // 2. Fetch Form Responses
  const { data: responses = [], isLoading: responsesLoading } = useQuery({
    queryKey: ["form_responses", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("form_responses")
        .select(`
          *,
          template:form_templates(*),
          staff:staff_profiles(full_name),
          job:jobs(title)
        `)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        ...r,
        template: r.template ? { ...r.template, schema: Array.isArray(r.template.schema) ? r.template.schema : [] } : undefined,
        staff: r.staff ? { name: r.staff.full_name } : undefined,
        job: r.job ? { title: r.job.title } : undefined,
      })) as FormResponse[];
    },
    enabled: !!company?.id,
  });

  // ─── Mutations ───────────────────────────────────────────────────
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) throw new Error("No company linked");
      if (!tplName.trim()) throw new Error("Template name is required");

      const { error } = await supabase.from("form_templates").insert({
        company_id: company.id,
        name: tplName.trim(),
        description: tplDesc.trim() || null,
        schema: tplFields,
        is_required: tplRequired
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form_templates", company?.id] });
      toast({ title: "Checklist template created" });
      setTemplateDialogOpen(false);
      setTplName("");
      setTplDesc("");
      setTplFields([{ label: "Check condenser coil cleanliness", type: "checkbox" }]);
    },
    onError: (err: any) => {
      toast({ title: "Error creating template", description: err.message, variant: "destructive" });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("form_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form_templates", company?.id] });
      toast({ title: "Template deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Error deleting template", description: err.message, variant: "destructive" });
    }
  });

  const addField = () => {
    setTplFields([...tplFields, { label: "", type: "checkbox" }]);
  };

  const removeField = (index: number) => {
    setTplFields(tplFields.filter((_, i) => i !== index));
  };

  const updateFieldLabel = (index: number, val: string) => {
    const updated = [...tplFields];
    updated[index].label = val;
    setTplFields(updated);
  };

  const updateFieldType = (index: number, val: "checkbox" | "text" | "number") => {
    const updated = [...tplFields];
    updated[index].type = val;
    setTplFields(updated);
  };

  if (authLoading || templatesLoading || responsesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Checklists & Safety Compliance"
        description="Office checklist registry, dynamic form builders, and safety reporting verification."
        path="/compliance"
        noIndex
      />
      <DashboardLayout
        activeTab="compliance"
        companyName={company?.name || ""}
        companyPrefix={company?.prefix || ""}
        companyId={company?.id || ""}
      >
        <div className="p-3 sm:p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <FileCheck className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Compliance & Checklists
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Construct mandatory checklists and inspect job safety sheets submitted by techs.
              </p>
            </div>
            <Button onClick={() => setTemplateDialogOpen(true)} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Create Checklist
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Checklist Templates */}
            <Card className="border-border/50 card-shadow-md lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" /> Active Templates
                </CardTitle>
                <CardDescription>Form templates technicians must fill out on site.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {templates.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No checklists built yet.</p>
                ) : (
                  templates.map((tpl) => (
                    <div key={tpl.id} className="p-3 border border-border/40 rounded-lg bg-muted/10 flex items-center justify-between group">
                      <div>
                        <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          {tpl.name}
                          {tpl.is_required && (
                            <Badge className="bg-red-500/10 text-red-600 border-red-200 text-[9px] py-0 px-1">Required</Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {tpl.schema.length} fields · Created {format(new Date(tpl.created_at), "MM/dd/yyyy")}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete template "${tpl.name}"?`)) deleteTemplateMutation.mutate(tpl.id);
                        }}
                        className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Checklist Responses */}
            <Card className="border-border/50 card-shadow-md lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Technician Submissions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Checklist Name</TableHead>
                      <TableHead>Technician</TableHead>
                      <TableHead>Work Order Job</TableHead>
                      <TableHead>Completed Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                          No submissions logged yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      responses.map((res) => (
                        <TableRow key={res.id}>
                          <TableCell className="font-semibold text-slate-800">{res.template?.name}</TableCell>
                          <TableCell>{res.staff?.name}</TableCell>
                          <TableCell className="text-xs">{res.job?.title}</TableCell>
                          <TableCell className="text-xs">
                            {format(new Date(res.submitted_at), "MMM dd, HH:mm")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedResponse(res);
                                setResponseDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Template Builder Dialog */}
        <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
          <DialogContent className="sm:max-w-[450px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" /> Create Checklist Template
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Checklist Name *</label>
                <Input
                  placeholder="e.g. Safety Inspection Checklist"
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Description</label>
                <Input
                  placeholder="Notes for the technician..."
                  value={tplDesc}
                  onChange={(e) => setTplDesc(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tplRequired"
                  checked={tplRequired}
                  onChange={(e) => setTplRequired(e.target.checked)}
                />
                <label htmlFor="tplRequired" className="text-xs font-bold text-slate-700">Require completion before job close</label>
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Checklist Fields</label>
                  <Button variant="outline" size="xs" onClick={addField} className="text-xs font-semibold p-1.5 h-auto">
                    Add Field
                  </Button>
                </div>
                <div className="space-y-3">
                  {tplFields.map((field, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder={`Field #${index + 1} label`}
                        value={field.label}
                        onChange={(e) => updateFieldLabel(index, e.target.value)}
                        className="flex-1 text-xs"
                      />
                      <Select
                        value={field.type}
                        onValueChange={(val: any) => updateFieldType(index, val)}
                      >
                        <SelectTrigger className="w-[120px] text-xs h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                          <SelectItem value="text">Text Response</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => removeField(index)} className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => saveTemplateMutation.mutate()} disabled={saveTemplateMutation.isPending}>
                Save Checklist
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Submission Dialog */}
        <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Inspect Checklist Submission
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b">
                <div>
                  <span className="text-muted-foreground block">Technician</span>
                  <span className="font-bold text-slate-800">{selectedResponse?.staff?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Submitted at</span>
                  <span className="font-bold text-slate-800">
                    {selectedResponse?.submitted_at && format(new Date(selectedResponse.submitted_at), "MM/dd/yyyy HH:mm")}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {selectedResponse?.template?.schema.map((field) => {
                  const val = selectedResponse.data[field.label];
                  return (
                    <div key={field.label} className="flex justify-between border-b pb-2">
                      <span className="font-semibold text-slate-700">{field.label}:</span>
                      <span className="font-mono text-slate-800">
                        {field.type === "checkbox" ? (val ? "✓ Yes" : "✗ No") : (val || "—")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setResponseDialogOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}
