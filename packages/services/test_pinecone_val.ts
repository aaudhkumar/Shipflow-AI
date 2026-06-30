import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: "test" });
const idx = pc.index("test-index");

async function run() {
  const record = {
    id: "repo-123::src/index.ts::0",
    values: new Array(1024).fill(0.1),
    metadata: {
      filePath: "src/index.ts",
      startLine: "1",
      endLine: "80",
      text: "// File: src/index.ts (lines 1-80)\nconsole.log('test')"
    }
  };
  try {
    await idx.upsert([record]);
    console.log("Success (validator passed, network threw which is good)");
  } catch (e: any) {
    console.error("Validator Error:", e.name, e.message);
  }
}
run();
