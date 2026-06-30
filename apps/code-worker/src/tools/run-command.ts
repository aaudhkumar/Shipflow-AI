import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// HC#1: Closed TypeScript union. Maps to execFile with args array — never exec/shell: true.
export type PermittedCommand = "test" | "lint" | "build";

export async function runCommand(workspaceRoot: string, command: PermittedCommand): Promise<{ stdout: string; stderr: string }> {
  let args: string[] = [];
  
  switch (command) {
    case "test":
      args = ["test"];
      break;
    case "lint":
      args = ["lint"];
      break;
    case "build":
      args = ["build"];
      break;
    default:
      // TypeScript compiler exhaustiveness check
      const _exhaustiveCheck: never = command;
      throw new Error(`Invalid command: ${_exhaustiveCheck}`);
  }

  try {
    const { stdout, stderr } = await execFileAsync("pnpm", args, { cwd: workspaceRoot });
    return { stdout, stderr };
  } catch (err: any) {
    return { stdout: err.stdout ?? "", stderr: err.stderr ?? err.message };
  }
}
