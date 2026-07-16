import { config } from 'dotenv';
config();
import { db } from '@shipflow/db';
import { featureRequests } from '@shipflow/db/schema';
import { eq } from 'drizzle-orm';
async function main() {
  const featureId = process.argv[2];
  if (!featureId) {
    console.error('Usage: tsx reset-feature-status.ts <feature-id>');
    process.exit(1);
  }
  await db.update(featureRequests).set({ status: 'IN_DEVELOPMENT' }).where(eq(featureRequests.id, featureId));
  console.log(`Feature ${featureId} status reset to IN_DEVELOPMENT`);
  process.exit(0);
}
main();
