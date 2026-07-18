import { Octokit } from "octokit";

type ReviewComment = {
  filePath: string;
  lineNumber: number | null;
  findingType:
    | "SECURITY"
    | "PERFORMANCE"
    | "ARCHITECTURE"
    | "TASK_DEVIATION"
    | "CODE_QUALITY"
    | "EDGE_CASE"
    | "TEST_COVERAGE";
  comment: string;
  isBlocking: boolean;
  suggestedFix?: string;
};

type CodeReviewResult = {
  comments: ReviewComment[];
  summary: string;
};

/**
 * Parses the unified diff patch to map file lines back to precise position indices
 * required by the GitHub Pull Request Review API.
 */
export function findDiffPosition(patch: string, targetLine: number): number | null {
  const lines = patch.split("\n");
  let currentLine = 0;
  let position = 0;

  for (const line of lines) {
    position++;

    // Hunk header e.g., @@ -1,5 +1,6 @@
    if (line.startsWith("@@")) {
      const match = line.match(/\+([0-9]+)/);
      if (match && match[1]) {
        currentLine = parseInt(match[1], 10) - 1;
      }
      continue;
    }

    // Deletions don't advance the right-side line number
    if (line.startsWith("-")) {
      continue;
    }

    currentLine++;

    // Additions and context lines advance the right-side line number
    if (currentLine === targetLine && (line.startsWith("+") || line.startsWith(" "))) {
      // If it's a context line, GitHub requires the comment to be on an added/modified line
      // or at least within the patch. If it's outside the patch, we'll return null.
      return position;
    }
  }

  return null;
}

export async function postReviewComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  commitId: string,
  reviewResult: CodeReviewResult,
  filesWithPatches: { filename: string; patch: string }[],
): Promise<{ id: number; htmlUrl: string; state: string }> {
  const inlineComments: any[] = [];
  const generalComments: string[] = [];

  // Group comments by inline vs general
  for (const comment of reviewResult.comments) {
    if (!comment.lineNumber) {
      generalComments.push(`**[${comment.findingType}]** ${comment.filePath}\n${comment.comment}`);
      continue;
    }

    // Try to find the file and map the line number to a diff position
    const file = filesWithPatches.find((f) => f.filename === comment.filePath);
    let position = null;

    if (file?.patch) {
      position = findDiffPosition(file.patch, comment.lineNumber);
    }

    if (position) {
      inlineComments.push({
        path: comment.filePath,
        position,
        body: `**[${comment.findingType}]**\n${comment.comment}${comment.suggestedFix ? `\n\n\`\`\`\n${comment.suggestedFix}\n\`\`\`` : ""}`,
      });
    } else {
      // Fallback to general comment if line cannot be mapped
      generalComments.push(
        `**[${comment.findingType}]** ${comment.filePath}:${comment.lineNumber}\n${comment.comment}`,
      );
    }
  }

  // Construct the main review body
  let reviewBody = `### ShipFlow AI Code Review\n\n${reviewResult.summary}\n\n`;
  if (generalComments.length > 0) {
    reviewBody += `#### General Findings\n\n${generalComments.map((c) => `- ${c}`).join("\n\n")}`;
  }

  const hasBlockingFindings = reviewResult.comments.some((c) => c.isBlocking);

  // Post the review
  let eventType = hasBlockingFindings ? "REQUEST_CHANGES" : "COMMENT";
  let response: any;
  let reviewId: number;

  // Step 1: Create a pending review with all the comments
  try {
    const createRes = await octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      commit_id: commitId,
      body: reviewBody,
      comments: inlineComments,
    });
    reviewId = createRes.data.id;
    response = createRes;
  } catch (error) {
    throw error;
  }

  // Step 2: Submit the review
  try {
    response = await octokit.rest.pulls.submitReview({
      owner,
      repo,
      pull_number: prNumber,
      review_id: reviewId,
      event: eventType as any,
    });
  } catch (error: any) {
    if (
      eventType === "REQUEST_CHANGES" &&
      error.message &&
      error.message.includes("request changes on your own pull request")
    ) {
      // Fallback to COMMENT if the PR was authored by the bot itself
      // We also update the review body to explain why it's a comment
      const fallbackBody = `> [!WARNING]\n> **Changes Requested**: GitHub does not allow bots to formally "Request Changes" on their own Pull Requests, but this review contains blocking findings that must be addressed.\n\n` + reviewBody;
      
      await octokit.rest.pulls.updateReview({
        owner,
        repo,
        pull_number: prNumber,
        review_id: reviewId,
        body: fallbackBody,
      });

      response = await octokit.rest.pulls.submitReview({
        owner,
        repo,
        pull_number: prNumber,
        review_id: reviewId,
        event: "COMMENT",
      });

      // Manually override the state so our internal DB still tracks it as a blocking review
      response.data.state = "CHANGES_REQUESTED";
    } else {
      throw error;
    }
  }

  return {
    id: response.data.id,
    htmlUrl: response.data.html_url,
    state: response.data.state,
  };
}
