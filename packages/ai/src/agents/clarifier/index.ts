import { generateObject } from "ai";
import { getDefaultModel } from "../../client";
import { ClarifierOutputSchema } from "./schema";
import { clarifierSystemPrompt } from "./prompt";

export async function runClarifierAgent(title: string, description: string, existingFeaturesContext?: string, previousThread?: string, projectContext?: string | null) {
  const model = getDefaultModel();

  let prompt = `Evaluate the following Feature Request:\n\n<FEATURE_REQUEST>\nTitle: ${title}\nDescription: ${description}\n</FEATURE_REQUEST>\n\n`;

  if (projectContext) {
    prompt += `Project Context (The overarching context of the project this feature belongs to):\n\n<PROJECT_CONTEXT>\n${projectContext}\n</PROJECT_CONTEXT>\n\n`;
  }

  if (previousThread) {
    prompt += `Previous conversation history with the user regarding this request:\n\n<HISTORY>\n${previousThread}\n</HISTORY>\n\n`;
  }

  if (existingFeaturesContext) {
    prompt += `Existing features in the system (for duplicate detection):\n\n<EXISTING_FEATURES>\n${existingFeaturesContext}\n</EXISTING_FEATURES>\n\n`;
  }

  console.log("[runClarifierAgent] Calling AI with title:", title);
  const { object, usage } = await generateObject({
    model,
    system: clarifierSystemPrompt,
    prompt,
    schema: ClarifierOutputSchema,
  });
  console.log("[runClarifierAgent] AI returned:", JSON.stringify(object, null, 2));

  return { result: object, usage };
}
