import { provisionSandbox, teardownSandbox } from "./sandbox";
import { buildContextForTask } from "./context/build-context";
import { runImplementationLoop } from "./loop/implementation-loop";
import GithubPrService from "../../../packages/services/src/github/github-pr.service";
import simpleGit from "simple-git";
import { getInstallationOctokit } from "@shipflow/github";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function handleImplement({ taskId, simulateThrow }: { taskId: string; simulateThrow?: boolean }) {
  let sandbox = null;
  const tempDir = path.join(process.cwd(), ".sandbox", taskId);
  
  try {
    sandbox = await provisionSandbox();
    
    if (simulateThrow) {
      throw new Error("Simulated failure");
    }
    
    // 1. Build context and get DB data
    const context = await buildContextForTask(taskId);
    if (!context.repoData || !context.installationData) {
      throw new Error("Missing repository or github installation data. Cannot clone or push.");
    }

    const { repoData, installationData, taskData, prdData, featureData } = context;
    const owner = installationData.accountLogin;
    const repo = repoData.fullName.split('/')[1] || repoData.fullName;
    
    // 2. Clone the repository
    const octokit = await getInstallationOctokit(installationData.installationId);
    const { data: { token } } = await octokit.rest.apps.createInstallationAccessToken({
      installation_id: installationData.installationId
    });

    const repoUrl = `https://x-access-token:${token}@github.com/${repoData.fullName}.git`;
    
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
    
    const git = simpleGit(tempDir);
    await git.clone(repoUrl, ".");

    // 3. Ensure branch exists and checkout
    const branchName = `shipflow/task-${taskId.slice(0, 8)}`;
    const githubPrService = new GithubPrService();
    
    // Instead of using octokit to create the branch upfront (which often fails with integration errors),
    // we'll create it locally and let git push create the remote branch.
    await git.checkoutLocalBranch(branchName);

    // 4. Run the LLM implementation loop
    const result = await runImplementationLoop(taskId, tempDir);

    // 5. Commit and push changes
    await git.add(".");
    const status = await git.status();
    
    let commitSha = "no-changes";
    if (status.files.length === 0) {
      const summary = result.text ? result.text.slice(0, 500) : "No text generated";
      throw new Error(`The AI did not make any changes. AI Response: ${summary}`);
    }

    const commitMessage = `Implement ${taskData.title}\n\nTask-ID: ${taskId}\nExecuted-By: Shipflow AI`;
    
    // Use bot config for git
    await git.addConfig("user.name", "Shipflow AI");
    await git.addConfig("user.email", "ai@shipflow.com");
    
    const commitRes = await git.commit(commitMessage);
    commitSha = commitRes.commit;
    
    // Push changes and create upstream branch
    await git.push(["-u", "origin", branchName]);

    // 6. Open Pull Request
    const prTitle = `[Shipflow] Implement: ${taskData.title}`;
    const prSummary = `### Summary\nThis PR implements the task **${taskData.title}**.\n\n### Changes Made\n${result.text}`;
    
    await githubPrService.openOrUpdatePullRequest({
      installationId: installationData.installationId,
      owner,
      repo,
      branch: branchName,
      defaultBranch: repoData.defaultBranch,
      title: prTitle,
      summary: prSummary,
      featureRequestId: featureData.id,
      prdId: prdData.id
    });

    return { success: true, branch: branchName, commitSha };
  } catch (err) {
    return { success: false, error: String(err), branch: "error" };
  } finally {
    if (sandbox) {
      await teardownSandbox(sandbox);
    }
    // Clean up temporary sandbox directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.warn("Failed to clean up sandbox dir:", e);
    }
  }
}
