# Shipflow AI: Autonomous SDLC Platform
*(Built for the Chaicode iPhone Giveaway Hackathon)*

**Shipflow AI** is a complete, multi-tenant Software Development Lifecycle (SDLC) platform designed to replace tools like Linear or Jira while taking it one massive step further: **Shipflow actively writes code for you.**

By bringing PRDs, Tasks, and Repositories into one unified workspace, Shipflow uses autonomous AI workers to turn plain-text tasks into merged Pull Requests.

---

> [!IMPORTANT]
> **Chaicode Hackathon Evaluators / Judges**
> We highly recommend starting with the **[5-Minute Guided DEMO (DEMO.md)](DEMO.md)** to instantly experience the "wow" factor of Shipflow's autonomous AI coding engine.

---

## 🚀 Live Deployed Environments

The entire stack is deployed live and fully functional end-to-end:

| Environment | Live URL | Description |
|---|---|---|
| **Frontend Web App** | [https://shipflow-ai-web-eight.vercel.app](https://shipflow-ai-web-eight.vercel.app) | The Next.js App Router client where users interact with the platform. Sign up here! |
| **Backend API (tRPC/Express)** | [https://shipflow-ai-1.onrender.com](https://shipflow-ai-1.onrender.com) | The primary Express/tRPC backend managing the database, auth, and billing. |
| **Interactive API Docs** | [https://shipflow-ai-1.onrender.com/api/docs](https://shipflow-ai-1.onrender.com/api/docs) | Interactive Scalar UI to test the dynamically generated OpenAPI endpoints. |
| **AI Code Worker (Sandbox)** | [https://shipflow-ai.onrender.com](https://shipflow-ai.onrender.com) | The isolated background microservice that securely executes LLM-driven Git operations. |

---

## 📺 Demo & Pitch Deck

**Project Demo (Full Walkthrough):** [Watch on YouTube](https://youtu.be/Uwrd5sdOMrM)

### Short Hackathon Updates (Click to watch on X)
| Link | Description |
|---|---|
| [Demo clip 1](https://x.com/aaudhkumar/status/2071555198783516764?s=20) | Hackathon Update 1 |
| [Demo clip 2](https://x.com/aaudhkumar/status/2070655864592375849?s=20) | Hackathon Update 2 |
| [Demo clip 3](https://x.com/aaudhkumar/status/2070456266376585613?s=20) | Hackathon Update 3 |

---

## 🌟 Hackathon Highlight Features (All 100% Working)

1. **Autonomous Task Execution (The Code Worker)**
   Shipflow doesn't just manage tasks. If you assign a Task to an AI Agent, the platform securely kicks off an isolated Docker-based Code Worker (hosted on a separate Render service). This worker pulls your linked GitHub repository, reads the task context, iteratively uses the Vercel AI SDK to write code, commits the changes, and automatically opens a Pull Request on GitHub. 

2. **AI-Assisted Planning (PRDs & Epics)**
   Starting with a one-sentence feature idea, Shipflow's backend can automatically generate a comprehensive Product Requirements Document (PRD), extract engineering tasks from it, and engage in a "Clarification Q&A" to fill in knowledge gaps before any code is written.

3. **Secure Multi-Tenancy & Auth**
   Built with `better-auth`, evaluators can securely log in via Google or GitHub OAuth. Data is strictly isolated; your Organization, Projects, and PRDs cannot be seen by other users. Role-based access control (RBAC) ensures only Admins can invite new team members.

4. **Bi-Directional GitHub Sync**
   Install the Shipflow GitHub App, and the platform will ingest your repositories. Webhooks listen for Pull Request updates, automatically syncing PR states back to your Shipflow Kanban board.

5. **Integrated Monetization (Razorpay)**
   Shipflow includes a fully working Razorpay subscription integration. The platform enforces billing limits on AI generations (PRDs, Tasks). Organizations on the "Free" tier will hit usage limits, which can be bypassed by subscribing to the Pro tier via Razorpay checkout sessions.

---

## 🏗️ Architecture & Technical Depth

The platform is a sophisticated Monorepo (`pnpm` workspaces) composed of several specialized services.

### Tech Stack
- **Frontend:** Next.js (App Router), TailwindCSS, tRPC React Query.
- **Backend API:** Express.js hosting 15 distinct tRPC routers (75+ endpoints) covering Auth, Billing, Webhooks, and Audits.
- **Database:** PostgreSQL accessed strictly via Drizzle ORM to ensure end-to-end type safety.
- **Authentication:** `better-auth` for highly secure, HTTP-only session cookies.
- **AI Models:** Currently powered entirely by **OpenAI** (via Vercel AI SDK).
- **Background Jobs:** Inngest handles robust, event-driven workflows (like syncing repositories without timing out the web server).

### The "Code-Worker" Sandbox
The AI task execution is handled by `@shipflow/code-worker`—a highly specialized microservice. 
- It uses a custom implementation loop that provides tools to the LLM (`read_file`, `list_dir`, `write_file`, `run_command`).
- Every file write is passed through a **Secret Scanner** to prevent accidental credential leakage.
- Command execution is strictly whitelisted (only `test`, `lint`, `build` are allowed). No arbitrary shell execution is permitted, preventing RCE vulnerabilities.

For a deeper dive into the API routes, Drizzle schemas, and Code Worker security model, see the [Technical DOCS (DOCS.md)](DOCS.md).
