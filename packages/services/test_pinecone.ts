import { Pinecone } from "@pinecone-database/pinecone";
import "dotenv/config";
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || "dummy" });
async function run() {
  try {
    const res = await pc.inference.embed({
      model: "multilingual-e5-large",
      inputs: ["hello world"],
      parameters: { inputType: "passage", truncate: "END" }
    });
    console.log("RESPONSE_KEYS:", Object.keys(res));
    if (res.data) console.log("DATA_TYPE:", typeof res.data, Array.isArray(res.data), "KEYS:", Object.keys(res.data[0]));
  } catch(e: any) {
    console.error("ERROR:", e.message);
  }
}
run();
