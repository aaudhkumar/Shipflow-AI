import { inngest } from "../../../services/src/workflow/client";
import { getInstallationOctokit } from "@shipflow/github";
import { db } from "@shipflow/db";
import { repositories } from "@shipflow/db/schema";
import { eq } from "drizzle-orm";
import { fetchRepoFiles } from "@shipflow/services/github/files";
import { chunkRepoFiles } from "@shipflow/services/utils/chunk";
import {
  upsertRecords,
  deleteNamespace,
  getRepoNamespace,
} from "@shipflow/services/pinecone/vector";

/**
 * Durable workflow that syncs a repository's codebase into Pinecone.
 *
 * Triggered manually via the dashboard UI ("Sync Repo" button).
 * Steps:
 *   1. Mark the repository as SYNCING in the DB.
 *   2. Fetch all indexable files from the repository via Git Tree API.
 *   3. Chunk the files into 80-line max overlapping segments.
 *   4. Clear the old namespace and upsert new chunks to Pinecone.
 *   5. Update the repository's sync status and chunk count in the DB.
 */
export const syncRepositoryWorkflow = inngest.createFunction(
  {
    id: "sync-repository",
    retries: 2,
  },
  { event: "repo.sync.requested" },
  async ({ event, step }) => {
    const { repositoryId, installationId, repoOwner, repoName, defaultBranch } = event.data;

    // Step 1: Mark as SYNCING
    await step.run("mark-syncing", async () => {
      await db
        .update(repositories)
        .set({ syncStatus: "SYNCING" })
        .where(eq(repositories.id, repositoryId));
    });

    // Step 2: Fetch all indexable files from the repository
    const repoFiles = await step.run("fetch-repo-files", async () => {
      const octokit = await getInstallationOctokit(installationId);
      return fetchRepoFiles(octokit, repoOwner, repoName, defaultBranch);
    });

    // Step 3: Chunk the files
    const chunks = await step.run("chunk-repo-files", async () => {
      return chunkRepoFiles(repositoryId, repoFiles);
    });

    // Step 4: Clear old namespace and upsert new chunks
    await step.run("upsert-to-pinecone", async () => {
      const namespace = getRepoNamespace(repositoryId);

      // Clear existing vectors for a clean re-sync
      await deleteNamespace(namespace);

      // Upsert all chunks
      await upsertRecords(
        namespace,
        chunks.map((chunk: any) => ({
          id: chunk.id,
          text: chunk.text,
          metadata: {
            filePath: chunk.filePath,
            startLine: String(chunk.startLine),
            endLine: String(chunk.endLine),
          },
        })),
      );

      return { chunksUpserted: chunks.length };
    });

    // Step 5: Mark as SYNCED and update stats
    await step.run("mark-synced", async () => {
      await db
        .update(repositories)
        .set({
          syncStatus: "SYNCED",
          syncChunkCount: chunks.length,
          lastSyncedAt: new Date(),
        })
        .where(eq(repositories.id, repositoryId));
    });

    return {
      repositoryId,
      filesProcessed: repoFiles.length,
      chunksCreated: chunks.length,
    };
  },
);
