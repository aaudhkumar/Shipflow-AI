import { describe, it, expect, vi } from "vitest";
import { verifyGithubWebhook } from "../webhooks/verify";

vi.mock("@octokit/webhooks-methods", () => ({
  verify: vi.fn((secret, payload, signature) => {
    if (signature === "valid-sig") return Promise.resolve(true);
    return Promise.resolve(false);
  })
}));

describe("verifyGithubWebhook", () => {
  it("should accept valid signatures", async () => {
    const result = await verifyGithubWebhook("secret", "payload", "valid-sig");
    expect(result).toBe(true);
  });

  it("should reject invalid signatures", async () => {
    const result = await verifyGithubWebhook("secret", "payload", "invalid-sig");
    expect(result).toBe(false);
  });
});
