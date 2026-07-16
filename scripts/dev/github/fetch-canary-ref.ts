import { Octokit } from "octokit";

const octokit = new Octokit(); // No auth for public repo
const owner = "vercel";
const repo = "next.js";
const branch = "canary";

async function run() {
  const { data: ref } = await octokit.request("GET /repos/{owner}/{repo}/git/ref/{ref}", {
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  console.log("Ref SHA:", ref.object.sha);

  const { data: tree } = await octokit.request("GET /repos/{owner}/{repo}/git/trees/{tree_sha}", {
    owner,
    repo,
    tree_sha: ref.object.sha,
    recursive: "1",
  });
  console.log("Total tree items:", tree.tree.length);

  const INDEXABLE = new Set([".ts", ".tsx", ".js", ".jsx", ".md"]);
  const indexableFiles = tree.tree.filter((item: any) => {
    if (item.type !== "blob") return false;
    const ext = item.path.substring(item.path.lastIndexOf("."));
    return INDEXABLE.has(ext.toLowerCase()) && (item.size || 0) < 100000;
  });
  console.log("Indexable files:", indexableFiles.length);
}
run().catch(console.error);
