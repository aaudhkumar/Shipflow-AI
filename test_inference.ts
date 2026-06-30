import { Pinecone } from "@pinecone-database/pinecone";
const pc = new Pinecone({ apiKey: "dummy-key-12345" });
console.log(typeof pc.inference?.embed);
