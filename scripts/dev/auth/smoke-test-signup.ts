import { auth } from "@shipflow/auth";

async function main() {
  const res = await auth.api.signUpEmail({
    body: {
      email: "test2@test.com",
      password: "password123",
      name: "Test User",
    },
  });
  console.log("Success?", res);
}

main().catch(console.error);
