import { db } from "@shipflow/db";
import { repositories, githubInstallations } from "@shipflow/db/schema";
import { getInstallationOctokit } from "./src/github/client";
import { fetchRepoFiles } from "./src/github/files";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function run() {
  const repo = await db.query.repositories.findFirst();
  if (!repo) {
    console.log("No repositories found in DB.");
    return;
  }
  const installation = await db.query.githubInstallations.findFirst({
    where: eq(githubInstallations.orgId, repo.orgId)
  });
  if (!installation) {
    console.log("No github installation found.");
    return;
  }
  
  console.log(`Testing with repo: ${repo.fullName}, orgId: ${repo.orgId}, installId: ${installation.installationId}`);
  
  const octokit = await getInstallationOctokit(installation.installationId);
  
  const parts = repo.fullName.split("/");
  const owner = parts[0];
  const name = parts[1];
  
  console.log("Calling fetchRepoFiles...");
  try {
    const files = await fetchRepoFiles(octokit, owner, name, repo.defaultBranch || "main");
    console.log(`Fetched ${files.length} files successfully.`);
    if (files.length > 0) {
      console.log(`First file: ${files[0].path} (${files[0].content.length} chars)`);
    }
  } catch (err: any) {
    console.log("fetchRepoFiles threw an error:");
    console.log(err.message || err);
  }
}

run().catch(console.error);
