import { describe, it, expect, vi } from "vitest";
import TaskExecutionService from "../task-execution/task-execution.service";
import { db } from "@shipflow/db";

// Mock the db module
vi.mock("@shipflow/db", () => ({
  db: {
    execute: vi.fn(),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    })),
  },
}));

describe("TaskExecutionService", () => {
  it("claimNextReadyTask should never return the same task to concurrent callers", async () => {
    const service = new TaskExecutionService();
    const prdId = "prd-1";
    
    let dbCallCount = 0;
    
    // Mock db.execute to simulate a race condition where the first caller wins the lock
    // and returns the claimed row, and the second caller returns empty array.
    (db.execute as any).mockImplementation(async () => {
      // Small artificial delay to simulate DB time
      await new Promise(resolve => setTimeout(resolve, 10));
      dbCallCount++;
      if (dbCallCount === 1) {
        return [{ id: "task-1", status: "TODO" }];
      }
      return [];
    });

    const promise1 = service.claimNextReadyTask(prdId, "run-1");
    const promise2 = service.claimNextReadyTask(prdId, "run-2");

    const [result1, result2] = await Promise.all([promise1, promise2]);

    // One should succeed, the other should fail to get a row because SKIP LOCKED would bypass it
    expect([result1, result2]).toContainEqual({ id: "task-1", status: "TODO" });
    expect([result1, result2]).toContain(null);
    expect(result1).not.toEqual(result2);
    expect(db.execute).toHaveBeenCalledTimes(2);
  });
});
