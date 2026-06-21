import { generateObject } from "ai";
import { getDefaultModel } from "../../client";
import { CodeReviewResultSchema } from "./schema";
import { codeReviewerSystemPrompt } from "./prompt";

export async function runCodeReview(diffContent: string) {
  const model = getDefaultModel();

  const { object, usage } = await generateObject({
    model,
    system: codeReviewerSystemPrompt,
    prompt: `Please review the following PR diff:\n\n${diffContent}`,
    schema: CodeReviewResultSchema,
  });

  return { result: object, usage };
}
