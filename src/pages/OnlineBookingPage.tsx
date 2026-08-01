import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Calendar,
  Wrench,
  CheckCircle,
  Building,
  User,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";

export default function OnlineBookingPage() {
  const { prefix } = useParams<{ prefix: string }>();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [leadId, setLeadId] = useState<string | null>(null);

  // Form inputs
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [selectedJobTypeId, setSelectedJobTypeId] = useState("NONE");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingWindow, setBookingWindow] = useState("morning"); // morning, afternoon
  const [bookingNotes, setBookingNotes] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`ob_draft_${prefix}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.leadId) setLeadId(data.leadId);
        if (data.custName) setCustName(data.custName);
        if (data.custEmail) setCustEmail(data.custEmail);
        if (data.custPhone) setCustPhone(data.custPhone);
        if (data.custAddress) setCustAddress(data.custAddress);
        if (data.selectedJobTypeId) setSelectedJobTypeId(data.selectedJobTypeId);
        if (data.bookingDate) setBookingDate(data.bookingDate);
        if (data.bookingWindow) setBookingWindow(data.bookingWindow);
        if (data.bookingNotes) setBookingNotes(data.bookingNotes);
        if (data.step && data.step < 4) setStep(data.step);
      } catch (e) {
        console.warn("Failed to parse booking draft from localStorage", e);
      }
    }
  }, [prefix]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (step === 4) {
      // Clear draft upon successful submission
      localStorage.removeItem(`ob_draft_${prefix}`);
    } else {
      localStorage.setItem(`ob_draft_${prefix}`, JSON.stringify({
        leadId, step, custName, custEmail, custPhone, custAddress, selectedJobTypeId, bookingDate, bookingWindow, bookingNotes
      }));
    }
  }, [prefix, leadId, step, custName, custEmail, custPhone, custAddress, selectedJobTypeId, bookingDate, bookingWindow, bookingNotes]);

  // 1. Fetch Company by Prefix
  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ["booking_company", prefix],
    queryFn: async () => {
      if (!prefix) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, prefix")
        .eq("prefix", prefix)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!prefix,
  });

  // 2. Fetch Job Types for Company
  const { data: jobTypes = [] } = useQuery({
    queryKey: ["booking_job_types", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("job_types")
        .select("*")
        .eq("company_id", company.id)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  const savePartial = async (nextStep: number) => {
    setStep(nextStep);
    if (!company) return;
    try {
      const payload = {
        company_id: company.id,
        customer_name: custName.trim(),
        email: custEmail.trim(),
        phone: custPhone.trim(),
        address: custAddress.trim() || null,
        source: "Website - Partial",
        status: "New",
        job_type_id: selectedJobTypeId === "NONE" ? null : selectedJobTypeId,
        notes: bookingNotes.trim() || null
      };

      if (leadId) {
        await supabase.from("leads").update(payload).eq("id", leadId);
      } else {
        const { data, error } = await supabase.from("leads").insert(payload).select("id").maybeSingle();
        if (data?.id && !error) setLeadId(data.id);
      }
    } catch (e) {
      console.warn("Partial save failed", e);
    }
  };

  // 3. Mutation to Submit Lead
  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!company) throw new Error("No company active");
      if (!custName.trim() || !custEmail.trim() || !custPhone.trim()) {
        throw new Error("Contact info is required");
      }

      const notesPayload = `
