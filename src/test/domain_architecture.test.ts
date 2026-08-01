import { describe, it, expect, vi } from "vitest";
import { JobApplicationService } from "@/domains/jobs/services/JobApplicationService";
import { CustomerApplicationService } from "@/domains/customers/services/CustomerApplicationService";
import { InventoryApplicationService } from "@/domains/inventory/services/InventoryApplicationService";
import { BillingApplicationService } from "@/domains/billing/services/BillingApplicationService";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockImplementation((table: string) => ({
      select: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation((col: string, val: string) => ({
          single: vi.fn().mockImplementation(async () => {
            if (table === "jobs" && val === "job-101") {
              return { data: { id: "job-101", company_id: "comp-1", title: "Pipe Repair", status: "open", created_at: "2026-01-01" }, error: null };
            }
            if (table === "customers" && val === "cust-101") {
              return { data: { id: "cust-101", company_id: "comp-1", name: "Acme Corp", email: "info@acme.com", created_at: "2026-01-01" }, error: null };
            }
            if (table === "parts_inventory" && val === "item-101") {
              return { data: { id: "item-101", company_id: "comp-1", name: "Filter 10-Inch", quantity: 50, min_quantity: 10, unit_price: 15.5, created_at: "2026-01-01" }, error: null };
            }
            if (table === "invoices" && val === "inv-101") {
              return { data: { id: "inv-101", company_id: "comp-1", amount: 450, status: "unpaid", created_at: "2026-01-01" }, error: null };
            }
            return { data: null, error: { message: "Not found" } };
          }),
        })),
      })),
      insert: vi.fn().mockImplementation((payload: any) => ({
        select: vi.fn().mockImplementation(() => ({
          single: vi.fn().mockImplementation(async () => ({
            data: { id: "new-id-123", ...payload, created_at: "2026-01-01" },
            error: null,
          })),
        })),
      })),
      update: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation(async () => ({ error: null })),
      })),
    })),
  },
}));

describe("Domain-Driven Application Services Architecture", () => {
  it("JobApplicationService retrieves jobs using repository pattern", async () => {
    const res = await JobApplicationService.getJob("job-101");
    expect(res.success).toBe(true);
    expect(res.data?.title).toBe("Pipe Repair");
  });

  it("CustomerApplicationService enforces customer creation validation", async () => {
    const invalidRes = await CustomerApplicationService.createCustomer({
      companyId: "comp-1",
      name: "   ",
    });
    expect(invalidRes.success).toBe(false);
    expect(invalidRes.error).toBe("Customer name is required");

    const validRes = await CustomerApplicationService.createCustomer({
      companyId: "comp-1",
      name: "Apex Industries",
      email: "contact@apex.com",
    });
    expect(validRes.success).toBe(true);
    expect(validRes.data?.name).toBe("Apex Industries");
  });

  it("InventoryApplicationService prevents negative inventory quantity adjustments", async () => {
    const res = await InventoryApplicationService.adjustStock("item-101", -5);
    expect(res.success).toBe(false);
    expect(res.error).toBe("Inventory quantity cannot be negative");

    const validRes = await InventoryApplicationService.adjustStock("item-101", 20);
    expect(validRes.success).toBe(true);
  });

  it("BillingApplicationService handles invoice retrieval", async () => {
    const res = await BillingApplicationService.getInvoice("inv-101");
    expect(res.success).toBe(true);
    expect(res.data?.amount).toBe(450);
  });
});
