# Roadmap

This is the planned technical roadmap for Shipflow.

## Planned
- **Vector DB Integration**: Utilize Pinecone (currently in `.env.example`) to semantically search past PRDs and Tasks to prevent duplicate work.
- **Email Notifications**: Finalize integration with Resend (currently in `.env.example`) to alert users on Task Execution completion.
- **Advanced Workflows**: Multi-step AI executions where an AI drafting agent passes code to an AI reviewing agent before creating a PR.

## Under Consideration
- **Self-Hosted Runner**: A local daemon that allows the AI worker to execute `npm test` against local code before submitting PRs.
- **CORS Hardening (SEC-02)**: Removing any wildcard CORS fallbacks in `server.ts` and enforcing strict origins across all environments.
