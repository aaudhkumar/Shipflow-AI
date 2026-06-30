import { db } from "./packages/db/src/index";
import { pullRequests, organizations } from "./packages/db/models/index";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
  const prs = await db.select().from(pullRequests);
  console.log("PRs:", prs.length);
  prs.forEach(p => console.log(` - ID: ${p.id}, PR#: ${p.githubPrNumber}, Repo: ${p.repositoryId}`));
}
run().catch(console.error);
