export type ToolCategory = "AUTONOMOUS" | "HIGH_RISK";

export interface AIToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  requiredPermission?: string;
  parameters: Record<string, unknown>;
}

export const AI_TOOL_REGISTRY: Record<string, AIToolDefinition> = {
  // AUTONOMOUS / SAFE READ-ONLY TOOLS
  search_jobs: {
    name: "search_jobs",
    description: "Search work orders by title or status.",
    category: "AUTONOMOUS",
    parameters: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  search_inventory: {
    name: "search_inventory",
    description: "Search warehouse catalog items and stock levels.",
    category: "AUTONOMOUS",
    parameters: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  auto_generate_checklists: {
    name: "auto_generate_checklists",
    description: "Generates a checklist of tasks for a job.",
    category: "AUTONOMOUS",
    parameters: {
      type: "object",
      properties: {
        jobId: { type: "string" },
        tasks: { type: "array", items: { type: "string" } },
      },
      required: ["jobId", "tasks"],
    },
  },

  // HIGH-RISK MUTATION TOOLS (REQUIRE HUMAN-IN-THE-LOOP APPROVAL)
  auto_assign_techs: {
    name: "auto_assign_techs",
    description: "Assigns a technician to a specific job.",
    category: "HIGH_RISK",
    requiredPermission: "jobs",
    parameters: {
      type: "object",
      properties: { jobId: { type: "string" }, techId: { type: "string" } },
      required: ["jobId", "techId"],
    },
  },
  reassign_sick_tech: {
    name: "reassign_sick_tech",
    description: "Reassigns jobs from a sick technician to a new technician.",
    category: "HIGH_RISK",
    requiredPermission: "jobs",
    parameters: {
      type: "object",
      properties: { jobId: { type: "string" }, newTechId: { type: "string" } },
      required: ["jobId", "newTechId"],
    },
  },
  update_job_status: {
    name: "update_job_status",
    description: "Updates the status of a job.",
    category: "HIGH_RISK",
    requiredPermission: "jobs",
    parameters: {
      type: "object",
      properties: {
        jobId: { type: "string" },
        status: { type: "string", enum: ["Unassigned", "Dispatched", "In Progress", "Completed", "Canceled"] },
      },
      required: ["jobId", "status"],
    },
  },
  auto_generate_invoice: {
    name: "auto_generate_invoice",
    description: "Generates an invoice for a completed job.",
    category: "HIGH_RISK",
    requiredPermission: "invoices",
    parameters: {
      type: "object",
      properties: { jobId: { type: "string" }, totalAmount: { type: "number" } },
      required: ["jobId"],
    },
  },
};

/**
 * Sanitizes input prompts to defend against Indirect Prompt Injection
 */
export function sanitizePrompt(prompt: string): { safe: boolean; sanitized: string; reason?: string } {
  if (!prompt || typeof prompt !== "string") {
    return { safe: false, sanitized: "", reason: "Invalid prompt payload" };
  }

  const suspiciousPatterns = [
    /ignore\s+all\s+previous\s+instructions/i,
    /reveal\s+system\s+prompt/i,
    /delete\s+all\s+tables/i,
    /bypass\s+permissions/i,
    /drop\s+database/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(prompt)) {
      return {
        safe: false,
        sanitized: "",
        reason: "Adversarial prompt injection pattern detected.",
      };
    }
  }

  return { safe: true, sanitized: prompt.trim() };
}
