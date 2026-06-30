import { db } from "@shipflow/db";
import { pullRequests, organizations } from "@shipflow/db/schema";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(import.meta.dirname, "../../.env") });

async function run() {
  const orgs = await db.select().from(organizations);
  console.log("Orgs:");
  orgs.forEach(o => console.log(` - ${o.id} / ${o.slug}`));

  const prs = await db.select().from(pullRequests);
  console.log("PRs:");
  if (prs.length === 0) console.log(" - No PRs found");
  prs.forEach(p => console.log(` - ID: ${p.id}, githubPrNumber: ${p.githubPrNumber}, orgId: ${p.orgId}`));
}
run().catch(console.error);