Requested Date: ${bookingDate} (${bookingWindow})
Problem Details: ${bookingNotes.trim()}
      `.trim();

      const payload = {
        company_id: company.id,
        customer_name: custName.trim(),
        email: custEmail.trim(),
        phone: custPhone.trim(),
        address: custAddress.trim() || null,
        notes: notesPayload,
        source: "Website",
        status: "New",
        job_type_id: selectedJobTypeId === "NONE" ? null : selectedJobTypeId,
      };

      if (leadId) {
        const { error } = await supabase.from("leads").update(payload).eq("id", leadId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("leads").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setStep(4);
      setLeadId(null);
      toast({ title: "Booking Received", description: "Your service appointment request is queued." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to book slot", description: err.message, variant: "destructive" });
    },
  });

  if (loadingCompany) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <Card className="max-w-[400px] text-center bg-slate-950 border-slate-800 text-white p-6 space-y-4">
          <CardTitle className="text-xl font-bold text-red-500">Company Not Found</CardTitle>
          <CardDescription className="text-sm text-slate-400">
            The link you followed does not resolve to an active contractor workspace.
          </CardDescription>
          <Link to="/">
            <Button className="w-full bg-primary">Back to Homepage</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`Book Online Service - ${company.name}`}
        description="Book local residential service calls, check technicians availability slots, and get instant quotes confirmations."
        path={`/book/${company.prefix}`}
        noIndex
      />

      <div className={`min-h-screen text-white flex flex-col font-sans ${isEmbed ? 'bg-transparent' : 'bg-slate-900'}`}>
        {!isEmbed && (
          <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
            <div className="max-w-[800px] mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Building className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight leading-none">{company.name}</h1>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Online Booking Center</span>
                </div>
              </div>
            </div>
          </header>
        )}

        <main className={`flex-1 max-w-[500px] w-full mx-auto px-4 flex flex-col justify-center ${isEmbed ? 'py-2' : 'py-8'}`}>
          <Card className="bg-slate-950 border-slate-800/80 card-shadow-md text-white">
            <CardHeader className="border-b border-slate-800/60 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {step === 4 ? "Booking Confirmed" : `Schedule Appointment (Step ${step} of 3)`}
              </CardTitle>
            </CardHeader>

            {/* Step 1: Contact Details */}
            {step === 1 && (
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold block">Full Name *</label>
                  <Input
                    placeholder="e.g. Alice Smith"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-white focus-visible:ring-primary h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold block">Phone Number *</label>
                  <Input
                    type="tel"
                    placeholder="e.g. 512-555-0188"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-white focus-visible:ring-primary h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold block">Email Address *</label>
                  <Input
                    type="email"
                    placeholder="alice.smith@example.com"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-white focus-visible:ring-primary h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold block">Service Location Address</label>
                  <Input
                    placeholder="e.g. 123 Maple Street, Austin TX"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-white focus-visible:ring-primary h-10"
                  />
                </div>
                <Button
                  onClick={() => {
                    if (!custName.trim() || !custEmail.trim() || !custPhone.trim()) {
                      toast({ title: "Error", description: "Name, email, and phone are required.", variant: "destructive" });
                      return;
                    }
                    savePartial(2);
                  }}
                  className="w-full h-11 bg-primary hover:bg-primary/95 text-white font-bold gap-2 mt-2"
                >
                  Next: Select Service <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            )}

            {/* Step 2: Service details */}
            {step === 2 && (
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold block">What service line do you need? *</label>
                  <Select
                    value={selectedJobTypeId}
                    onValueChange={(val: any) => setSelectedJobTypeId(val)}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-800 text-white h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="NONE">General Maintenance / Diagnosis</SelectItem>
                      {jobTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold block">Describe the issue / notes</label>
                  <Textarea
                    placeholder="Describe what is broken, noises it's making, or details for the technician..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    rows={4}
                    className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 text-slate-400 hover:text-white">
                    Back
                  </Button>
                  <Button
                    onClick={() => savePartial(3)}
                    className="flex-1 bg-primary hover:bg-primary/95 text-white font-bold gap-2"
                  >
                    Next: Choose Date <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            )}

            {/* Step 3: Date & Window slot */}
            {step === 3 && (
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold block">Preferred Service Date *</label>
                  <Input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-white h-10"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold block">Arrival Window Option *</label>
                  <Select
                    value={bookingWindow}
                    onValueChange={(val: any) => setBookingWindow(val)}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-800 text-white h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="morning">Morning (8:00 AM - 12:00 PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (1:00 PM - 5:00 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="ghost" onClick={() => setStep(2)} className="flex-1 text-slate-400 hover:text-white">
                    Back
                  </Button>
                  <Button
                    onClick={() => createBookingMutation.mutate()}
                    disabled={createBookingMutation.isPending || !bookingDate}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    {createBookingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Confirm Booking
                  </Button>
                </div>
              </CardContent>
            )}

            {/* Step 4: Success confirmation */}
            {step === 4 && (
              <CardContent className="space-y-4 pt-6 text-center">
                <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-white">Appointment Scheduled!</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Thank you, {custName}. We've received your booking slot request for {bookingDate} ({bookingWindow}). Our service dispatchers will verify availability and assign a technician to your route.
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      setStep(1);
                      setCustName("");
                      setCustEmail("");
                      setCustPhone("");
                      setCustAddress("");
                      setBookingDate("");
                      setBookingNotes("");
                      setLeadId(null);
                    }}
                    className="w-full bg-slate-850 hover:bg-slate-800 text-white border border-slate-800"
                  >
                    Book Another Service
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </main>
      </div>
    </>
  );
}
