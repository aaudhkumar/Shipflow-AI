import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { validatePath } from "../security/path-guard";
import { scanForSecrets } from "../security/secret-scan";
import fs from "fs/promises";
import path from "path";
import os from "os";

describe("Security Guard Constraints", () => {
  describe("Path Guard (Constraint #2)", () => {
    let tmpDir: string;
    let workspaceRoot: string;

    beforeAll(async () => {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "shipflow-test-"));
      workspaceRoot = path.join(tmpDir, "workspace");
      await fs.mkdir(workspaceRoot);
      
      // Setup symlink pointing outside workspace
      await fs.writeFile(path.join(tmpDir, "secret.txt"), "hello");
      await fs.symlink(path.join(tmpDir, "secret.txt"), path.join(workspaceRoot, "link-to-secret.txt"));
    });

    afterAll(async () => {
      await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it("rejects path traversal attempts", async () => {
      await expect(validatePath(workspaceRoot, "../secret.txt")).rejects.toThrow(/escapes workspace root/);
    });

    it("rejects symlink escapes", async () => {
      await expect(validatePath(workspaceRoot, "link-to-secret.txt")).rejects.toThrow(/resolves to a symlink escaping/);
    });

    it("rejects denylisted paths", async () => {
      await expect(validatePath(workspaceRoot, ".env.local")).rejects.toThrow(/denylisted/);
      await expect(validatePath(workspaceRoot, ".git/config")).rejects.toThrow(/denylisted/);
    });
    
    it("allows valid internal paths", async () => {
      const p = await validatePath(workspaceRoot, "src/index.ts");
      expect(p).toBe(path.join(workspaceRoot, "src/index.ts"));
    });
  });

  describe("Secret Scan (Constraint #4)", () => {
    it("flags github tokens", () => {
      expect(scanForSecrets("Here is my token: ghp_1234567890abcdef1234567890abcdef1234")).toBe(true);
    });

    it("flags high entropy strings", () => {
      expect(scanForSecrets("const api_key = 'A8bK9xQm3vN2jL5cR7tY1wP4zX6fH0dG';")).toBe(true);
    });

    it("passes normal code", () => {
      expect(scanForSecrets("const greeting = 'Hello World';\nexport function test() { return greeting; }")).toBe(false);
    });
  });
});
