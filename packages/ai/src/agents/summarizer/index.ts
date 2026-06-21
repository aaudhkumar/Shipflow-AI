import { generateText } from "ai";
import { getDefaultModel } from "../../client";
import { summarizerSystemPrompt } from "./prompt";

export interface PRMetadata {
  title: string;
  body: string | null;
  commits: string[];
}

export async function runSummarizerAgent(prs: PRMetadata[]) {
  const model = getDefaultModel();

  const formattedPRs = prs.map((pr, index) => 
    `PR ${index + 1}:\nTitle: ${pr.title}\nBody: ${pr.body || "N/A"}\nCommits: ${pr.commits.join(", ")}`
  ).join("\n\n---\n\n");

  const { text, usage } = await generateText({
    model,
    system: summarizerSystemPrompt,
    prompt: `Please summarize the following Pull Requests into Release Notes:\n\n${formattedPRs}`,
  });

  return { result: text, usage };
}
