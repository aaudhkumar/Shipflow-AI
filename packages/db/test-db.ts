import { db } from "./packages/db/index.ts";
db.query.subscriptions.findMany().then(console.log).catch(console.error);
