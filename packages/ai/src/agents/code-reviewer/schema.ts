import { z } from "zod";

export const CodeReviewResultSchema = z.object({
  comments: z.array(
    z.object({
      filePath: z.string().describe("The exact file path of the reviewed file"),
      lineNumber: z.number().nullable().describe("The specific line number for the comment, or null for general file comments"),
      findingType: z.enum(["SECURITY", "PERFORMANCE", "ARCHITECTURE", "TASK_DEVIATION", "CODE_QUALITY", "EDGE_CASE", "TEST_COVERAGE"]),
      isBlocking: z.boolean().describe("True if this issue must be fixed before merging (SECURITY, critical PERFORMANCE, or Task deviation)"),
      severity: z.enum(["BLOCKER", "MAJOR", "MINOR", "SUGGESTION"]),
      comment: z.string().describe("The actionable markdown-formatted feedback"),
      suggestedFix: z.string().optional().describe("A suggested code block fix, if applicable"),
    })
  ),
  summary: z.string().describe("A high level summary of the overall PR quality"),
  shouldMerge: z.boolean().describe("Whether this PR should be merged based on whether it fulfills the task's subtasks/acceptance criteria and aligns with the project context, rather than just providing generic value addons."),
  completedSubtaskIds: z.array(z.string()).describe("List of subtask IDs that are fully implemented and verified in this PR"),
});

export type CodeReviewResult = z.infer<typeof CodeReviewResultSchema>;
