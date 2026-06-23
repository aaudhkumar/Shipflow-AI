
## Plan: GitHub PR Review Publish Flow

Build the end-to-end ShipFlow pipeline so GitHub pull request events can trigger an AI review, then publish the review back onto the same PR on GitHub. The repo already has the right pieces in place, but they are only partially wired together: the webhook route verifies GitHub signatures, the AI package can produce structured review output, and the workflow package contains durable job examples. What is still missing is the real review orchestration path that fetches live diff data, calls the AI reviewer, maps findings into GitHub review payloads, posts the review, and records the lifecycle state.

**Steps**

1. Confirm the webhook contract for review-triggering events. The webhook route in [apps/web/src/app/api/webhooks/github/route.ts](apps/web/src/app/api/webhooks/github/route.ts) should stop emitting stub IDs and instead forward the real GitHub PR metadata needed downstream: repository owner, repository name, pull request number, head SHA, installation id, action type, and delivery id. This gives the rest of the system enough information to fetch the right diff, authenticate against the right installation, and deduplicate retries.

2. Add installation-scoped GitHub auth helpers in [packages/github/src/client.ts](packages/github/src/client.ts). The current helper creates a GitHub App client, but PR review publishing needs an installation-authenticated client tied to the repository that opened the PR. Add a helper that can derive an Octokit instance from installation context so all review and diff calls are scoped to the correct repository installation.

3. Introduce a dedicated PR review workflow in [packages/workflow/src/workflows/](packages/workflow/src/workflows/). This workflow should be the durable orchestration layer that handles the full review lifecycle from event receipt to GitHub publishing. The workflow should fetch PR metadata and diff content, call the AI reviewer, publish the review, and update status rows. Keep the webhook handler lightweight and move all retry-prone work into Inngest steps.

4. Fetch and normalize the PR diff from GitHub before invoking the AI. Use the installation-authenticated client to retrieve the changed files, raw patch data, and PR metadata. Assemble a review context object that includes the branch names, head SHA, file paths, and any prior review state needed for re-review behavior. This keeps the AI call deterministic and makes later comment posting possible.

5. Run the structured AI reviewer from [packages/ai/src/agents/code-reviewer/index.ts](packages/ai/src/agents/code-reviewer/index.ts) against the real PR diff. Preserve the structured schema in [packages/ai/src/agents/code-reviewer/schema.ts](packages/ai/src/agents/code-reviewer/schema.ts) so review output remains machine-readable. The prompt in [packages/ai/src/agents/code-reviewer/prompt.ts](packages/ai/src/agents/code-reviewer/prompt.ts) may need a small tightening pass so findings remain grounded in actual code changes rather than generic feedback.

6. Map AI findings into GitHub review payloads inside [packages/github](packages/github). Add a small adapter that converts each AI finding into the shape expected by GitHub review APIs. That adapter should normalize file paths, decide whether a finding can be posted inline or should fall back to a general comment, and preserve metadata useful for later auditing. This is the most sensitive part of the feature because GitHub review APIs are strict about commit SHAs, file names, and diff positions.

7. Publish the review back to GitHub from the workflow. The first implementation should create a GitHub review with inline comments where possible and a summary body based on the AI result. If a finding cannot be placed inline cleanly, the workflow should gracefully degrade to a general review comment instead of failing the whole run. After posting, persist the GitHub review id and current status so later synchronize events can supersede stale AI feedback.

8. Persist workflow and review lifecycle state. Reuse the database and workflow patterns already present in [packages/workflow/src/workflows/feature-lifecycle.ts](packages/workflow/src/workflows/feature-lifecycle.ts). The review pipeline should create or update a workflow run record, track running/completed/failed states, and store review metadata such as repository id, pull request number, review status, and AI usage data. If review tables already exist in the DB layer, extend them rather than creating a parallel storage model.

9. Handle re-review behavior when new commits arrive. When a PR receives a `synchronize` event, the workflow should recognize the changed head SHA and either create a new review cycle or supersede the prior one. The goal is to prevent stale AI comments from remaining attached to an outdated commit. Make the re-review decision explicit and tie it to stored workflow and review records.

