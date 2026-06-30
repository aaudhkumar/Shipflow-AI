import { z } from "zod";

export const ClarifierOutputSchema = z.object({
  action: z.enum(["ask_question", "mark_ready", "mark_duplicate"]).describe("The next action to take based on the feature request."),
  message: z.string().describe("If ask_question or mark_duplicate, the message to send to the user. If mark_ready, a brief summary of the feature."),
  duplicateOfId: z.string().optional().describe("If mark_duplicate, the ID of the existing feature request it duplicates."),
  questions: z.array(z.object({
    id: z.string().describe("Unique identifier for this question (e.g. q1, q2)"),
    question: z.string().describe("The specific clarifying question."),
    recommendation: z.string().describe("A recommended answer or proposed approach.")
  })).optional().describe("A list of structured questions with recommendations to ask the user, if action is ask_question.")
});

export type ClarifierOutput = z.infer<typeof ClarifierOutputSchema>;
