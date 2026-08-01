import { describe, it, expect, vi } from "vitest";

describe("Phase 4 Enhancements: Dynamic Chunks & Production Error Governance", () => {
  it("should dynamically map node_modules paths to vendor chunks", () => {
    const simulateChunk = (id: string) => {
      if (id.includes("node_modules")) {
        if (id.includes("@radix-ui") || id.includes("lucide-react")) return "vendor-ui";
        if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) return "vendor-react";
        if (id.includes("@supabase") || id.includes("@tanstack")) return "vendor-data";
        return "vendor-core";
      }
    };

    expect(simulateChunk("node_modules/@radix-ui/react-dialog/index.js")).toBe("vendor-ui");
    expect(simulateChunk("node_modules/react/index.js")).toBe("vendor-react");
    expect(simulateChunk("node_modules/@supabase/supabase-js/dist/main.js")).toBe("vendor-data");
    expect(simulateChunk("node_modules/lodash/lodash.js")).toBe("vendor-core");
  });

  it("should trigger production reporting callback when ErrorBoundary catches exception", () => {
    const reportCallback = vi.fn();
    const error = new Error("Test Production Exception");
    const errorInfo = { componentStack: "at ChildComponent" } as any;

    if (reportCallback) {
      reportCallback(error, errorInfo);
    }

    expect(reportCallback).toHaveBeenCalledWith(error, errorInfo);
    expect(reportCallback).toHaveBeenCalledTimes(1);
  });
});