10. Add idempotency protection around webhook deliveries. Use the GitHub delivery id as the idempotency key so webhook retries do not create duplicate AI reviews. The webhook route should reject duplicates early, and the workflow itself should remain safe to retry step by step. This should align with the existing event-driven design rather than introducing a second queueing path.

11. Add tests for the full critical path. Cover webhook verification, event dispatch, structured AI output, review mapping, and GitHub review publishing with mocked Octokit calls. The most important regression test should verify that a sample pull request event can flow from webhook to workflow to GitHub review creation. Add one test specifically for the mapping layer because that is where most GitHub API shape bugs tend to hide.

12. Update setup documentation for the required GitHub App and AI variables. Document the GitHub App installation requirements, webhook secret, app id, private key, and any AI keys needed for review generation. Add a short note explaining that ShipFlow can publish AI review feedback directly onto GitHub PRs, not just produce local output. Put this in the project docs or the main README section that already covers setup.

**Relevant files**

- [apps/web/src/app/api/webhooks/github/route.ts](apps/web/src/app/api/webhooks/github/route.ts) — replace stubs with real event payloads and preserve signature verification.
- [packages/github/src/client.ts](packages/github/src/client.ts) — add installation-scoped GitHub client helpers.
- [packages/github/src/webhooks/verify.ts](packages/github/src/webhooks/verify.ts) — keep as the signature gate for GitHub deliveries.
- [packages/github/src/index.ts](packages/github/src/index.ts) — export new GitHub helpers for the workflow layer.
- [packages/ai/src/agents/code-reviewer/index.ts](packages/ai/src/agents/code-reviewer/index.ts) — AI review entrypoint.
- [packages/ai/src/agents/code-reviewer/schema.ts](packages/ai/src/agents/code-reviewer/schema.ts) — structured review output contract.
- [packages/ai/src/agents/code-reviewer/prompt.ts](packages/ai/src/agents/code-reviewer/prompt.ts) — prompt tuning for grounded findings.
- [packages/workflow/src/client.ts](packages/workflow/src/client.ts) — event schema definitions for review-triggering events.
- [packages/workflow/src/workflows/feature-lifecycle.ts](packages/workflow/src/workflows/feature-lifecycle.ts) — reference for durable state transitions.
- [packages/workflow/src/workflows/generate-release-notes.ts](packages/workflow/src/workflows/generate-release-notes.ts) — reference for AI-driven workflow steps.
- [packages/workflow/src/index.ts](packages/workflow/src/index.ts) — export the new review workflow.
- [packages/db/schema.ts](packages/db/schema.ts) and related DB models — extend persistence if review lifecycle state is missing.
- [docs/final.md](docs/final.md) or [README.md](README.md) — document setup and runtime behavior.

**Verification**

1. Run focused tests for webhook verification and GitHub helper utilities to confirm valid signatures are accepted and invalid ones are rejected.
2. Run a unit test that feeds a sample diff into the code-review agent and verifies the returned object matches the schema.
3. Mock Octokit and assert the workflow publishes the correct review payload, including commit SHA, file paths, summary body, and inline comment data.
4. Exercise the workflow in a staging or local integration run to confirm a real GitHub PR receives a posted review.
5. Run typecheck and build validation for the touched packages to confirm the new workflow exports and helpers compile cleanly.

**Decisions**

- Keep the current package split as the implementation boundary: `github` for GitHub auth/API helpers, `ai` for structured review generation, and `workflow` for orchestration.
- Use GitHub App installation auth for review publishing so repository access stays scoped correctly.
- Treat GitHub delivery ids as the idempotency key for review-triggering webhook events.
- Prefer a durable workflow over inline webhook processing so retries are safe and review generation can recover cleanly.
- Keep the structured AI schema instead of free-text review output because it is what enables deterministic publishing.

**Further Considerations**

1. Decide whether to always publish a single GitHub review with inline comments or to allow a fallback path of general comments when line mapping fails.
2. Decide whether to store full per-comment review history or only the posted GitHub review id and current status.
3. Decide whether stale AI comments should be dismissed automatically on synchronize events or simply superseded by the next review cycle.
