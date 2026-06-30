import { Pinecone } from "@pinecone-database/pinecone";
import "dotenv/config";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || "missing" });

async function run() {
  try {
    const response = await pc.inference.embed({
      model: "multilingual-e5-large",
      inputs: ["Hello world", "Test 2"],
      parameters: { inputType: "passage", truncate: "END" }
    });
    console.log(JSON.stringify(response, null, 2));
  } catch(e: any) {
    console.error(e.message);
  }
}
run();
