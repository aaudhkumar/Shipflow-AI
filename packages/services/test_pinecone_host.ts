import { Pinecone } from "@pinecone-database/pinecone";
import * as fs from "fs";
import * as path from "path";

const envStr = fs.readFileSync(path.resolve(import.meta.dirname, "../../.env"), "utf-8");
const env: Record<string, string> = {};
for (const line of envStr.split("\n")) {
  if (line.includes("=")) {
    const [k, v] = line.split("=");
    env[k.trim()] = v.trim();
  }
}

const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY || "missing" });
const index = pc.index(env.PINECONE_INDEX || "shipflow");

async function run() {
  const anyIndex = index as any;
  console.log("host:", anyIndex.target?.config?.host || anyIndex._config?.host || "Not found");
}
run().catch(console.error);
