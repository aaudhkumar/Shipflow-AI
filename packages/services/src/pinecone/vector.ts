import { getPineconeIndex, getPineconeClient } from "./client";

/**
 * Namespace conventions:
 *  - Repository codebase: `repo--{repositoryId}--codebase`
 *  - Pull request diff:   `pr--{pullRequestId}`
 */
export function getRepoNamespace(repositoryId: string): string {
  return `repo--${repositoryId}--codebase`;
}

export function getPrNamespace(pullRequestId: string): string {
  return `pr--${pullRequestId}`;
}

export interface VectorRecord {
  id: string;
  text: string;
  metadata: Record<string, string>;
}

/**
 * Upsert text records into a Pinecone namespace.
 * Uses Pinecone's integrated embeddings — we send the raw text
 * and the index's configured model handles vectorization.
 */
export async function upsertRecords(
  namespace: string,
  records: VectorRecord[],
): Promise<void> {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) throw new Error("PINECONE_API_KEY is missing");

  const pc = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX;
  if (!indexName) throw new Error("PINECONE_INDEX is missing");

  // Get index host
  const desc = await pc.describeIndex(indexName);
  const host = desc.host;

  // Pinecone supports batches of up to 100 records
  const BATCH_SIZE = 96;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    const res = await fetch("https://api.pinecone.io/embed", {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
        "X-Pinecone-API-Version": "2024-10"
      },
      body: JSON.stringify({
        model: "multilingual-e5-large",
        parameters: { input_type: "passage", truncate: "END" },
        inputs: batch.map((r) => ({ text: r.text }))
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Pinecone Inference API error: ${res.status} ${errText}`);
    }

    const response = await res.json();

    if (!response || !response.data || !response.data[0] || !response.data[0].values) {
       throw new Error(`Pinecone embed response was missing values: ${JSON.stringify(response).substring(0, 500)}`);
    }

    const upsertRes = await fetch(`https://${host}/vectors/upsert`, {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        namespace,
        vectors: batch.map((record, idx) => ({
          id: record.id,
          values: response.data[idx].values as number[],
          metadata: {
            ...record.metadata,
            text: record.text,
          }
        }))
      })
    });

    if (!upsertRes.ok) {
       const err = await upsertRes.text();
       throw new Error(`Pinecone Upsert API error: ${upsertRes.status} ${err}`);
    }
  }
}

/**
 * Search for the most relevant text chunks in a Pinecone namespace.
 * Uses the integrated embedding model to vectorize the query text
 * and then performs similarity search.
 */
export async function searchRecords(
  namespace: string,
  queryText: string,
  topK: number = 5,
  filter?: Record<string, any>
): Promise<{ id: string; score: number; text: string; metadata: Record<string, any> }[]> {
  const index = getPineconeIndex();
  const ns = index.namespace(namespace);
  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) throw new Error("PINECONE_API_KEY is missing");

  const res = await fetch("https://api.pinecone.io/embed", {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
      "X-Pinecone-API-Version": "2024-10"
    },
    body: JSON.stringify({
      model: "multilingual-e5-large",
      parameters: { input_type: "query", truncate: "END" },
      inputs: [{ text: queryText }]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Pinecone Inference API error: ${res.status} ${errText}`);
  }

  const response = await res.json();

  const results = await ns.query({
    vector: response.data[0].values as number[],
    topK,
    filter,
    includeMetadata: true,
  });

  return (results.matches || []).map((match) => ({
    id: match.id,
    score: match.score || 0,
    text: (match.metadata?.text as string) || "",
    metadata: match.metadata || {},
  }));
}

/**
 * Delete all vectors in a namespace.
 * Useful for re-syncing a repository or cleaning up PR vectors after merge.
 */
export async function deleteNamespace(namespace: string): Promise<void> {
  const index = getPineconeIndex();
  const ns = index.namespace(namespace);
  try {
    await ns.deleteAll();
  } catch (error: any) {
    // Pinecone serverless returns a 404 if the namespace has never been written to
    if (error.status === 404 || error.message?.includes("404")) {
      console.warn(`Namespace ${namespace} not found (likely empty), skipping delete.`);
      return;
    }
    throw error;
  }
}
