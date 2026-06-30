import { describe, it, expect, vi } from "vitest";
import { handleImplement } from "../implement";
import * as sandbox from "../sandbox";

vi.mock("../sandbox", () => ({
  provisionSandbox: vi.fn().mockResolvedValue({ containerId: "test-container" }),
  teardownSandbox: vi.fn(),
}));

describe("Sandbox Teardown (Constraint #9)", () => {
  it("tears down the sandbox even when an error is thrown", async () => {
    const result = await handleImplement({ taskId: "123", simulateThrow: true });
    
    expect(result.success).toBe(false);
    expect(sandbox.teardownSandbox).toHaveBeenCalledTimes(1);
    expect(sandbox.teardownSandbox).toHaveBeenCalledWith({ containerId: "test-container" });
  });
});
