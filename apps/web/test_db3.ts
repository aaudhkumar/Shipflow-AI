import { db } from "@shipflow/db";
import { pullRequests, organizations } from "@shipflow/db/schema";

async function run() {
  const prs = await db.select().from(pullRequests);
  console.log("PRs:", prs.length);
  prs.forEach(p => console.log(` - ID: ${p.id}, PR#: ${p.githubPrNumber}, orgId: ${p.orgId}`));
}
run().catch(console.error);
