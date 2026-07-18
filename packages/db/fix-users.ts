import { db } from "./index";
import { users } from "./models/users";

async function main() {
  await db.update(users).set({ emailVerified: true });
  console.log("Updated all users to emailVerified = true");
  process.exit(0);
}

main().catch(console.error);
