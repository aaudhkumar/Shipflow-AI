# Shipflow Documentation Implementation Plan + Antigravity Prompt Pack

> Reference inspiration: the doc set in [`ishaansatapathy/Thread`](https://github.com/ishaansatapathy/Thread) (`README.md`, `DOCS.md`, `DEMO.md`, `JUDGE_WALKTHROUGH.md`, `mcp-server.json`, Scalar/OpenAPI reference). This plan keeps the same *shape* — judge-friendly README, deep technical doc, demo/walkthrough doc, full API reference, MCP appendix — but renames and re-purposes every section for **Shipflow**, an AI evaluation engine, and adds eval-specific extras Thread didn't need (scoring methodology, dataset/benchmark docs, regression detection, CI integration).

This document has two parts:

1. **The plan** — what files to create, why, in what order, and exactly which headings each file should contain.
2. **The Antigravity prompt pack** — copy-paste-ready prompts, split section-by-section (as requested), so you can run them one at a time inside Antigravity and review each output before moving to the next.

Throughout, replace bracketed placeholders like `[SHIPFLOW_STACK]`, `[FEATURE_LIST]`, `[API_BASE_URL]` with your actual values — or let the Discovery prompt (Prompt 0) fill them in automatically by reading your codebase.

---

## 1. Why this structure

| Thread file / section | Purpose in Thread | Shipflow equivalent | Notes |
|---|---|---|---|
| `README.md` | First-impression overview, feature table, quickstart, architecture diagram | `README.md` | Keep it scannable in under 3 minutes — this is what a recruiter, judge, or new dev sees first |
| `DOCS.md` | Deep technical reference: auth, full REST surface, env vars, local dev | `DOCS.md` | The "everything in one place" doc for engineers integrating with Shipflow |
| `DEMO.md` | Judge/demo walkthrough with screenshots, live links, step-by-step script | `DEMO.md` | Renamed conceptually to an **Evaluator Walkthrough** but keep the filename for convention |
| `JUDGE_WALKTHROUGH.md` | Condensed 60-second reviewer path | `JUDGE_WALKTHROUGH.md` (optional) | Keep only if Shipflow is being submitted to a hackathon/demo day; otherwise fold into `DEMO.md` |
| Scalar UI + `openapi.json` | Interactive API reference | Scalar/Redoc UI + `openapi.json` | Section 5 below covers endpoint-doc generation |
| `mcp-server.json` + MCP section | Lets Claude/Cursor call the app's tools directly | `mcp-server.json` (if Shipflow exposes an MCP server for running/inspecting evals from an AI client) | Optional — only build this if Shipflow actually has or will have an MCP server |
| Feature table in README | One-line summary of each capability + the underlying APIs used | `docs/features/*.md` | Thread did this inline; Shipflow gets a full page per feature since an eval engine has more configuration surface (scorers, datasets, rubrics) |
| Engineering Highlights section | Security/architecture bragging rights for reviewers | `docs/architecture.md` + a condensed version in `DEMO.md` | |
| *(not in Thread — eval-specific)* | — | `docs/methodology.md` | How Shipflow scores/grades model outputs — critical for trust in an eval product |
| *(not in Thread — eval-specific)* | — | `docs/features/regression-detection.md`, `docs/features/ci-cd-integration.md` | Eval engines live or die on CI integration and catching regressions |

---

## 2. Target file tree

```
shipflow/
├── README.md
├── DOCS.md
├── DEMO.md
├── JUDGE_WALKTHROUGH.md          # optional — drop if not demo/hackathon-bound
├── CONTRIBUTING.md
├── SECURITY.md
├── CHANGELOG.md
├── mcp-server.json               # optional — only if MCP server exists
├── .env.example                  # annotated, not just bare keys
└── docs/
    ├── architecture.md
    ├── methodology.md            # scoring/grading rubric + judge-model methodology
    ├── glossary.md
    ├── roadmap.md
    ├── troubleshooting.md
    ├── faq.md
    ├── features/
    │   ├── eval-suites.md
    │   ├── eval-runs.md
    │   ├── scorers-and-graders.md
    │   ├── datasets.md
    │   ├── model-and-prompt-comparison.md
    │   ├── regression-detection.md
    │   ├── reports-and-dashboards.md
    │   ├── ci-cd-integration.md
    │   ├── webhooks-and-notifications.md
    │   └── sdk-and-cli.md
    └── api/
        ├── overview.md
        ├── authentication.md
        ├── endpoints-eval-suites.md
        ├── endpoints-eval-runs.md
        ├── endpoints-datasets.md
        ├── endpoints-scorers.md
        ├── endpoints-reports.md
        ├── endpoints-webhooks.md
        └── mcp.md                # optional
```

> The `docs/features/*.md` file names above assume a typical AI-eval-engine feature set (suites, runs, scorers, datasets, comparison, regression detection, reports, CI, webhooks, SDK/CLI). **Confirm or correct this list against Shipflow's actual feature set before running Prompt D** — Prompt 0 (Discovery) is designed to regenerate this list from your real codebase rather than from this assumption.

---

## 3. Phased implementation plan

| Phase | Deliverable | Depends on | Why this order |
|---|---|---|---|
| 0 — Discovery | A `docs/_facts.md` scratch file: real feature list, real endpoint list, real env vars, real stack | Codebase access | Every later prompt should *quote* this file instead of guessing, which is what prevents hallucinated docs |
| 1 — Core docs | `README.md`, `DOCS.md` | Phase 0 | These two are read first by everyone — get them right before going deep |
| 2 — Feature docs | `docs/features/*.md` | Phase 0 + 1 | One page per capability, cross-linked from the README feature table |
| 3 — API reference | `openapi.json`, Scalar/Redoc UI, `docs/api/*.md` | Phase 0 | Endpoint docs are mechanical once the discovery pass has the real route list |
| 4 — Demo/walkthrough docs | `DEMO.md`, `JUDGE_WALKTHROUGH.md` | Phases 1–3 | Needs the other docs to exist so it can link out to them instead of duplicating content |
| 5 — Extras | `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `docs/architecture.md`, `docs/methodology.md`, `docs/glossary.md`, `docs/roadmap.md`, `docs/troubleshooting.md`, `docs/faq.md` | Phases 1–3 | Polish layer — improves trust and onboarding but isn't load-bearing for a first release |
| 6 — QA pass | Cross-link check, dead-link check, terminology consistency check | All previous | Catches drift between docs written in different sessions |

---

## 4. Heading specs per core file

Use these as the literal `##` structure when prompting Antigravity — it keeps every doc skimmable and consistent with the Thread-inspired shape.

**`README.md`**
1. Title + one-line positioning statement
2. "Start here" callout for evaluators/reviewers (mirrors Thread's judge callout) linking to `DEMO.md`
3. Feature table (Feature | Description | Key APIs/Tools used)
4. What it does (bullet summary per major surface: Suites, Runs, Scorers, Datasets, Reports, SDK/CLI)
5. Architecture diagram (ASCII) + key packages table
6. Prerequisites
7. Quick start (clone → install → configure env → migrate → run)
8. Development commands table
9. Testing (unit + e2e)
10. MCP server section (if applicable)
11. Observability (metrics/health endpoints)
12. API documentation pointer (Scalar/Redoc URL, OpenAPI JSON URL)
13. Webhooks section (if applicable)
14. Demo / quick login instructions (if applicable)
15. Production deployment runbook
16. Security notes

**`DOCS.md`**
1. Architecture
2. Authentication (browser session, API key, headless/CI)
3. REST API (grouped by resource, with endpoint → underlying-operation mapping table, mirroring Thread's "Corsair operation" column but for Shipflow's own internal operations or third-party model providers)
4. Eval execution engine internals (queueing, workers, scoring pipeline) — Shipflow-specific, no Thread equivalent
5. Webhooks & real-time sync (if applicable)
6. AI & scoring layer (which model providers, which scorer types, token/cost accounting)
7. Non-REST endpoints reference table (`/health`, `/ready`, `/metrics`, `/openapi.json`, `/docs`)
8. Environment variables table
9. Local development
10. Documentation completeness checklist (mirrors Thread's "Judge checklist")

**`DEMO.md`**
1. Quick links table (live app, docs, demo login, MCP, pitch material if any)
2. Reviewer visuals table (screen → what to look for → live link)
3. N-minute guided walkthrough, step by step, each step naming the exact feature and the exact API calls it triggers
4. Integration map table (capability → underlying API/operation → where it's used in the codebase)
5. Engineering highlights (security, architecture, observability) — condensed pointer to `docs/architecture.md`

---

## 5. The Antigravity prompt pack

Run these **in order**, one at a time, in separate Antigravity turns. Each prompt is self-contained — paste the whole code block as your message to Antigravity. Review the diff/output before running the next one.

### Prompt 0 — Discovery & facts pass (run first, always)

```text
You are documenting an existing codebase called Shipflow, an AI evaluation engine. Before writing any documentation, do a discovery pass and produce a single scratch file at docs/_facts.md (create the docs/ folder if it doesn't exist).

Do NOT invent or assume anything. For every fact below, either find it in the actual codebase and cite the file path, or write "UNKNOWN — needs input" if you can't find it.

Inspect the repo and extract:
1. Tech stack: language(s), frameworks, package manager, database, ORM, queue/worker system, frontend framework if any.
2. Every public route/endpoint: HTTP method, path, the file that defines it, and a one-line description of what it does. Group these by resource (e.g. eval suites, eval runs, datasets, scorers, reports, webhooks, auth, health/metrics).
3. Every distinct "feature" the product has — derive this from route groups, service/module names, and any existing README or marketing copy in the repo. List each with a one-sentence description.
4. Auth model: session/cookie, API key, JWT, OAuth — whatever is actually implemented, with the relevant file paths.
5. All environment variables referenced anywhere in the code (search for process.env, os.environ, config files, .env.example) — list each with: required/optional, what it's for, and which file references it.
6. Whether an MCP server exists in this codebase (search for "mcp", "model context protocol", "tools/list", "tools/call"). If yes, list every exposed tool with its name and one-line description.
7. Whether webhooks are implemented (incoming or outgoing) and what triggers them.
8. Existing scripts in package.json / Makefile / pyproject.toml relevant to dev, build, test, migrate, lint.
9. Any existing OpenAPI/Swagger spec file, and its path if present.
10. Any existing partial docs (README, docs/ folder, comments) — note what's already documented so later prompts don't duplicate it.

Output docs/_facts.md as a set of clearly labeled markdown tables/lists, one section per item above. This file is for internal use by later documentation prompts — keep it factual and terse, not polished prose. End the file with a "Gaps & open questions" section listing anything you marked UNKNOWN, so the human can fill it in before the next prompt runs.
```

After this runs, **open `docs/_facts.md` and fill in any `UNKNOWN` lines yourself** before continuing — this is the single highest-leverage five minutes in the whole process, since every later prompt is told to quote this file instead of guessing.

---

### Prompt B — `README.md`

```text
Using docs/_facts.md as your source of truth (do not invent facts not present there or in the actual code), write README.md for Shipflow, an AI evaluation engine.

Structure, in this exact order, using `##` headings:
1. Title + one-line positioning statement describing what Shipflow does and who it's for.
2. A short callout near the top aimed at someone evaluating/reviewing the project for the first time, pointing them to DEMO.md for a fast walkthrough.
3. A feature table with columns: Feature | Description | Key APIs / internal modules used. Populate rows from the feature list in docs/_facts.md.
4. A "What it does" section: one bullet per major surface (eval suites, eval runs, scorers/graders, datasets, comparison/reports, SDK or CLI, webhooks) — only include surfaces that actually exist per docs/_facts.md.
5. An architecture section with an ASCII box diagram showing the major components (frontend if any, API layer, database, queue/worker for running evals, model-provider integrations, MCP server if present) and a "Key packages" table if this is a monorepo.
6. Prerequisites (runtime versions, database, any required API keys for model providers, from docs/_facts.md).
7. Quick start: clone, install, copy .env.example to .env, run migrations, start dev servers — use the actual commands found in package.json/Makefile/pyproject.toml.
8. A development commands table (dev, build, type-check, lint, test, migrate, studio/db-gui if any).
9. A testing section covering unit tests and end-to-end tests if both exist.
10. An MCP server section ONLY if docs/_facts.md confirms one exists — list the tool count and link to docs/api/mcp.md for the full list.
11. An observability section listing /health, /ready, /metrics or equivalent, with example curl commands.
12. An "API Documentation" section pointing to the OpenAPI JSON and the Scalar/Redoc UI URL (use placeholders {BASE_URL}/docs and {BASE_URL}/openapi.json if not yet deployed).
13. A webhooks section ONLY if webhooks exist per docs/_facts.md.
14. A deployment section with a numbered runbook (env vars required, build command, start command) — keep it generic if no specific hosting provider is confirmed, but call out anything provider-specific found in the repo (e.g. railway.toml, vercel.json, Dockerfile).
15. A security notes section: list actual safeguards found in the code (rate limiting, auth checks, input validation, secrets handling) — do not list anything not actually implemented.

Formatting rules: minimal emoji, real markdown tables (not bullet-faked tables), code fences for every command and curl example, every internal doc file referenced as a relative markdown link so the README works as a hub. Keep total length scannable — this is the front door, not the full manual.
```

---

### Prompt C — `DOCS.md`

```text
Using docs/_facts.md and the actual route/service code, write DOCS.md — the deep technical reference for Shipflow.

Structure, in this exact order, using `##` headings, numbered 1 through 10:

1. Architecture — expand on the README diagram with one paragraph per component, what it owns, and what it talks to.
2. Authentication — document every auth mechanism that actually exists (browser session/cookie, API key header, JWT, OAuth) with the exact header/cookie names and the file that enforces them.
3. REST API — group endpoints by resource (eval suites, eval runs, datasets, scorers, reports, webhooks, auth, health). For each group, produce a table: Endpoint | Method | What it does | Request/response shape summary. Pull this directly from the endpoint list in docs/_facts.md — do not invent endpoints.
4. Evaluation engine internals — describe how an eval run actually executes: how a run is queued, how the worker picks it up, how scorers are invoked, how results are persisted, and how partial/streaming results (if any) are surfaced to the client. This section has no Thread equivalent — write it from the actual queue/worker/service code.
5. Webhooks & real-time sync — ONLY if these exist; otherwise write "Not currently implemented" and skip to section 6.
6. AI & scoring layer — list every model provider integrated (OpenAI, Anthropic, etc.), every scorer/grader type implemented (rule-based, model-graded/LLM-as-judge, human-review, custom function), and how cost/token usage is tracked if it is.
7. Non-REST endpoints reference — table of /health, /ready, /metrics, /openapi.json, /docs, and any other infrastructure routes.
8. Environment variables — full table: Variable | Required (Yes/No/Prod-only) | Purpose, taken directly from docs/_facts.md.
9. Local development — copy-pasteable setup commands, and where the API/UI run locally (ports).
10. Documentation completeness checklist — a table that maps each criterion (interactive API docs, every endpoint documented, request examples, curl samples, env vars documented, local dev documented) to the evidence file/section, so a reviewer can audit doc coverage at a glance.

Cross-link to README.md, DEMO.md, and the relevant docs/features/*.md and docs/api/*.md pages instead of duplicating content. Do not restate the full feature table from the README — link to it.
```

---

### Prompt D — Feature pages (run once per feature)

This is a **template** — run it once per feature in your confirmed feature list from `docs/_facts.md`. Replace `[FEATURE_NAME]` and `[FEATURE_FILE]` each time.

```text
Using docs/_facts.md and the actual implementation, write docs/features/[FEATURE_FILE].md documenting the "[FEATURE_NAME]" feature of Shipflow.

Structure, using `##` headings:
1. What it is — one paragraph, written for someone who has never used Shipflow.
2. How it works — the real mechanics: what triggers it, what data it reads/writes, any background processing involved. Cite the actual service/module files you're describing.
3. API surface — every endpoint, CLI command, or SDK method that touches this feature, in a table, with a one-line description each. Cross-reference docs/api/ for full request/response schemas instead of repeating them here.
4. Configuration — every config option, env var, or UI setting that affects this feature's behavior.
5. Example — one realistic, end-to-end example (a curl call, a CLI invocation, or a code snippet in the project's primary SDK language) showing this feature being used start to finish.
6. Limits & edge cases — rate limits, size limits, known constraints, and how errors surface to the caller.
7. Related features — links to other docs/features/*.md pages this one commonly pairs with (e.g. eval-runs.md naturally links to scorers-and-graders.md and reports-and-dashboards.md).

Keep this page self-contained enough that someone could land on it directly from a search engine and understand the feature without reading the README first.
```

Suggested default feature list to run this against (confirm/edit against your actual `docs/_facts.md` output first):

| `[FEATURE_NAME]` | `[FEATURE_FILE]` |
|---|---|
| Eval Suites | `eval-suites` |
| Eval Runs | `eval-runs` |
| Scorers & Graders | `scorers-and-graders` |
| Datasets | `datasets` |
| Model & Prompt Comparison | `model-and-prompt-comparison` |
| Regression Detection | `regression-detection` |
| Reports & Dashboards | `reports-and-dashboards` |
| CI/CD Integration | `ci-cd-integration` |
| Webhooks & Notifications | `webhooks-and-notifications` |
| SDK & CLI | `sdk-and-cli` |

---

### Prompt E — API reference + OpenAPI/Scalar setup

```text
Using docs/_facts.md and the real route definitions, produce the full API reference for Shipflow:

1. If no machine-readable OpenAPI spec exists yet (check docs/_facts.md), generate one at the conventional location for this stack (e.g. openapi.json or openapi.yaml at the API root) covering every documented endpoint: path, method, summary, description, request body schema, response schema, and example values. Pull schemas from the actual request validators/types/models in the code (e.g. Zod schemas, Pydantic models, DTOs) rather than guessing field names.
2. Wire up an interactive API docs UI (Scalar if the stack already has compatible tooling, otherwise Redoc/Swagger UI) served at /docs, reading from the generated spec.
3. Group the sidebar/tag structure by resource: Getting Started (Auth, Health), Eval Suites, Eval Runs, Datasets, Scorers, Reports, Webhooks, MCP (if applicable).
4. Write docs/api/overview.md — explains how to reach the interactive docs, how to fetch the raw spec, and how to import it into Postman/Insomnia.
5. Write docs/api/authentication.md — every supported auth method with header examples and a curl call that succeeds and one that fails with a 401, to show the expected error shape.
6. Write one docs/api/endpoints-[resource].md per resource group (eval-suites, eval-runs, datasets, scorers, reports, webhooks) — for each, a table of endpoints plus 1-2 full curl examples for the most important create/read operations in that resource.
7. If an MCP server exists per docs/_facts.md, write docs/api/mcp.md: list every tool with its name, description, and parameters in a table, document the JSON-RPC methods supported (initialize, tools/list, tools/call, resources/list if applicable), and include a working curl example for listing tools and for calling one read-only tool.

Every curl example must use a real, working endpoint path and method from the actual code — not a guessed one.
```

---

### Prompt F — `DEMO.md` (and `JUDGE_WALKTHROUGH.md` if applicable)

```text
Using README.md, DOCS.md, and docs/_facts.md as sources, write DEMO.md — a guided walkthrough for someone evaluating Shipflow for the first time (a reviewer, a prospective user, or a hackathon judge).

Structure, using `##` headings:
1. Quick links table: live app URL (placeholder if not deployed), demo login URL if one exists, interactive API docs URL, MCP endpoint if applicable, any pitch/demo video links.
2. A reviewer visuals table: Screen/Page | What to look for | Link — one row per major UI surface or API capability.
3. A numbered, timed walkthrough (e.g. "5-Minute Walkthrough") where each step: (a) names the exact feature being demonstrated, (b) gives the exact URL/command to try, (c) states which underlying APIs/services fire as a result, (d) calls out what makes it technically interesting (real scoring logic, real model calls, real persistence — not mocked data).
4. An integration map table: Capability | Underlying API/operation | Where it's used in the codebase (file path) — this should read like a forensic trace a technical reviewer can verify against the repo.
5. A condensed engineering highlights section (security, architecture, observability) that links out to docs/architecture.md for the full detail rather than repeating it.

If this project is being submitted to a hackathon, competition, or formal review, ALSO produce JUDGE_WALKTHROUGH.md: a much shorter version (aim for a 60-90 second read) that hits only the 3-4 highest-impact things a time-constrained reviewer should see, each with a single link and a one-line "why this matters" note. If there's no such review context, skip this file.
```

---

### Prompt G — Extras pass

```text
Using docs/_facts.md and the docs already written, produce the following supporting files. Keep each one tightly scoped — these are reference/support docs, not duplicates of README.md or DOCS.md.

1. CONTRIBUTING.md — how to set up a dev environment for contributing, branch/commit conventions if any exist in git history or CI config, how to run tests before a PR, and the PR review process if discoverable from .github/ files.

2. SECURITY.md — how to report a vulnerability, supported versions if relevant, and a summary of the security measures already documented in DOCS.md (link, don't repeat).

3. CHANGELOG.md — initialize using Keep a Changelog format (https://keepachangelog.com) with an "Unreleased" section; backfill entries only if commit history or existing release notes make specific changes verifiable, otherwise leave a clearly marked placeholder.

4. docs/architecture.md — the full technical deep-dive: component diagram, data flow for "running an eval" end to end, database schema summary (entities + relationships, not full DDL), how scoring/grading is computed, how results are stored and queried for reports, scaling/queueing notes if relevant.

5. docs/methodology.md — THIS IS EVAL-ENGINE SPECIFIC AND IMPORTANT: document how Shipflow actually scores or grades outputs. For each scorer/grader type that exists in the code: what it measures, the exact algorithm or prompt template used (if model-graded, show the actual judge prompt structure used in code, redacting any secrets), how scores are normalized/aggregated, and known limitations or biases of that scoring method. This page is what makes users trust the eval numbers Shipflow produces — do not write generic eval-theory content, document what THIS codebase actually does.

6. docs/glossary.md — define Shipflow-specific terms (e.g. "eval suite" vs "eval run" vs "scorer" vs "dataset" vs "baseline") precisely and consistently, since these words are often used loosely elsewhere.

7. docs/roadmap.md — pull from any TODO/FIXME comments, open GitHub issues if accessible, or existing planning docs in the repo; clearly separate "Planned" from "Under consideration" and avoid committing to dates not already stated somewhere in the project.

8. docs/troubleshooting.md — common setup failures and their fixes (env var misconfiguration, DB connection issues, missing API keys for model providers) — derive these from required env vars and any error-handling code that returns specific guidance.

9. docs/faq.md — 8-12 question/answer pairs anticipating what a new user or technical reviewer would ask (e.g. "How is this different from running evals myself with a script?", "Which model providers are supported?", "How are scores compared across runs?", "Is there a self-hosted option?") — answer only what's actually true of this codebase.

10. .env.example — if one exists, annotate every variable with an inline comment explaining what it's for and where to obtain it (e.g. API keys); if one doesn't exist, generate it from every env var found in docs/_facts.md, grouped by category (database, auth, model providers, webhooks, misc) with comments.

Cross-link every new file from README.md or DOCS.md so nothing is orphaned.
```

---

### Prompt H — Consistency & QA pass (run last)

```text
Do a consistency pass across every markdown file in the repo root and docs/.

Check for and fix:
1. Broken relative links between docs (a link to a file/section that doesn't exist or was renamed).
2. Terminology drift — the same concept named differently across files (e.g. "eval run" vs "test run" vs "evaluation job") — standardize on the term defined in docs/glossary.md and update all occurrences.
3. Endpoint/example drift — any curl example, endpoint path, or env var name in the docs that no longer matches the actual code (re-check against docs/_facts.md and the live route definitions).
4. Duplicate content — sections that fully restate something already covered elsewhere should be trimmed to a one-line summary + link.
5. Heading consistency — confirm README.md, DOCS.md, and DEMO.md follow the exact section order specified when they were generated.
6. Tone consistency — minimal emoji throughout, consistent table formatting, consistent code fence language tags.

Produce a short docs/_qa-report.md summarizing what was found and fixed, then it's safe to delete docs/_facts.md and docs/_qa-report.md or keep them as internal-only references (add docs/_*.md to .gitignore if you don't want them committed).
```

---

## 6. Tips for running this in Antigravity

- Run prompts **in order** (0 → B → C → D ×N → E → F → G → H). Skipping Prompt 0 is the single most common cause of hallucinated docs — every later prompt is written to defer to it.
- For Prompt D, run it once per feature rather than asking for all feature pages in one shot — this keeps each output focused and reviewable, and matches the "section-wise" generation you asked for.
- After each prompt, skim the diff before continuing. Docs compound: an error introduced in `README.md` (Prompt B) will get copied into `DEMO.md` (Prompt F) if you don't catch it first.
- If Shipflow doesn't yet have a deployed URL, tell Antigravity explicitly to use `{BASE_URL}` style placeholders consistently rather than inventing a domain — makes a global find-and-replace trivial once you deploy.
- If Shipflow has no MCP server and you don't plan to build one, delete the MCP-conditional instructions from Prompts B, C, E, and F before running them, so the model doesn't pad those sections with "not applicable" filler.

---

## 7. Final documentation completeness checklist

| Criterion | File/Evidence |
|---|---|
| Front-door overview with feature table | `README.md` |
| Full technical reference (auth, endpoints, env vars, internals) | `DOCS.md` |
| Guided walkthrough with live links | `DEMO.md` |
| Condensed reviewer path (if applicable) | `JUDGE_WALKTHROUGH.md` |
| Interactive API docs + machine-readable spec | `/docs` UI + `openapi.json` |
| One page per feature | `docs/features/*.md` |
| Per-resource endpoint docs with curl examples | `docs/api/*.md` |
| MCP tool reference (if applicable) | `docs/api/mcp.md` |
| Scoring/grading methodology documented and trustworthy | `docs/methodology.md` |
| Architecture deep-dive | `docs/architecture.md` |
| Contribution, security, and changelog hygiene | `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md` |
| Setup troubleshooting and FAQ | `docs/troubleshooting.md`, `docs/faq.md` |
| Consistent terminology and no broken links | `docs/_qa-report.md` (Prompt H) |
