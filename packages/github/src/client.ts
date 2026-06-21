import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";

export function getGithubClient(): Octokit {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error("Missing GitHub App credentials in environment variables");
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
    },
  });
}
