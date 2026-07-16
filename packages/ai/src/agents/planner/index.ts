import { generateObject } from "ai";
import { getDefaultModel } from "../../client";
import { PlannerResultSchema } from "./schema";
import { plannerSystemPrompt } from "./prompt";

export async function runPlanningAgent(requirementsContent: string, projectContext?: string | null) {
  const model = getDefaultModel();

  let prompt = `Please decompose the following requirements into actionable engineering tasks:\n\n${requirementsContent}`;
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
