import { generateText } from "ai";
import { getDefaultModel } from "../../client";
import { executionPlanGeneratorSystemPrompt } from "./prompt";

export async function runExecutionPlanGenerator(
  featureTitle: string,
  prdContent: string,
  projectContext?: string | null
) {
  const model = getDefaultModel();

  let prompt = ``;
  if (projectContext) {
    prompt += `=== PROJECT CONTEXT ===\n${projectContext}\n\n`;
  }
  
  prompt += `Feature Title: ${featureTitle}\n\nProduct Requirements Document (PRD):\n${prdContent}`;

  const { text, usage } = await generateText({
    model,
    system: executionPlanGeneratorSystemPrompt,
    prompt,
  });

  return { result: text, usage };
}
