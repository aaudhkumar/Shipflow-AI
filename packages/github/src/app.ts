import { App } from "octokit";

let githubApp: App | null = null;

export function getGithubApp(): App {
  if (githubApp) return githubApp;

  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!appId || !privateKey) {
    throw new Error("Missing GITHUB_APP_ID or GITHUB_PRIVATE_KEY environment variables");
  }

  githubApp = new App({
    appId,
    privateKey,
    webhooks: webhookSecret ? { secret: webhookSecret } : undefined,
  });

  return githubApp;
}
