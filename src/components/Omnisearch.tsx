import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Briefcase, Building2, ClipboardList, Keyboard, LayoutDashboard, Receipt, ShieldAlert, Users, Award, Clock, FileCheck } from "lucide-react";

interface OmnisearchProps {
  companyId: string;
}

export default function Omnisearch({ companyId }: OmnisearchProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Toggle open on Cmd+K / Ctrl+K and listen for event triggers
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const handleTrigger = () => setOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener("trigger-omnisearch", handleTrigger);

    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("trigger-omnisearch", handleTrigger);
    };
  }, []);

  // 1. Fetch Customers
  const { data: customers = [] } = useQuery({
    queryKey: ["omnisearch_customers", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone")
        .eq("company_id", companyId)
        .limit(20);
      if (error) return [];
      return data;
    },
    enabled: open && !!companyId,
  });

  // 2. Fetch Projects
  const { data: projects = [] } = useQuery({
    queryKey: ["omnisearch_projects", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, ref_number")
        .eq("company_id", companyId)
        .limit(20);
      if (error) return [];
      return data;
    },
    enabled: open && !!companyId,
  });

  // 3. Fetch Jobs
  const { data: jobs = [] } = useQuery({
    queryKey: ["omnisearch_jobs", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, status")
        .limit(20);
      if (error) return [];
      return data;
    },
    enabled: open && !!companyId,
  });

  const handleSelect = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search customers, projects, work orders..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Quick Navigation">
            <CommandItem onSelect={() => handleSelect("/")} className="gap-2">
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              <span>Overview Home</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/projects")} className="gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>Projects Tracker</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/work-orders")} className="gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <span>Work Orders Board</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/crm")} className="gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>CRM & Client Directory</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/staff")} className="gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Staff Profiles</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/invoices")} className="gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span>Invoices Ledger</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/safety")} className="gap-2">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              <span>Safety Hub</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/memberships")} className="gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span>Memberships & Agreements</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/timesheets")} className="gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Timesheets & Payroll</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/compliance")} className="gap-2">
              <FileCheck className="h-4 w-4 text-muted-foreground" />
              <span>Compliance & Checklists</span>
            </CommandItem>
          </CommandGroup>

          {projects.length > 0 && (
            <CommandGroup heading="Projects">
              {projects.map((proj) => (
                <CommandItem
                  key={proj.id}
                  onSelect={() => handleSelect(`/projects/${proj.id}`)}
                  className="gap-2"
                >
                  <Briefcase className="h-4 w-4 text-primary/80" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-foreground">{proj.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{proj.ref_number}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {customers.length > 0 && (
            <CommandGroup heading="Customers">
              {customers.map((cust) => (
                <CommandItem
                  key={cust.id}
                  onSelect={() => handleSelect("/crm")}
                  className="gap-2"
                >
                  <Building2 className="h-4 w-4 text-sky-500/80" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-foreground">{cust.name}</span>
                    {cust.phone && <span className="text-[10px] text-muted-foreground">{cust.phone}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {jobs.length > 0 && (
            <CommandGroup heading="Work Orders">
              {jobs.map((job) => (
                <CommandItem
                  key={job.id}
                  onSelect={() => handleSelect("/work-orders")}
                  className="gap-2"
                >
                  <ClipboardList className="h-4 w-4 text-emerald-500/80" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-foreground">{job.title}</span>
                    <span className="text-[10px] text-muted-foreground">{job.status}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
