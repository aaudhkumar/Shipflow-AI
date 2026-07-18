import { generateObject } from "ai";
import { getDefaultModel } from "../../client";
import { PlannerResultSchema } from "./schema";
import { plannerSystemPrompt } from "./prompt";

export async function runPlanningAgent(executionPlanContent: string, projectContext?: string | null) {
  const model = getDefaultModel();

  let prompt = `Please parse the following Execution Plan into actionable engineering tasks:\n\n${executionPlanContent}`;
  if (projectContext) {
    prompt = `=== PROJECT CONTEXT ===\n${projectContext}\n\n` + prompt;
  }

  const { object, usage } = await generateObject({
    model,
    system: plannerSystemPrompt,
    prompt,
    schema: PlannerResultSchema,
  });

  return { result: object, usage };
}
