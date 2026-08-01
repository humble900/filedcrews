import { supabase } from "@/integrations/supabase/client";

export interface InvoiceEntity {
  id: string;
  companyId: string;
  jobId?: string;
  amount: number;
  status: string;
  dueDate?: string;
  createdAt: string;
}

export class BillingRepository {
  static async findById(id: string): Promise<InvoiceEntity | null> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      companyId: data.company_id,
      jobId: data.job_id,
      amount: data.amount ?? 0,
      status: data.status,
      dueDate: data.due_date,
      createdAt: data.created_at,
    };
  }

  static async findByCompany(companyId: string): Promise<InvoiceEntity[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("company_id", companyId);

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      companyId: d.company_id,
      jobId: d.job_id,
      amount: d.amount ?? 0,
      status: d.status,
      dueDate: d.due_date,
      createdAt: d.created_at,
    }));
  }

  static async updateStatus(id: string, status: string): Promise<boolean> {
    const { error } = await supabase
      .from("invoices")
      .update({ status })
      .eq("id", id);

    return !error;
  }
}
