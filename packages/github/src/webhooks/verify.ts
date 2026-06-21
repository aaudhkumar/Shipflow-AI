import { verify } from "@octokit/webhooks-methods";

export async function verifyGithubWebhook(
  secret: string,
  payload: string,
  signature: string
): Promise<boolean> {
  try {
    return await verify(secret, payload, signature);
  } catch (error) {
    return false;
  }
}
