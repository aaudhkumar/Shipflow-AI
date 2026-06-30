import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: "test" });
const idx = pc.index("test-index");

async function testUpsert() {
  try {
    console.log("Testing with valid record...");
    // Just build the array of records without actually awaiting the network
    // Wait, .upsert() is async and sends a network request.
    // We expect it to throw a 401 Unauthorized or similar if it passes validation.
    // If it fails validation, it throws PineconeArgumentError.
    await idx.upsert([
      {
        id: "test",
        values: new Array(1024).fill(0),
        metadata: {
          filePath: "test",
          startLine: "1",
          endLine: "2",
          text: "hello world"
        }
      }
    ]);
  } catch (e: any) {
    console.error("Valid record error:", e.name, e.message);
  }

  try {
    console.log("Testing with undefined values...");
    await idx.upsert([
      {
        id: "test",
        values: undefined as any,
        metadata: { text: "hello" }
      }
    ]);
  } catch (e: any) {
    console.error("Undefined values error:", e.name, e.message);
  }

  try {
    console.log("Testing with missing text string in metadata...");
    await idx.upsert([
      {
        id: "test",
        values: new Array(1024).fill(0),
        metadata: { text: null as any }
      }
    ]);
  } catch (e: any) {
    console.error("Invalid metadata error:", e.name, e.message);
  }
}
testUpsert();
