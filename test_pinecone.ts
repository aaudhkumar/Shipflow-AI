import "dotenv/config";
import { getPineconeIndex } from "./packages/services/src/pinecone/client.ts";
async function run() {
  const index = getPineconeIndex();
  const ns = index.namespace("does-not-exist-12345");
  try {
    await ns.deleteAll();
    console.log("Success");
  } catch(e: any) {
    console.log("Error status:", e.status, e.message);
  }
}
run();
