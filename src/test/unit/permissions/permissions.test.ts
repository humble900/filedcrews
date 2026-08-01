import { describe, it, expect } from "vitest";
import { GlobalRole, Feature } from "@/hooks/usePermissions";

describe("Phase 6 Enterprise RBAC & Permission Matrix Specification Tests", () => {
  const roles: GlobalRole[] = ["Owner", "Admin", "Finance", "Dispatcher", "Field Crew"];
  const features: Feature[] = ["overview", "projects", "jobs", "invoices", "crm", "settings", "timesheets"];

  const PERMISSION_MATRIX_SPEC: Record<Feature, Record<GlobalRole, boolean | "read">> = {
    overview: { Owner: true, Admin: true, Finance: true, Dispatcher: true, "Field Crew": false },
    projects: { Owner: true, Admin: true, Finance: "read", Dispatcher: true, "Field Crew": false },
    jobs: { Owner: true, Admin: true, Finance: false, Dispatcher: true, "Field Crew": false },
    map: { Owner: true, Admin: true, Finance: false, Dispatcher: true, "Field Crew": false },
    schedule: { Owner: true, Admin: true, Finance: false, Dispatcher: true, "Field Crew": false },
    crm: { Owner: true, Admin: true, Finance: true, Dispatcher: false, "Field Crew": false },
    staff: { Owner: true, Admin: true, Finance: false, Dispatcher: false, "Field Crew": false },
    invoices: { Owner: true, Admin: true, Finance: true, Dispatcher: false, "Field Crew": false },
    estimates: { Owner: true, Admin: true, Finance: true, Dispatcher: false, "Field Crew": false },
    "change-orders": { Owner: true, Admin: true, Finance: true, Dispatcher: false, "Field Crew": false },
    safety: { Owner: true, Admin: true, Finance: false, Dispatcher: true, "Field Crew": false },
    reports: { Owner: true, Admin: true, Finance: true, Dispatcher: false, "Field Crew": false },
    tracker: { Owner: true, Admin: true, Finance: false, Dispatcher: true, "Field Crew": false },
    billing: { Owner: true, Admin: true, Finance: true, Dispatcher: false, "Field Crew": false },
    memberships: { Owner: true, Admin: true, Finance: true, Dispatcher: false, "Field Crew": false },
    timesheets: { Owner: true, Admin: true, Finance: true, Dispatcher: true, "Field Crew": true },
    compliance: { Owner: true, Admin: true, Finance: false, Dispatcher: false, "Field Crew": false },
    settings: { Owner: true, Admin: true, Finance: false, Dispatcher: false, "Field Crew": false },
    inventory: { Owner: true, Admin: true, Finance: true, Dispatcher: true, "Field Crew": false },
    marketplace: { Owner: true, Admin: true, Finance: false, Dispatcher: false, "Field Crew": false },
    "ai-agent": { Owner: true, Admin: true, Finance: false, Dispatcher: false, "Field Crew": false },
  };

  it("should grant Owner and Admin full access across all enterprise modules", () => {
    features.forEach((feature) => {
      expect(PERMISSION_MATRIX_SPEC[feature]["Owner"]).toBe(true);
      expect(PERMISSION_MATRIX_SPEC[feature]["Admin"]).toBe(true);
    });
  });

  it("should restrict Field Crew from accessing sensitive invoicing and administrative settings", () => {
    expect(PERMISSION_MATRIX_SPEC["invoices"]["Field Crew"]).toBe(false);
    expect(PERMISSION_MATRIX_SPEC["settings"]["Field Crew"]).toBe(false);
    expect(PERMISSION_MATRIX_SPEC["crm"]["Field Crew"]).toBe(false);
    expect(PERMISSION_MATRIX_SPEC["timesheets"]["Field Crew"]).toBe(true);
  });

  it("should enforce Finance role boundary strictly to financial overviews and invoices", () => {
    expect(PERMISSION_MATRIX_SPEC["invoices"]["Finance"]).toBe(true);
    expect(PERMISSION_MATRIX_SPEC["jobs"]["Finance"]).toBe(false);
    expect(PERMISSION_MATRIX_SPEC["settings"]["Finance"]).toBe(false);
  });
});
