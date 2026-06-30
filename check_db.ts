import { db } from './packages/db/src/index';
import { webhookEvents } from './packages/db/models/index';
import { desc, like } from 'drizzle-orm';

async function check() {
  const events = await db.query.webhookEvents.findMany({
    where: like(webhookEvents.eventType, 'issues%'),
    orderBy: [desc(webhookEvents.createdAt)],
    limit: 5
  });
  console.log(JSON.stringify(events, null, 2));
  process.exit(0);
}
check();
