import { generateObject } from "ai";
import { getDefaultModel } from "../../client";
import { ClarifierOutputSchema } from "./schema";
import { clarifierSystemPrompt } from "./prompt";

export async function runClarifierAgent(featureDescription: string, existingFeaturesContext?: string, previousThread?: string) {
  const model = getDefaultModel();

  let prompt = `Evaluate the following Feature Request:\n\n<FEATURE_REQUEST>\n${featureDescription}\n</FEATURE_REQUEST>\n\n`;

  if (previousThread) {
    prompt += `Previous conversation history with the user regarding this request:\n\n<HISTORY>\n${previousThread}\n</HISTORY>\n\n`;
  }

  if (existingFeaturesContext) {
    prompt += `Existing features in the system (for duplicate detection):\n\n<EXISTING_FEATURES>\n${existingFeaturesContext}\n</EXISTING_FEATURES>\n\n`;
  }

  const { object, usage } = await generateObject({
    model,
    system: clarifierSystemPrompt,
    prompt,
    schema: ClarifierOutputSchema,
  });

  return { result: object, usage };
}
