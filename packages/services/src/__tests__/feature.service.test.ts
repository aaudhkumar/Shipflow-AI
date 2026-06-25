import { describe, it, expect, vi } from "vitest";
import { FeatureService } from "../feature/feature.service";

// Mock the db at the top level so all imports see the same mocked db
vi.mock("@shipflow/db", () => {
  return {
    db: {
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: "thread-1" }])
        }))
      })),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([{ id: "finding-1" }]) // mock blocking finding
              }))
            }))
          }))
        }))
      }))
    }
  };
});

describe("FeatureService", () => {
  it("createFeature should create a row with SUBMITTED status", async () => {
    const mockRepo = {
      createFeature: vi.fn().mockResolvedValue({ id: "feat-1", status: "SUBMITTED" }),
    };
    
    const service = new FeatureService(mockRepo as any);
    const result = await service.createFeature("org-1", "proj-1", "user-1", "A great feature", "This is a detailed description");
    
    expect(mockRepo.createFeature).toHaveBeenCalledWith("org-1", "proj-1", "user-1", "A great feature", "This is a detailed description");
    expect(result.status).toBe("SUBMITTED");
  });

  it("approveHumanRelease should throw when blocking findings exist", async () => {
    const mockRepo = {
      getMemberRole: vi.fn().mockResolvedValue("ADMIN"),
      getFeatureById: vi.fn().mockResolvedValue({ id: "feat-1", status: "AWAITING_HUMAN_APPROVAL" })
    };
    
    const service = new FeatureService(mockRepo as any);
    await expect(service.approveHumanRelease("feat-1", "org-1", "user-1")).rejects.toThrow("Cannot ship: Blocking issues remain unresolved");
  });
});
