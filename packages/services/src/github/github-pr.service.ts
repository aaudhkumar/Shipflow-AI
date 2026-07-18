import { getInstallationOctokit } from "@shipflow/github";
import { EnsureBranchInput, OpenOrUpdatePrInput } from "./model";

class GithubPrService {
  public async ensureBranch(input: EnsureBranchInput) {
    const octokit = await getInstallationOctokit(input.installationId);
    try {
      await octokit.rest.repos.getBranch({ owner: input.owner, repo: input.repo, branch: input.branch });
    } catch {
      const { data: ref } = await octokit.rest.git.getRef({
        owner: input.owner, repo: input.repo, ref: `heads/${input.defaultBranch}`,
      });
      await octokit.rest.git.createRef({
        owner: input.owner, repo: input.repo, ref: `refs/heads/${input.branch}`, sha: ref.object.sha,
      });
    }
  }

  public async openOrUpdatePullRequest(input: OpenOrUpdatePrInput) {
    const octokit = await getInstallationOctokit(input.installationId);
    const existing = await octokit.rest.pulls.list({
      owner: input.owner, repo: input.repo, head: `${input.owner}:${input.branch}`, state: "open",
    });
    
    // Hard constraint #6: metaBlock is built from trusted function parameters supplied by the orchestrator, never from the LLM's output
    const taskIdLine = input.taskId ? `\ntaskId: ${input.taskId}` : '';
    const metaBlock = `<!-- shipflow:meta\nfeatureRequestId: ${input.featureRequestId}\nprdId: ${input.prdId}${taskIdLine}\n-->`;
    
    // Basic sanitization
    const sanitizedSummary = input.summary.replace(/<!--[\s\S]*?-->/g, "");
    
    const body = `${metaBlock}\n\n${sanitizedSummary}`;

    if (existing.data[0]) {
      await octokit.rest.pulls.update({ owner: input.owner, repo: input.repo, pull_number: existing.data[0].number, body });
      return existing.data[0];
    }
    const { data } = await octokit.rest.pulls.create({
      owner: input.owner, repo: input.repo, head: input.branch, base: input.defaultBranch,
      title: input.title, body, draft: input.draft,
    });
    return data;
  }
}

export default GithubPrService;
