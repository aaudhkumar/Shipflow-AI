import { Pinecone } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || "missing" });

async function run() {
  try {
    console.log("Calling inference embed...");
    const response = await pc.inference.embed({
      model: "multilingual-e5-large",
      inputs: ["Hello world"],
      parameters: { inputType: "passage", truncate: "END" }
    });
    console.log("Response Type:", typeof response);
    console.log("Is Array?", Array.isArray(response));
    console.log("Keys:", Object.keys(response));
    if ((response as any).data) {
      console.log("Data length:", (response as any).data.length);
      console.log("Data[0] keys:", Object.keys((response as any).data[0]));
      console.log("Values is Array?", Array.isArray((response as any).data[0].values));
      if ((response as any).data[0].values) {
         console.log("Values length:", (response as any).data[0].values.length);
      }
    }
  } catch(e: any) {
    console.error("ERROR:", e.message || e);
  }
}
run().catch(console.error);
