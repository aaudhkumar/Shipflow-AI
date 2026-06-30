import { createOpenAI } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { z } from "zod";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

async function run() {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const searchCodebase = tool({
    description: 'Search the repository codebase',
    parameters: z.object({ query: z.string().describe('Natural language search query') }),
    execute: async ({ query }) => {
      return { results: [] };
    },
  });

  const getPreviousFindings = tool({
    description: 'Retrieve findings',
    parameters: z.object({}),
    execute: async () => {
      return { findings: [] };
    },
  });

  try {
    const res = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: "Search for foo",
      tools: { searchCodebase, getPreviousFindings },
    });
    console.log("Success:", res.text);
  } catch (e: any) {
    console.error("Error from AI SDK:", e);
  }
}
run();
