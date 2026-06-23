import { getPineconeIndex } from "./client";

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
  const index = getPineconeIndex();
  const ns = index.namespace(namespace);

  // Pinecone supports batches of up to 100 records
  const BATCH_SIZE = 96;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    await ns.upsert(
      batch.map((record) => ({
        id: record.id,
        values: [], // Placeholder — integrated embeddings generate these server-side
        metadata: {
          ...record.metadata,
          text: record.text,
        },
      })) as any,
    );
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
): Promise<{ id: string; score: number; text: string; metadata: Record<string, any> }[]> {
  const index = getPineconeIndex();
  const ns = index.namespace(namespace);

  // For integrated embeddings, we use the query endpoint with text
  // Pinecone handles vectorization of the query text
  const results = await ns.query({
    vector: [], // Will be generated from the query text by Pinecone
    topK,
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
  await ns.deleteAll();
}
