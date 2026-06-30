import { db } from "./packages/db/index";
import { featureRequests } from "./packages/db/models/features";
import { prds, prdVersions } from "./packages/db/models/prds";
import { eq } from "drizzle-orm";

async function run() {
  const feats = await db.query.featureRequests.findMany({
    with: {
      prds: { with: { currentVersion: true, versions: true } }
    },
    limit: 5,
    orderBy: (f, { desc }) => [desc(f.createdAt)]
  });
  console.log(JSON.stringify(feats, null, 2));
  process.exit(0);
}
run();
