import { CustomerRepository, CustomerEntity } from "../repositories/CustomerRepository";
import { ServiceResult, ok, fail } from "@/services/types";

export class CustomerApplicationService {
  static async getCustomer(id: string): Promise<ServiceResult<CustomerEntity>> {
    try {
      const customer = await CustomerRepository.findById(id);
      if (!customer) return fail("Customer not found");
      return ok(customer);
    } catch (err: any) {
      return fail(err.message || "Failed to retrieve customer");
    }
  }

  static async getCompanyCustomers(companyId: string): Promise<ServiceResult<CustomerEntity[]>> {
    try {
      const customers = await CustomerRepository.findByCompany(companyId);
      return ok(customers);
    } catch (err: any) {
      return fail(err.message || "Failed to list company customers");
    }
  }

  static async createCustomer(
    payload: Omit<CustomerEntity, "id" | "createdAt">
  ): Promise<ServiceResult<CustomerEntity>> {
    try {
      if (!payload.name || payload.name.trim() === "") {
        return fail("Customer name is required");
      }
      const customer = await CustomerRepository.create(payload);
      if (!customer) return fail("Failed to create customer record");
      return ok(customer);
    } catch (err: any) {
      return fail(err.message || "Error creating customer");
    }
  }
}
