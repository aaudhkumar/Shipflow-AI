import { describe, it, expect, vi } from "vitest";
import { checkAIAccess } from "../services/usage";

// Mock BILLING_PLANS
vi.mock("../config/plans", () => ({
  BILLING_PLANS: {
    FREE: { limits: { maxAiTokensPerMonth: 50000 } },
    PRO: { limits: { maxAiTokensPerMonth: 500000 } }
  }
}));

const mockFindFirst = vi.fn();

vi.mock("@shipflow/db", () => ({
  db: {
    query: {
      organizations: {
        findFirst: (...args: any[]) => mockFindFirst(...args)
      }
    }
  }
}));

describe("checkAIAccess", () => {
  it("should return false when token limit exceeded on FREE plan", async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: "org-1",
      billingPlan: "FREE",
      usageRecords: [
        { tokenUsage: 49000 }
      ]
    });
    
    // 49000 + 2000 > 50000
    const result = await checkAIAccess("org-1", 2000);
    expect(result).toBe(false);
  });

  it("should return true when within token limit", async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: "org-1",
      billingPlan: "PRO",
      usageRecords: [
        { tokenUsage: 49000 }
      ]
    });
    
    // 49000 + 2000 <= 500000
    const result = await checkAIAccess("org-1", 2000);
    expect(result).toBe(true);
  });
});
