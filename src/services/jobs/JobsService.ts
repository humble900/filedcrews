import { supabase } from "@/integrations/supabase/client";
import { ServiceResult, ok, fail } from "../types";

export interface Job {
  id: string;
  company_id: string;
  project_id?: string | null;
  title: string;
  description?: string | null;
  status: "Lead" | "Booked" | "Scheduled" | "Dispatched" | "In Progress" | "Completed" | "Invoiced" | "Paid" | "Cancelled";
  priority?: "Low" | "Medium" | "High" | "Urgent" | null;
  assigned_staff_id?: string | null;
  scheduled_date?: string | null;
  created_at?: string;
}

export class JobsService {
  /**
   * List jobs for a company with optional filters
   */
  static async listJobs(
    companyId: string,
    filters?: { projectId?: string; status?: string; staffId?: string }
  ): Promise<ServiceResult<Job[]>> {
    try {
      let query = supabase
        .from("jobs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (filters?.projectId) query = query.eq("project_id", filters.projectId);
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.staffId) query = query.eq("assigned_staff_id", filters.staffId);

      const { data, error } = await query;
      if (error) return fail(error.message);
      return ok(data as Job[]);
    } catch (err: any) {
      return fail(err.message || "Failed to fetch jobs");
    }
  }

  /**
   * Get a job by ID
   */
  static async getJobById(jobId: string): Promise<ServiceResult<Job>> {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error) return fail(error.message);
      return ok(data as Job);
    } catch (err: any) {
      return fail(err.message || "Failed to fetch job");
    }
  }

  /**
   * Create a new work order (job)
   */
  static async createJob(payload: Omit<Job, "id" | "created_at">): Promise<ServiceResult<Job>> {
    try {
      if (!payload.title || !payload.company_id) {
        return fail("Job title and company_id are required.");
      }

      const { data, error } = await supabase
        .from("jobs")
        .insert({
          company_id: payload.company_id,
          project_id: payload.project_id || null,
          title: payload.title,
          description: payload.description || null,
          status: payload.status || "Lead",
          priority: payload.priority || "Medium",
          assigned_staff_id: payload.assigned_staff_id || null,
          scheduled_date: payload.scheduled_date || null,
        })
        .select("*")
        .single();

      if (error) return fail(error.message);
      return ok(data as Job);
    } catch (err: any) {
      return fail(err.message || "Failed to create job");
    }
  }

  /**
   * Update work order status
   */
  static async updateJobStatus(
    jobId: string,
    status: Job["status"]
  ): Promise<ServiceResult<Job>> {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .update({ status })
        .eq("id", jobId)
        .select("*")
        .single();

      if (error) return fail(error.message);
      return ok(data as Job);
    } catch (err: any) {
      return fail(err.message || "Failed to update job status");
    }
  }
}
