# Troubleshooting

Common issues and their fixes when developing or operating Shipflow.

## Database Connection Issues
**Symptom**: `pnpm dev` crashes with `connect ECONNREFUSED` or Drizzle throws a connection error.
**Fix**: Ensure your Postgres instance is running and the `DATABASE_URL` in `.env` is correct. 

## Auth Cookie Not Setting
**Symptom**: You can log in, but subsequent API calls return `401 Unauthorized`.
**Fix**: Check your `CORS_ALLOWED_ORIGINS` and `BETTER_AUTH_URL` in `.env`. The frontend domain must match the auth URL, and if running cross-origin in dev, ensure `credentials: true` is properly respected by your browser.

## Task Execution Hangs
**Symptom**: An AI task is triggered but remains in the "queued" state forever.
**Fix**: Ensure the Inngest local dev server is running (usually via `npx inngest-cli dev`). If Inngest is running, check that at least one AI provider key (`OPENAI_API_KEY`, etc.) is present in the `.env` of the worker process.

## Webhooks Failing
**Symptom**: GitHub PRs are not showing up in Shipflow.
**Fix**: Ensure your local environment is exposed to the internet (e.g., via ngrok) and that the GitHub App webhook URL points to your ngrok address. Verify that `GITHUB_WEBHOOK_SECRET` matches the one configured in the GitHub Developer Settings.
