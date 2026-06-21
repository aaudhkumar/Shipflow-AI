import { generateObject } from "ai";
import { getDefaultModel } from "../../client";
import { PlannerResultSchema } from "./schema";
import { plannerSystemPrompt } from "./prompt";

export async function runPlanningAgent(requirementsContent: string) {
  const model = getDefaultModel();

  const { object, usage } = await generateObject({
    model,
    system: plannerSystemPrompt,
    prompt: `Please decompose the following requirements into actionable engineering tasks:\n\n${requirementsContent}`,
    schema: PlannerResultSchema,
  });

  return { result: object, usage };
}
