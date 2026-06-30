import { Octokit } from "octokit";
import { isIndexableFile } from "../utils/chunk";

/**
 * Fetch the changed files (with patches) for a PR.
 * Returns the file paths and their diff patches.
 */
export async function fetchPrFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<{ filename: string; patch: string; status: string }[]> {
  const files = await octokit.paginate("GET /repos/{owner}/{repo}/pulls/{pull_number}/files", {
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });

  return files.map((file: any) => ({
    filename: file.filename,
    patch: file.patch || "",
    status: file.status,
  }));
}

/**
 * Fetch the full repository file tree recursively.
 * Uses the Git Tree API for efficient traversal, then fetches
 * blob contents for indexable files.
 */
export async function fetchRepoFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string = "main",
): Promise<{ path: string; content: string }[]> {
  // Get the tree SHA for the branch
  const { data: ref } = await octokit.request("GET /repos/{owner}/{repo}/git/ref/{ref}", {
    owner,
    repo,
    ref: `heads/${branch}`,
  });

  const commitSha = ref.object.sha;

  // Fetch the full tree recursively
  const { data: tree } = await octokit.request("GET /repos/{owner}/{repo}/git/trees/{tree_sha}", {
    owner,
    repo,
    tree_sha: commitSha,
    recursive: "1",
  });

  // Filter to indexable blob files
  const indexableFiles = (tree.tree || []).filter(
    (item: any) =>
      item.type === "blob" && item.path && isIndexableFile(item.path) && (item.size || 0) < 100_000, // Skip files over 100KB
  );

  // Fetch blob contents in parallel (batched to avoid rate limits)
  const BATCH_SIZE = 10;
  const results: { path: string; content: string }[] = [];

  for (let i = 0; i < indexableFiles.length; i += BATCH_SIZE) {
    const batch = indexableFiles.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (file: any) => {
        try {
          const { data: blob } = await octokit.request(
            "GET /repos/{owner}/{repo}/git/blobs/{file_sha}",
            {
              owner,
              repo,
              file_sha: file.sha!,
            },
          );

          // Decode base64 content
          const content = Buffer.from(blob.content, "base64").toString("utf-8");

          return { path: file.path!, content };
        } catch (error: any) {
          // Log exactly why the blob fetch failed
          console.error(`Blob fetch failed for ${file.path}:`, error.message || error);
          return null;
        }
      }),
    );

    results.push(...(batchResults.filter(Boolean) as { path: string; content: string }[]));
  }

  if (indexableFiles.length > 0 && results.length === 0) {
    throw new Error(`Tree fetched ${indexableFiles.length} indexable files, but EVERY single blob fetch failed. Check server console for 403/404 errors.`);
  } else if (indexableFiles.length === 0) {
    throw new Error(`Tree fetched successfully (${tree.tree?.length || 0} total items), but 0 files passed the 'isIndexableFile' filter or size limits.`);
  }

  return results;
}

/**
 * Fetch PR metadata (title, description, branch info).
 */
export async function fetchPrMetadata(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<{
  title: string;
  body: string;
  headBranch: string;
  baseBranch: string;
  headSha: string;
}> {
  const { data: pr } = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
    owner,
    repo,
    pull_number: prNumber,
  });

  return {
    title: pr.title,
    body: pr.body || "",
    headBranch: pr.head.ref,
    baseBranch: pr.base.ref,
    headSha: pr.head.sha,
  };
}
