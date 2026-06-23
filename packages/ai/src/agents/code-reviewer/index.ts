import { generateObject } from "ai";
import { getDefaultModel } from "../../client";
import { CodeReviewResultSchema } from "./schema";
import { codeReviewerSystemPrompt } from "./prompt";

export async function runCodeReview(diffContent: string, contextSnippets: string[] = []) {
  const model = getDefaultModel();

  let prompt = `Please review the following PR diff:\n\n${diffContent}`;

  if (contextSnippets.length > 0) {
    prompt += `\n\n=== RELEVANT CODEBASE CONTEXT ===\nThe following snippets from the codebase may provide context for evaluating architectural alignment and existing patterns:\n\n`;
    prompt += contextSnippets.join("\n\n---\n\n");
  }

  const { object, usage } = await generateObject({
    model,
    system: codeReviewerSystemPrompt,
    prompt,
    schema: CodeReviewResultSchema,
  });

  return { result: object, usage };
}
