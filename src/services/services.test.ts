import { describe, it, expect } from "vitest";
import { ok, fail } from "./types";

describe("Application Service Layer Response Governance", () => {
  it("should return predictable ok ServiceResult objects", () => {
    const res = ok({ id: "job-123", title: "HVAC Repair" });
    expect(res.success).toBe(true);
    expect(res.error).toBeNull();
    expect(res.data?.id).toBe("job-123");
  });

  it("should return predictable fail ServiceResult objects", () => {
    const res = fail<null>("Company ID is required");
    expect(res.success).toBe(false);
    expect(res.data).toBeNull();
    expect(res.error).toBe("Company ID is required");
  });
});
