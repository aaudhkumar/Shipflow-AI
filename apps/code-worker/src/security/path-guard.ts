import path from "path";
import fs from "fs/promises";

const DENYLIST = [
  /\.env.*/,
  /\.github\/workflows\/.*/,
  /\.git\/.*/,
  /.*\/secrets\/.*/,
];

export async function validatePath(workspaceRoot: string, targetPath: string): Promise<string> {
  const resolvedPath = path.resolve(workspaceRoot, targetPath);
  
  // Basic boundary check
  if (!resolvedPath.startsWith(path.resolve(workspaceRoot))) {
    throw new Error(`Path ${targetPath} escapes workspace root`);
  }
  
  // Realpath check to prevent symlink escapes if the file exists
  try {
    const realPath = await fs.realpath(resolvedPath);
    if (!realPath.startsWith(path.resolve(workspaceRoot))) {
      throw new Error(`Path ${targetPath} resolves to a symlink escaping workspace root`);
    }
  } catch (e: any) {
    // If file doesn't exist, realpath throws ENOENT. That's fine for creating new files.
    if (e.code !== "ENOENT") {
      throw e;
    }
  }
  
  // Denylist check
  const relativePath = path.relative(workspaceRoot, resolvedPath);
  for (const pattern of DENYLIST) {
    if (pattern.test(relativePath)) {
      throw new Error(`Path ${targetPath} is denylisted`);
    }
  }
  
  return resolvedPath;
}
