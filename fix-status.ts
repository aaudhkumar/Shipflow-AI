import { config } from 'dotenv';
config();
import { db } from './packages/db/index';
import { featureRequests } from './packages/db/schema';
import { eq } from 'drizzle-orm';
async function main() {
  await db.update(featureRequests).set({ status: 'IN_DEVELOPMENT' }).where(eq(featureRequests.id, 'a9470fe5-7704-4b5b-95b3-6d9cb9e16d9f'));
  console.log('Feature status reset to IN_DEVELOPMENT');
  process.exit(0);
}
main();
