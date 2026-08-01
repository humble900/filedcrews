import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, Calendar, Phone, Mail, MapPin, TrendingUp, Users, Wrench, RefreshCw, Trash2, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface LeadsPipelineProps {
  companyId: string;
}

interface Lead {
  id: string;
  company_id: string;
  customer_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  source: string;
  status: string;
  follow_up_date: string | null;
  notes: string | null;
  converted_job_id: string | null;
  assigned_to: string | null;
  estimated_value: number | null;
  job_type_id: string | null;
  created_at: string;
  job_type?: { name: string; color: string } | null;
  assignee?: { full_name: string } | null;
}

const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Won", "Lost"] as const;
const LEAD_SOURCES = ["Google", "Facebook", "Referral", "Direct", "Website", "Campaign"] as const;

export default function LeadsPipeline({ companyId }: LeadsPipelineProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Form states for Lead creation/edit
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [leadSource, setLeadSource] = useState<string>("Direct");
  const [leadStatus, setLeadStatus] = useState<string>("New");
  const [estValue, setEstValue] = useState("");
  const [jobTypeId, setJobTypeId] = useState("NONE");
  const [assignedTo, setAssignedTo] = useState("NONE");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");

  // Convert to Job wizard states
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingJobType, setBookingJobType] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingStartTime, setBookingStartTime] = useState("08:00");
  const [bookingEndTime, setBookingEndTime] = useState("12:00");
  const [bookingDescription, setBookingDescription] = useState("");
  const [bookingAssignedStaff, setBookingAssignedStaff] = useState("NONE");
  const [bookingBusinessUnitId, setBookingBusinessUnitId] = useState<string>("NONE");
  const [campaignId, setCampaignId] = useState("NONE");

  // 1. Fetch Leads
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["leads", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          job_type:job_type_id(name, color),
          assignee:assigned_to(full_name)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[] as Lead[];
    },
    enabled: !!companyId,
  });

  // 2. Fetch Job Types
  const { data: jobTypes = [] } = useQuery({
    queryKey: ["job_types", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_types")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // 3. Fetch Projects for booking linking
  const { data: projects = [] } = useQuery({
    queryKey: ["projects", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("company_id", companyId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch active business units
  const { data: businessUnits = [] } = useQuery({
    queryKey: ["business_units", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_units")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch active campaigns
  const { data: campaignsList = [] } = useQuery({
    queryKey: ["active_campaigns", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // 4. Fetch Staff (Field Crew)
  const { data: staff = [] } = useQuery({
    queryKey: ["staff", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, full_name")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Lead Mutations
  const saveLeadMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (selectedLead) {
        const { error } = await supabase
          .from("leads")
          .update(payload)
          .eq("id", selectedLead.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("leads")
          .insert([{ ...payload, company_id: companyId }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", companyId] });
      setLeadDialogOpen(false);
      setSelectedLead(null);
      toast({
        title: "Success",
        description: selectedLead ? "Lead updated successfully." : "Lead created successfully.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error saving lead",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", companyId] });
      toast({ title: "Success", description: "Lead deleted successfully." });
    },
    onError: (err) => {
      toast({ title: "Error deleting lead", description: err.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", companyId] });
    },
    onError: (err) => {
      toast({ title: "Error updating status", description: err.message, variant: "destructive" });
    },
  });

  const convertToJobMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLead) return;

      // 1. Create or Find Customer
      let customerId = "";
      const { data: existingCust, error: findError } = await supabase
        .from("customers")
        .select("id")
        .eq("company_id", companyId)
        .eq("name", selectedLead.customer_name)
        .maybeSingle();

      if (findError) throw findError;

      if (existingCust) {
        customerId = existingCust.id;
      } else {
        const { data: newCust, error: createError } = await supabase
          .from("customers")
          .insert({
            company_id: companyId,
            name: selectedLead.customer_name,
            email: selectedLead.email,
            phone: selectedLead.phone,
            billing_address: selectedLead.address,
          })
          .select("id")
          .single();

        if (createError) throw createError;
        customerId = newCust.id;
      }

      // 2. Resolve Project (if none selected, find or create default)
      let projId = selectedProjectId;
      if (!projId) {
        if (projects.length > 0) {
          projId = projects[0].id;
        } else {
          // Create default project
          const { data: newProj, error: newProjErr } = await supabase
            .from("projects")
            .insert({
              company_id: companyId,
              name: `${selectedLead.customer_name} - Main Project`,
              status: "Active",
            })
            .select("id")
            .single();
          if (newProjErr) throw newProjErr;
          projId = newProj.id;
        }
      }

      // 3. Create Job
      const startDateTime = `${bookingDate}T${bookingStartTime}:00`;
      const endDateTime = `${bookingDate}T${bookingEndTime}:00`;

      const { data: job, error: jobErr } = await supabase
        .from("jobs")
        .insert({
          project_id: projId,
          customer_id: customerId,
          title: selectedLead.job_type?.name || "Service Job",
          status: "Booked",
          description: bookingDescription || selectedLead.notes,
          scheduled_start: startDateTime,
          scheduled_end: endDateTime,
          job_type_id: bookingJobType === "NONE" ? null : bookingJobType,
          assigned_staff_ids: bookingAssignedStaff === "NONE" ? [] : [bookingAssignedStaff],
          business_unit_id: bookingBusinessUnitId === "NONE" ? null : bookingBusinessUnitId,
        })
        .select("id")
        .single();

      if (jobErr) throw jobErr;

      // 4. Update Lead to Won + Link Job
      const { error: leadUpdateErr } = await supabase
        .from("leads")
        .update({
          status: "Won",
          converted_job_id: job.id,
        })
        .eq("id", selectedLead.id);

      if (leadUpdateErr) throw leadUpdateErr;

      return job.id;
    },
    onSuccess: (jobId) => {
      queryClient.invalidateQueries({ queryKey: ["leads", companyId] });
      queryClient.invalidateQueries({ queryKey: ["jobs", companyId] });
      setBookingDialogOpen(false);
      setBookingStep(1);
      toast({
        title: "Lead Converted!",
        description: "Customer created and job booked successfully.",
      });
    },
    onError: (err) => {
      toast({
        title: "Conversion failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const openLeadDialog = (lead?: Lead) => {
    if (lead) {
      setSelectedLead(lead);
      setCustName(lead.customer_name);
      setCustEmail(lead.email || "");
      setCustPhone(lead.phone || "");
      setCustAddress(lead.address || "");
      setLeadSource(lead.source);
      setLeadStatus(lead.status);
      setEstValue(lead.estimated_value ? String(lead.estimated_value) : "");
      setJobTypeId(lead.job_type_id || "NONE");
      setAssignedTo(lead.assigned_to || "NONE");
      setFollowUpDate(lead.follow_up_date || "");
      setNotes(lead.notes || "");
      setCampaignId(lead.campaign_id || "NONE");
    } else {
      setSelectedLead(null);
      setCustName("");
      setCustEmail("");
      setCustPhone("");
      setCustAddress("");
      setLeadSource("Direct");
      setLeadStatus("New");
      setEstValue("");
      setJobTypeId("NONE");
      setAssignedTo("NONE");
      setFollowUpDate("");
      setNotes("");
      setCampaignId("NONE");
    }
    setLeadDialogOpen(true);
  };

  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      toast({ title: "Validation error", description: "Customer name is required.", variant: "destructive" });
      return;
    }

    const payload = {
      customer_name: custName.trim(),
      email: custEmail.trim() || null,
      phone: custPhone.trim() || null,
      address: custAddress.trim() || null,
      source: leadSource,
      status: leadStatus,
      estimated_value: estValue ? Number(estValue) : null,
      job_type_id: jobTypeId === "NONE" ? null : jobTypeId,
      assigned_to: assignedTo === "NONE" ? null : assignedTo,
      follow_up_date: followUpDate || null,
      notes: notes.trim() || null,
      campaign_id: campaignId === "NONE" ? null : campaignId,
    };

    saveLeadMutation.mutate(payload);
  };

  const startBookingWizard = (lead: Lead) => {
    setSelectedLead(lead);
    setBookingJobType(lead.job_type_id || "NONE");
    setBookingDescription(lead.notes || "");
    setBookingDate(format(new Date(), "yyyy-MM-dd"));
    setBookingAssignedStaff(lead.assigned_to || "NONE");
    setSelectedProjectId(projects[0]?.id || "");
    setBookingStep(1);
    setBookingDialogOpen(true);
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.phone && l.phone.includes(searchQuery)) ||
      (l.notes && l.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Filters & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by customer name or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openLeadDialog()} className="gap-2">
            <Plus className="h-4 w-4" /> Add Lead
          </Button>
        </div>
      </div>

      {/* Kanban Board View */}
      {leadsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex md:grid md:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-none">
          {LEAD_STATUSES.map((status) => {
            const statusLeads = filteredLeads.filter((l) => l.status === status);
            const statusTotalValue = statusLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);

            return (
              <div key={status} className="flex flex-col w-[85vw] sm:w-[320px] md:w-auto shrink-0 snap-center min-w-[270px] bg-muted/30 rounded-xl p-3 border border-border/40">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-tight">{status}</span>
                    <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-semibold text-muted-foreground">
                      {statusLeads.length}
                    </span>
                  </div>
                  {statusTotalValue > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      ${statusTotalValue.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[60vh] scrollbar-hidden">
                  {statusLeads.length === 0 ? (
                    <div className="border border-dashed border-border/60 rounded-lg p-4 text-center text-xs text-muted-foreground/60 italic">
                      No leads
                    </div>
                  ) : (
                    statusLeads.map((lead) => (
                      <Card
                        key={lead.id}
                        onClick={() => openLeadDialog(lead)}
                        className="group relative cursor-pointer border-border/50 hover:border-primary/50 hover:shadow-md transition-all bg-card duration-200"
                      >
                        <CardHeader className="p-3 pb-1">
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                              {lead.customer_name}
                            </span>
                            <Select
                              value={lead.status}
                              onValueChange={(val) => updateStatusMutation.mutate({ id: lead.id, status: val })}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectTrigger className="h-6 w-[80px] text-[10px] px-1 border-none bg-muted/60 hover:bg-muted font-medium">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {LEAD_STATUSES.map((st) => (
                                  <SelectItem key={st} value={st} className="text-xs">
                                    {st}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {lead.job_type && (
                            <span className="text-[10px] font-semibold text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                              {lead.job_type.name}
                            </span>
                          )}
                        </CardHeader>

                        <CardContent className="p-3 pt-1 space-y-2">
                          {lead.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {lead.notes}
                            </p>
                          )}

                          <div className="space-y-1 text-[11px] text-muted-foreground border-t border-border/20 pt-2">
                            {lead.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-muted-foreground/60" />
                                <span>{lead.phone}</span>
                              </div>
                            )}
                            {lead.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3 text-muted-foreground/60" />
                                <span className="truncate">{lead.email}</span>
                              </div>
                            )}
                            {lead.address && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3 text-muted-foreground/60" />
                                <span className="truncate">{lead.address}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-border/10">
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(lead.created_at), "MMM d")}
                            </span>
                            {lead.estimated_value && (
                              <span className="font-mono text-xs font-bold text-foreground">
                                ${lead.estimated_value.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {lead.status !== "Won" && (
                            <Button
                              variant="default"
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                startBookingWizard(lead);
                              }}
                              className="w-full mt-2 gap-1 text-[11px] font-bold py-1 h-7 opacity-90 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/95 text-primary-foreground"
                            >
                              Convert to Job
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Create/Edit Dialog */}
      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{selectedLead ? "Modify Lead Details" : "Create Business Lead"}</DialogTitle>
            <CardDescription>Enter pipeline details. Unbooked leads surface here.</CardDescription>
          </DialogHeader>
          <form onSubmit={handleSaveLead} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <label className="text-[11px] font-semibold text-muted-foreground">Customer Name *</label>
                <Input value={custName} onChange={(e) => setCustName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Contact Phone</label>
                <Input value={custPhone} onChange={(e) => setCustPhone(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Contact Email</label>
                <Input type="email" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-[11px] font-semibold text-muted-foreground">Service Address</label>
                <Input value={custAddress} onChange={(e) => setCustAddress(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Lead Source</label>
                <Select value={leadSource} onValueChange={setLeadSource}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((src) => (
                      <SelectItem key={src} value={src}>{src}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Attributed Campaign</label>
                <Select value={campaignId} onValueChange={setCampaignId}>
                  <SelectTrigger><SelectValue placeholder="Unattributed" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Unattributed</SelectItem>
                    {campaignsList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Pipeline Status</label>
                <Select value={leadStatus} onValueChange={setLeadStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((st) => (
                      <SelectItem key={st} value={st}>{st}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Estimated Job Value ($)</label>
                <Input type="number" placeholder="e.g. 500" value={estValue} onChange={(e) => setEstValue(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Expected Job Type</label>
                <Select value={jobTypeId} onValueChange={setJobTypeId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    {jobTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Assigned Lead Rep</label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Unassigned</SelectItem>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Follow Up Date</label>
                <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-[11px] font-semibold text-muted-foreground">Internal Notes / Requirements</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <div className="flex justify-between w-full">
                {selectedLead ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this lead?")) {
                        deleteLeadMutation.mutate(selectedLead.id);
                        setLeadDialogOpen(false);
                      }
                    }}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : <div />}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setLeadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveLeadMutation.isPending}>
                    {saveLeadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Lead
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Booking Wizard Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Booking Wizard (Step {bookingStep} of 3)
            </DialogTitle>
            <CardDescription>
              Convert lead to a scheduled field job.
            </CardDescription>
          </DialogHeader>

          {bookingStep === 1 && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/40 p-4 rounded-xl space-y-2 border border-border/30">
                <h4 className="font-bold text-sm text-foreground">Customer Profile</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><span className="font-semibold">Name:</span> {selectedLead?.customer_name}</p>
                  <p><span className="font-semibold">Phone:</span> {selectedLead?.phone || "—"}</p>
                  <p><span className="font-semibold">Email:</span> {selectedLead?.email || "—"}</p>
                  <p><span className="font-semibold">Address:</span> {selectedLead?.address || "—"}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">Select Project Workspace *</label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger><SelectValue placeholder="Select or auto-create" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setBookingStep(2)} className="w-full mt-4">
                Next: Schedule Job <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {bookingStep === 2 && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-semibold text-muted-foreground">Expected Work Scope (Job Type)</label>
                  <Select value={bookingJobType} onValueChange={setBookingJobType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">General Service</SelectItem>
                      {jobTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {businessUnits.length > 0 && (
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[11px] font-semibold text-muted-foreground">Corporate Business Unit</label>
                    <Select value={bookingBusinessUnitId} onValueChange={setBookingBusinessUnitId}>
                      <SelectTrigger><SelectValue placeholder="Select business unit" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Unassigned</SelectItem>
                        {businessUnits.map((bu) => (
                          <SelectItem key={bu.id} value={bu.id}>{bu.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-semibold text-muted-foreground">Scheduled Date *</label>
                  <Input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground">Start Time</label>
                  <Input type="time" value={bookingStartTime} onChange={(e) => setBookingStartTime(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground">End Time</label>
                  <Input type="time" value={bookingEndTime} onChange={(e) => setBookingEndTime(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setBookingStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setBookingStep(3)} className="flex-1">
                  Next: Assign Crew
                </Button>
              </div>
            </div>
          )}

          {bookingStep === 3 && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">Dispatch To Crew Member</label>
                <Select value={bookingAssignedStaff} onValueChange={setBookingAssignedStaff}>
                  <SelectTrigger><SelectValue placeholder="Keep Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Unassigned (Send to Dispatch Board)</SelectItem>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">Work Dispatch Instructions</label>
                <Textarea
                  placeholder="Notes for the technician in the field..."
                  value={bookingDescription}
                  onChange={(e) => setBookingDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setBookingStep(2)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => convertToJobMutation.mutate()}
                  disabled={convertToJobMutation.isPending}
                  className="flex-1"
                >
                  {convertToJobMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
