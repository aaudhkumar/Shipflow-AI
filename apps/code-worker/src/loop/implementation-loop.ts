import { generateText, tool } from "ai";
import { z } from "zod";
import { getDefaultModel } from "@shipflow/ai";
import { buildContextForTask } from "../context/build-context";
import { runCommand } from "../tools/run-command";
import { validatePath } from "../security/path-guard";
import { scanForSecrets } from "../security/secret-scan";
import fs from "fs/promises";
import path from "path";

const MAX_ITERATIONS = 12;

export async function runImplementationLoop(taskId: string, workspaceRoot: string) {
  const context = await buildContextForTask(taskId);
  const model = getDefaultModel();
  
  let currentIteration = 0;

  const { text, steps } = await generateText({
    model,
    system: context.systemPrompt,
    prompt: "You are operating in an autonomous loop. You MUST use your tools to read the necessary files, make the required code changes to implement the task, and verify them if possible. DO NOT stop until the task is fully implemented. If you need to create new files, do so. Do not ask for user input. Begin now.",
    maxSteps: MAX_ITERATIONS,
    tools: {
      read_file: tool({
        description: "Read the contents of a file",
        parameters: z.object({
          filePath: z.string().describe("Path to the file, relative to the workspace root"),
        }),
        execute: async ({ filePath }) => {
          try {
            const absolutePath = await validatePath(workspaceRoot, filePath);
            return await fs.readFile(absolutePath, "utf-8");
          } catch (e: any) {
            return `Error reading file: ${e.message}`;
          }
        },
      }),
      list_dir: tool({
        description: "List the contents of a directory",
        parameters: z.object({
          dirPath: z.string().describe("Path to the directory, relative to the workspace root. Use '.' for root."),
        }),
        execute: async ({ dirPath }) => {
          try {
            const absolutePath = await validatePath(workspaceRoot, dirPath);
            const files = await fs.readdir(absolutePath);
            return files.join("\n");
          } catch (e: any) {
            return `Error listing directory: ${e.message}`;
          }
        },
      }),
      write_file: tool({
        description: "Write content to a file",
        parameters: z.object({
          filePath: z.string().describe("Path to the file, relative to the workspace root"),
          content: z.string().describe("The content to write"),
        }),
        execute: async ({ filePath, content }) => {
          try {
            const absolutePath = await validatePath(workspaceRoot, filePath);
            
            // Security scan
            const hasSecrets = scanForSecrets(content);
            if (hasSecrets) {
              return `Error writing file: File contains potential secrets and was rejected by the security scanner.`;
            }
            
            await fs.mkdir(path.dirname(absolutePath), { recursive: true });
            await fs.writeFile(absolutePath, content, "utf-8");
            return `Successfully wrote to ${filePath}`;
          } catch (e: any) {
            return `Error writing file: ${e.message}`;
          }
        },
      }),
      run_command: tool({
        description: "Run a permitted command. MUST be exactly 'test', 'lint', or 'build'. Do NOT try to run node scripts or other commands.",
        parameters: z.object({
          command: z.string().describe("The command to run. MUST be one of: 'test', 'lint', 'build'"),
        }),
        execute: async ({ command }) => {
          if (command !== "test" && command !== "lint" && command !== "build") {
            return `Error: You are only permitted to run 'test', 'lint', or 'build'. Command '${command}' is blocked for security reasons.`;
          }
          const res = await runCommand(workspaceRoot, command);
          return `stdout:\n${res.stdout}\nstderr:\n${res.stderr}`;
        },
      }),
    }
  });

  return { text, steps };
}
