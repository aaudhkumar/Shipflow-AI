import { generateObject } from "ai";
import { getDefaultModel } from "../../client";
import { CodeReviewResultSchema } from "./schema";
import { codeReviewerSystemPrompt } from "./prompt";

export async function runCodeReview(diffContent: string, contextSnippets: string[] = [], prd?: string, previousFindings?: string) {
  const model = getDefaultModel();

  let prompt = `Please review the following PR diff:\n\n${diffContent}`;

  if (previousFindings) {
    prompt += `\n\n=== PREVIOUS REVIEW FINDINGS ===\nThe following issues were raised in the previous review. For each, explicitly state whether it has been RESOLVED, PARTIALLY ADDRESSED, or REMAINS in the new diff:\n\n${previousFindings}`;
  }

  if (prd) {
    prompt += `\n\n=== PRODUCT REQUIREMENTS DOCUMENT (PRD) ===\nThe following PRD outlines the expected behavior and requirements for this feature. Please use it to verify that the implementation meets the business logic requirements:\n\n${prd}`;
  }

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
