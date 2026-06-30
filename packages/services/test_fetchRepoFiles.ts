import { fetchRepoFiles } from "./src/github/files";
import { Octokit } from "octokit";

async function run() {
  const octokit = new Octokit(); // Unauthenticated, works for public repos
  console.log("Fetching files for vercel/next.js canary branch...");
  const files = await fetchRepoFiles(octokit, "vercel", "next.js", "canary");
  console.log("Total files fetched:", files.length);
  if (files.length === 0) {
    console.log("0 files fetched. Debugging why...");
  } else {
    console.log("First file:", files[0].path);
  }
}
run().catch(console.error);
