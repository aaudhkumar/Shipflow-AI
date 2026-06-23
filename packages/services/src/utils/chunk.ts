/**
 * Code chunking utilities for Pinecone vector ingestion.
 *
 * Splits source code files and PR diffs into overlapping chunks
 * that are small enough for embedding models but large enough
 * to preserve meaningful context.
 */

const MAX_CHUNK_LINES = 80;
const OVERLAP_LINES = 10;

/**
 * File extensions that are indexable for codebase syncing.
 * Skips binary files, configs, lock files, etc.
 */
const INDEXABLE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".rb", ".go", ".rs", ".java", ".kt",
  ".c", ".cpp", ".h", ".hpp", ".cs",
  ".vue", ".svelte", ".astro",
  ".css", ".scss", ".less",
  ".html", ".md", ".mdx",
  ".sql", ".graphql", ".gql",
  ".yaml", ".yml", ".toml",
  ".json", ".env.example",
  ".sh", ".bash", ".zsh",
  ".dockerfile",
]);

/**
 * Paths to skip when syncing a repository.
 */
const SKIP_PATHS = [
  "node_modules/",
  ".git/",
  "dist/",
  "build/",
  ".next/",
  ".turbo/",
  "coverage/",
  "__pycache__/",
  ".env",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
];

export interface CodeChunk {
  id: string;
  text: string;
  filePath: string;
  startLine: number;
  endLine: number;
}

/**
 * Checks if a file path should be indexed based on extension and skip patterns.
 */
export function isIndexableFile(filePath: string): boolean {
  // Check skip paths
  if (SKIP_PATHS.some((skip) => filePath.includes(skip))) {
    return false;
  }

  // Check extension
  const ext = filePath.substring(filePath.lastIndexOf("."));
  return INDEXABLE_EXTENSIONS.has(ext.toLowerCase());
}

/**
 * Splits a single file's content into overlapping chunks of MAX_CHUNK_LINES.
 * Each chunk includes file path context as a header for better retrieval.
 */
export function chunkFileContent(
  filePath: string,
  content: string,
  idPrefix: string,
): CodeChunk[] {
  const lines = content.split("\n");
  const chunks: CodeChunk[] = [];

  if (lines.length <= MAX_CHUNK_LINES) {
    // Small file — single chunk
    chunks.push({
      id: `${idPrefix}::${filePath}::0`,
      text: `// File: ${filePath}\n${content}`,
      filePath,
      startLine: 1,
      endLine: lines.length,
    });
    return chunks;
  }

  // Split into overlapping windows
  let start = 0;
  let chunkIndex = 0;

  while (start < lines.length) {
    const end = Math.min(start + MAX_CHUNK_LINES, lines.length);
    const chunkLines = lines.slice(start, end);

    chunks.push({
      id: `${idPrefix}::${filePath}::${chunkIndex}`,
      text: `// File: ${filePath} (lines ${start + 1}-${end})\n${chunkLines.join("\n")}`,
      filePath,
      startLine: start + 1,
      endLine: end,
    });

    start += MAX_CHUNK_LINES - OVERLAP_LINES;
    chunkIndex++;
  }

  return chunks;
}

/**
 * Chunks a PR diff into per-file patch chunks.
 * Each file's patch is split into chunks if it exceeds MAX_CHUNK_LINES.
 */
export function chunkPrDiff(
  pullRequestId: string,
  files: { filename: string; patch: string }[],
): CodeChunk[] {
  const chunks: CodeChunk[] = [];

  for (const file of files) {
    if (!file.patch) continue;

    const fileChunks = chunkFileContent(
      file.filename,
      file.patch,
      `pr-${pullRequestId}`,
    );
    chunks.push(...fileChunks);
  }

  return chunks;
}

/**
 * Chunks an array of repository files for codebase syncing.
 */
export function chunkRepoFiles(
  repositoryId: string,
  files: { path: string; content: string }[],
): CodeChunk[] {
  const chunks: CodeChunk[] = [];

  for (const file of files) {
    if (!isIndexableFile(file.path)) continue;

    const fileChunks = chunkFileContent(
      file.path,
      file.content,
      `repo-${repositoryId}`,
    );
    chunks.push(...fileChunks);
  }

  return chunks;
}
