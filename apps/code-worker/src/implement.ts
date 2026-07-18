import { provisionSandbox, teardownSandbox } from "./sandbox";
import { buildContextForTask } from "./context/build-context";
import { runImplementationLoop } from "./loop/implementation-loop";
import GithubPrService from "@shipflow/services/github/github-pr.service";
import simpleGit from "simple-git";
import { getInstallationOctokit } from "@shipflow/github";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { inngest } from "@shipflow/services/workflow/client";
import { db } from "@shipflow/db";
import { pullRequests } from "@shipflow/db/schema";
import { eq, and } from "drizzle-orm";

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
    
    // Check if the remote branch already exists (e.g., during a redo)
    try {
      const remoteBranches = await git.listRemote(["--heads", "origin", branchName]);
      if (remoteBranches && remoteBranches.trim().length > 0) {
        console.log(`Remote branch ${branchName} exists. Fetching and checking out to iterate on previous code.`);
        await git.fetch("origin", branchName);
        await git.checkout(branchName);
      } else {
        console.log(`Remote branch ${branchName} does not exist. Creating new branch from main.`);
        await git.checkoutLocalBranch(branchName);
      }
    } catch (error) {
      console.warn(`Error checking remote branch, falling back to new branch:`, error);
      await git.checkoutLocalBranch(branchName);
    }

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
    
    // Push changes and create upstream branch (force push to overwrite previous attempts)
    await git.push(["-u", "origin", branchName, "--force"]);

    // 6. Open Pull Request
    const prTitle = `[Shipflow] Implement: ${taskData.title}`;
    const prSummary = `### Summary\nThis PR implements the task **${taskData.title}**.\n\n### Changes Made\n${result.text}`;
    
    const prData = await githubPrService.openOrUpdatePullRequest({
      installationId: installationData.installationId,
      owner,
      repo,
      branch: branchName,
      defaultBranch: repoData.defaultBranch,
      title: prTitle,
      summary: prSummary,
      featureRequestId: featureData.id,
      prdId: prdData.id,
      taskId: taskId,
      draft: false
    });

    // Ensure the PR is in our database since GitHub Apps don't receive webhooks for their own actions
    const existingPrs = await db
      .select()
      .from(pullRequests)
      .where(and(eq(pullRequests.repositoryId, repoData.id), eq(pullRequests.githubPrNumber, prData.number)))
      .limit(1);

    let prRecord = existingPrs[0];

    if (!prRecord) {
      const [inserted] = await db
        .insert(pullRequests)
        .values({
          orgId: repoData.orgId,
          repositoryId: repoData.id,
          githubPrNumber: prData.number,
          title: prTitle,
          url: prData.html_url,
          state: "OPEN",
          headSha: commitSha,
          baseBranch: repoData.defaultBranch,
          featureRequestId: featureData.id,
          taskId: taskId,
        })
        .returning();
      prRecord = inserted!;
    } else {
      await db
        .update(pullRequests)
        .set({ 
          headSha: commitSha, 
          title: prTitle, 
          updatedAt: new Date(),
          featureRequestId: featureData.id,
          taskId: taskId,
        })
        .where(eq(pullRequests.id, prRecord.id));
    }

    // Trigger PR review manually
    await inngest.send({
      name: "github.pr.opened",
      data: {
        pullRequestId: prRecord.id,
        repositoryId: repoData.id,
        githubPrNumber: prData.number,
        orgId: repoData.orgId,
        repoOwner: owner,
        repoName: repo,
        headSha: commitSha,
        installationId: installationData.installationId,
        action: existingPrs.length > 0 ? "synchronize" : "opened",
        deliveryId: crypto.randomUUID(),
      },
    });

    const successResult = { success: true, branch: branchName, commitSha };
    await inngest.send({
      name: "tasks.implementation.completed",
      data: { taskId, ...successResult }
    });
    return successResult;
  } catch (err) {
    const errorResult = { success: false, error: String(err), branch: "error" };
    await inngest.send({
      name: "tasks.implementation.completed",
      data: { taskId, ...errorResult }
    });
    return errorResult;
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
