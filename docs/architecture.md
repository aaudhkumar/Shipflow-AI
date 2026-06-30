# Architecture

This document provides a deep dive into Shipflow's technical architecture.

## Component Diagram
```ascii
                      +-------------------+
                      |   Next.js (Web)   |
                      +---------+---------+
                                |
                     [ tRPC React Client ]
                                |
+-------------------------------------------------------------+
|                          Express API                        |
|                                                             |
|  [ Auth Middleware ]   [ tRPC Routers ]   [ trpc-to-openapi]|
+-----------+-------------------+--------------------+--------+
            |                   |                    |
     +------+------+     +------+------+      +------+------+
     | Better-Auth |     | Inngest     |      | AI Providers|
     | (Sessions)  |     | (Workflows) |      | (LLMs)      |
     +------+------+     +------+------+      +------+------+
            |                   |
     +------+------+     +------+------+
     |  Postgres   |     |   Upstash   |
     | (Drizzle)   |     |   (Redis)   |
     +-------------+     +-------------+
```

## Data Flow: Running an AI Task
The core "AI task execution" flow operates as follows:
1. **Trigger**: A client requests an execution via `POST /api/taskExecution/start`.
2. **API Layer**: The Express API authenticates the request, validates the payload via Zod, and records an "Execution Queued" state in PostgreSQL.
3. **Queueing**: The API pushes an event to the Inngest broker. This returns immediately, preventing HTTP timeouts.
4. **Worker Loop**: The Inngest worker function (running within `apps/api` or a separate worker instance) receives the event.
5. **AI Invocation**: The worker fetches the associated PRD and Task details, compiles a system prompt, and requests completion from the chosen AI provider.
6. **Persistence**: As the AI streams thought processes or completes the task, the worker writes updates to PostgreSQL.

## Database Schema Summary
We use **Drizzle ORM**. Key entities include:
- `organizations` & `users`: Multi-tenant boundary.
- `projects` & `features`: Grouping mechanisms for SDLC.
- `prds` & `tasks`: The core product and engineering deliverables.
- `repositories` & `pull_requests`: External integrations.
- `task_executions`: Records for the AI workflow logs.

## Scaling & Queueing Notes
By decoupling the AI generation (which takes 10-60+ seconds) from the HTTP request-response cycle via **Inngest**, Shipflow scales horizontally. Workers can be scaled independently of the API web servers. **Upstash Redis** provides distributed rate-limiting to prevent sudden spikes from exhausting database connections or LLM token quotas.
