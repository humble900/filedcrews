import { JobRepository, JobEntity } from "../repositories/JobRepository";
import { ServiceResult, ok, fail } from "@/services/types";

export class JobApplicationService {
  static async getJob(id: string): Promise<ServiceResult<JobEntity>> {
    try {
      const job = await JobRepository.findById(id);
      if (!job) return fail("Job not found");
      return ok(job);
    } catch (err: any) {
      return fail(err.message || "Failed to retrieve job");
    }
  }

  static async getCompanyJobs(companyId: string): Promise<ServiceResult<JobEntity[]>> {
    try {
      const jobs = await JobRepository.findByCompany(companyId);
      return ok(jobs);
    } catch (err: any) {
      return fail(err.message || "Failed to list company jobs");
    }
  }

  static async changeStatus(id: string, status: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await JobRepository.updateStatus(id, status);
      if (!success) return fail("Failed to update status");
      return ok(true);
    } catch (err: any) {
      return fail(err.message || "Error changing job status");
    }
  }
}
