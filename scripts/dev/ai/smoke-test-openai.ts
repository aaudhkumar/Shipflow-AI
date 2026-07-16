import { createOpenAI } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { z } from "zod";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(import.meta.dirname, ".env") });

async function run() {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const searchCodebase = tool({
    description: 'Search the repository codebase',
    parameters: z.object({ query: z.string().describe('Search query') }),
    execute: async ({ query }) => {
      return { results: [] };
    },
  });

  try {
    const res = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: "Search for foo",
      tools: { searchCodebase },
    });
    console.log("Success:", res.text);
  } catch (e: any) {
    console.error("Error:", e);
  }
}
run();
