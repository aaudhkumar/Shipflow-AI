import { db } from "@shipflow/db";
import { organizations, featureRequests } from "@shipflow/db/schema";
import { billingService } from "./packages/billing/src/services/billingService";
import { featureService } from "./packages/services/src/feature/feature.service";
import { config } from "dotenv";

config();

async function test() {
  try {
    const org = await db.query.organizations.findFirst();
    if (!org) {
      console.log("No org found");
      return;
    }
    const feature = await db.query.featureRequests.findFirst({
      where: (f, { eq }) => eq(f.orgId, org.id)
    });
    if (!feature) {
      console.log("No feature found");
      return;
    }

    console.log("Testing incrementAiReviewUsage...");
    await billingService.incrementAiReviewUsage(org.id);
    console.log("Increment success!");

    console.log("Testing startClarification...");
    await featureService.startClarification(feature.id, org.id, "system");
    console.log("StartClarification success!");

  } catch (err) {
    console.error("Test failed with error:", err);
  }
}

test();
