import { generateObject } from "ai";
import { getDefaultModel } from "../../client";
import { PRDSchema } from "./schema";
import { prdGeneratorSystemPrompt } from "./prompt";

export async function runPRDGenerator(
  featureTitle: string,
  rawDescription: string,
  clarificationTranscript: string
) {
  const model = getDefaultModel();

  let prompt = `Feature Title: ${featureTitle}\n\nFeature Description:\n${rawDescription}`;

  if (clarificationTranscript && clarificationTranscript.trim().length > 0) {
    prompt += `\n\n=== CLARIFICATION Q&A ===\n${clarificationTranscript}`;
  }

  const { object, usage } = await generateObject({
    model,
    system: prdGeneratorSystemPrompt,
    prompt,
    schema: PRDSchema,
  });

  return { result: object, usage };
}
