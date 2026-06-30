import { describe, it, expect, vi } from "vitest";
import { runCommand, PermittedCommand } from "../tools/run-command";
import * as cp from "child_process";

vi.mock("child_process", () => ({
  execFile: vi.fn((cmd, args, opts, cb) => cb(null, { stdout: "ok", stderr: "" })),
}));

describe("Run Command (Constraint #1)", () => {
  it("executes permitted commands via execFile", async () => {
    await runCommand("/test", "lint");
    expect(cp.execFile).toHaveBeenCalled();
    const callArgs = vi.mocked(cp.execFile).mock.calls[0];
    expect(callArgs[0]).toBe("pnpm");
    expect(callArgs[1]).toEqual(["lint"]);
  });

  it("rejects arbitrary strings at compile time", () => {
    // @ts-expect-error
    const invalidCmd: PermittedCommand = "rm -rf /";
    
    // @ts-expect-error
    const invalidCmd2: PermittedCommand = "echo 'hello' > src/index.ts";
  });
});
