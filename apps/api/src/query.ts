import { db } from "@shipflow/db";
import { featureRequests, clarificationThreads, clarificationMessages } from "@shipflow/db/schema";
import { eq, ilike } from "drizzle-orm";

async function run() {
  const features = await db.query.featureRequests.findMany({
    where: ilike(featureRequests.title, '%two pointer%'),
    with: {
      clarificationThreads: {
        with: {
          messages: true
        }
      }
    }
  });
  console.log(JSON.stringify(features, null, 2));
}
run();
