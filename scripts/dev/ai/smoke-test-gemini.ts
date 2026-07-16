import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(import.meta.dirname, ".env") });

async function run() {
  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: "hello",
    });
    console.log("Success 2.5:", res.text);
  } catch (e: any) {
    console.error("gemini-2.5-flash Error:", e.message);
  }

  try {
    const res3 = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: "hello",
    });
    console.log("Success 1.5:", res3.text);
  } catch (e: any) {
    console.error("gemini-1.5-flash Error:", e.message);
  }
}
run();
