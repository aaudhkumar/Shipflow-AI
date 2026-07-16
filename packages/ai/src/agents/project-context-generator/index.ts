import { generateObject } from "ai";
import { getDefaultModel } from "../../client";
import { ProjectContextSchema } from "./schema";
import { projectContextSystemPrompt } from "./prompt";

export async function runProjectContextGenerator(
  projectName: string,
  projectDescription: string | null | undefined,
  shippedFeatures: { title: string; description: string | null }[]
) {
  const model = getDefaultModel();

  let prompt = `Project Name: ${projectName}\n`;
  if (projectDescription) {
    prompt += `Project Description: ${projectDescription}\n`;
  }

  if (shippedFeatures && shippedFeatures.length > 0) {
    prompt += `\nRecently Shipped Features:\n`;
    shippedFeatures.forEach((feature, index) => {
      prompt += `${index + 1}. ${feature.title}\n`;
      if (feature.description) {
        prompt += `   Description: ${feature.description}\n`;
      }
    });
  } else {
    prompt += `\nNo features have been shipped yet. Infer the context purely from the project name and description.\n`;
  }

  const { object, usage } = await generateObject({
    model,
    system: projectContextSystemPrompt,
    prompt,
    schema: ProjectContextSchema,
  });

  return { result: object, usage };
}
