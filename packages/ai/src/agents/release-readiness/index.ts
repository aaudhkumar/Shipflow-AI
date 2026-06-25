import { generateObject } from "ai";
import { getDefaultModel } from "../../client";
import { releaseReadinessSchema, type ReleaseReadinessResult } from "./schema";
import { releaseReadinessPrompt } from "./prompt";

export interface ReleaseReadinessInput {
  prdContext: string;
  tasksContext: string;
  reviewContext: string;
  pullRequestState: string;
}

export async function runReleaseReadinessAgent(
  input: ReleaseReadinessInput
): Promise<ReleaseReadinessResult> {
  const llm = getDefaultModel();
  
  const userPrompt = `
=== PRD CONTEXT ===
${input.prdContext || "No PRD provided."}

=== TASKS CONTEXT ===
${input.tasksContext || "No tasks provided."}

=== REVIEW CONTEXT ===
${input.reviewContext || "No review findings provided."}

=== PULL REQUEST STATE ===
${input.pullRequestState || "No Pull Request state provided."}

Please evaluate the release readiness of this feature based on the information above.
  `;

  const { object } = await generateObject({
    model: llm,
    system: releaseReadinessPrompt,
    prompt: userPrompt,
    schema: releaseReadinessSchema,
  });

  return object as ReleaseReadinessResult;
}
