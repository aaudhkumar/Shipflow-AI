import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: "dummy-key-12345" });
const index = pc.index("dummy-index");

async function test1() {
  try {
    await index.upsert([{ id: "1", values: [], metadata: { text: "hello" } }]);
  } catch(e: any) {
    console.log("Test 1 (values: []):", e.message);
  }
}

async function test2() {
  try {
    await index.upsert([{ id: "2", metadata: { text: "hello" } } as any]);
  } catch(e: any) {
    console.log("Test 2 (no values):", e.message);
  }
}

async function run() {
  await test1();
  await test2();
}
run();
