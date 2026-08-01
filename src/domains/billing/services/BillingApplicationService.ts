import { BillingRepository, InvoiceEntity } from "../repositories/BillingRepository";
import { ServiceResult, ok, fail } from "@/services/types";

export class BillingApplicationService {
  static async getInvoice(id: string): Promise<ServiceResult<InvoiceEntity>> {
    try {
      const invoice = await BillingRepository.findById(id);
      if (!invoice) return fail("Invoice not found");
      return ok(invoice);
    } catch (err: any) {
      return fail(err.message || "Failed to retrieve invoice");
    }
  }

  static async getCompanyInvoices(companyId: string): Promise<ServiceResult<InvoiceEntity[]>> {
    try {
      const invoices = await BillingRepository.findByCompany(companyId);
      return ok(invoices);
    } catch (err: any) {
      return fail(err.message || "Failed to list invoices");
    }
  }

  static async updateInvoiceStatus(id: string, status: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await BillingRepository.updateStatus(id, status);
      if (!success) return fail("Failed to update invoice status");
      return ok(true);
    } catch (err: any) {
      return fail(err.message || "Error updating invoice status");
    }
  }
}
