import { z } from "zod";

export const PRDSchema = z.object({
  problemStatement: z.string().describe("Clear statement of the problem being solved"),
  goals: z.array(z.string()).min(3).describe("What the feature achieves"),
  nonGoals: z.array(z.string()).min(2).describe("What the feature explicitly does NOT do"),
  userStories: z.array(z.object({
    role: z.string(),
    action: z.string(),
    benefit: z.string()
  })).min(3),
  acceptanceCriteria: z.array(z.string()).min(5).describe("Testable pass/fail criteria"),
  edgeCases: z.array(z.string()).min(3).describe("Edge cases and error conditions to handle"),
  successMetrics: z.array(z.object({
    metric: z.string(),
    target: z.string(),
    measurement: z.string()
  })).min(3),
});

export type PRDResult = z.infer<typeof PRDSchema>;
