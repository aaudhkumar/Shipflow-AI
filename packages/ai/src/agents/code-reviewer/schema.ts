import { z } from "zod";

export const CodeReviewResultSchema = z.object({
  comments: z.array(
    z.object({
      filePath: z.string().describe("The exact file path of the reviewed file"),
      lineNumber: z.number().nullable().describe("The specific line number for the comment, or null for general file comments"),
      findingType: z.enum(["SECURITY", "PERFORMANCE", "ARCHITECTURE", "PRD_DEVIATION", "CODE_QUALITY", "EDGE_CASE", "TEST_COVERAGE"]),
      isBlocking: z.boolean().describe("True if this issue must be fixed before merging (SECURITY, critical PERFORMANCE, or PRD deviation)"),
      severity: z.enum(["BLOCKER", "MAJOR", "MINOR", "SUGGESTION"]),
      comment: z.string().describe("The actionable markdown-formatted feedback"),
      suggestedFix: z.string().optional().describe("A suggested code block fix, if applicable"),
    })
  ),
  summary: z.string().describe("A high level summary of the overall PR quality"),
  shouldMerge: z.boolean().describe("Whether this PR should be merged or it does not provide any valuable addons to the project. Evaluate if it's genuinely useful."),
});

export type CodeReviewResult = z.infer<typeof CodeReviewResultSchema>;
