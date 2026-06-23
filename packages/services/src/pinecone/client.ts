import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient: Pinecone | null = null;

/**
 * Returns a singleton Pinecone client instance.
 * Uses integrated embeddings — the Pinecone index is configured with an
 * embedding model (e.g., multilingual-e5-large) so we send raw text
 * and Pinecone handles vectorization.
 */
export function getPineconeClient(): Pinecone {
  if (pineconeClient) return pineconeClient;

  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing PINECONE_API_KEY environment variable");
  }

  pineconeClient = new Pinecone({ apiKey });
  return pineconeClient;
}

/**
 * Returns the configured Pinecone index.
 */
export function getPineconeIndex() {
  const client = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX;

  if (!indexName) {
    throw new Error("Missing PINECONE_INDEX environment variable");
  }

  return client.index(indexName);
}
