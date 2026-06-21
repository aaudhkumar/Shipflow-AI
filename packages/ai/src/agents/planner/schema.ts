import { z } from "zod";

export const PlannerResultSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().describe("A concise, action-oriented title for the ticket"),
      description: z.string().describe("Detailed technical description of what needs to be implemented"),
      storyPoints: z.number().describe("Estimated complexity from 1, 2, 3, 5, 8"),
      acceptanceCriteria: z.array(z.string()).describe("A list of exact criteria that must be met to close this task"),
    })
  ).describe("A list of engineering tasks broken down from the requirements"),
  summary: z.string().describe("A brief overview of the parsed requirements"),
});

export type PlannerResult = z.infer<typeof PlannerResultSchema>;
