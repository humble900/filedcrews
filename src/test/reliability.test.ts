import { describe, it, expect } from "vitest";
import { logger } from "@/lib/observability/logger";
import { SyncEngine } from "@/sync/syncEngine";

describe("Phase 9 Production Reliability, Observability & Offline Sync Unit Tests", () => {
  it("should output structured JSON format for observability logger", () => {
    const consoleSpy = vi.spyOn(console, "log");
    logger.info("job.created", { companyId: "comp-123", jobId: "job-456" });

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(logCall);

    expect(parsed.level).toBe("info");
    expect(parsed.event).toBe("job.created");
    expect(parsed.companyId).toBe("comp-123");
    consoleSpy.mockRestore();
  });

  it("should enqueue and flush mobile offline sync queue cleanly", async () => {
    const item = SyncEngine.enqueueAction({
      companyId: "comp-123",
      staffId: "tech-789",
      actionType: "CLOCK_IN",
      payload: { lat: 37.7749, lng: -122.4194 },
      timestamp: new Date().toISOString(),
    });

    expect(item.id).toContain("sync_");
    expect(item.synced).toBe(false);

    const pendingBefore = SyncEngine.getPendingQueue();
    expect(pendingBefore.length).toBeGreaterThan(0);

    const flushRes = await SyncEngine.flushQueue();
    expect(flushRes.success).toBe(true);
    expect(flushRes.data?.processed).toBeGreaterThan(0);

    const pendingAfter = SyncEngine.getPendingQueue();
    expect(pendingAfter.length).toBe(0);
  });
});
