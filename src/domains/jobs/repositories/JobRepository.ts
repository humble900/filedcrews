import { supabase } from "@/integrations/supabase/client";

export interface JobEntity {
  id: string;
  companyId: string;
  title: string;
  status: string;
  assignedStaffId?: string;
  createdAt: string;
}

export class JobRepository {
  static async findById(id: string): Promise<JobEntity | null> {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      companyId: data.company_id,
      title: data.title,
      status: data.status,
      assignedStaffId: data.assigned_staff_id,
      createdAt: data.created_at,
    };
  }

  static async findByCompany(companyId: string): Promise<JobEntity[]> {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("company_id", companyId);

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      companyId: d.company_id,
      title: d.title,
      status: d.status,
      assignedStaffId: d.assigned_staff_id,
      createdAt: d.created_at,
    }));
  }

  static async updateStatus(id: string, status: string): Promise<boolean> {
    const { error } = await supabase
      .from("jobs")
      .update({ status })
      .eq("id", id);

    return !error;
  }
}
