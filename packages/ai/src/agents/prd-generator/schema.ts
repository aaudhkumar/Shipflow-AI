import { z } from "zod";

export const PRDSchema = z.object({
  problemStatement: z.string().describe("Clear statement of the problem being solved"),
  goals: z.array(z.string()).default([]).describe("What the feature achieves"),
  nonGoals: z.array(z.string()).default([]).describe("What the feature explicitly does NOT do"),
  userStories: z.array(z.object({
    role: z.string(),
    action: z.string(),
    benefit: z.string()
  })).default([]),
  acceptanceCriteria: z.array(z.string()).default([]).describe("Testable pass/fail criteria"),
  edgeCases: z.array(z.string()).default([]).describe("Edge cases and error conditions to handle"),
  successMetrics: z.array(z.object({
    metric: z.string(),
    target: z.string(),
    measurement: z.string()
  })).default([]),
});

export type PRDResult = z.infer<typeof PRDSchema>;
