# Task Execution Engine

## What it is
The Task Execution Engine is the defining "AI" capability of Shipflow. Instead of merely tracking tasks, Shipflow can *execute* them. By leveraging Large Language Models (LLMs) and background workflows, Shipflow can read a PRD, draft code, and even open Pull Requests autonomously.

## How it works
- **Triggering**: A user assigns a Task to an AI worker via the `taskExecution` tRPC router.
- **Orchestration**: To prevent long-running AI generation from timing out HTTP requests, the job is dispatched to **Inngest** (`packages/workflow`).
- **AI Processing**: The Inngest worker pulls the Task details and the associated PRD context. It then calls the configured AI provider (`packages/ai` — OpenAI, Anthropic, Gemini, or OpenRouter) with a specialized system prompt.
- **Output**: The AI generates the required code changes or documentation. Depending on the configuration, this output is saved back to the Task for review, or pushed directly to a linked GitHub repository via the GitHub App integration.

## API surface
| Endpoint (tRPC) | Description |
|-----------------|-------------|
| `taskExecution.start` | Triggers a new AI execution for a specific task. |
| `taskExecution.status` | Polls the current status (queued, running, complete) of an execution. |
| `taskExecution.logs` | Retrieves the step-by-step logs of the AI's thought process. |

*(For full REST endpoint mappings, refer to the API Reference at `/api/docs`)*

## Configuration
Requires an Inngest setup and at least one LLM provider:
- `INNGEST_EVENT_KEY`: Used to push events to Inngest.
- `INNGEST_SIGNING_KEY`: Used by the local Inngest server to securely invoke the worker endpoints.
- **AI Keys**: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, or `OPENROUTER_API_KEY`.

## Example
**Triggering an execution via curl:**
```bash
curl -X POST http://localhost:8000/api/taskExecution/start \
  -H "Content-Type: application/json" \
  -d '{"taskId": "tsk_999", "model": "gpt-4o"}'
```

## Limits & edge cases
- **Timeouts**: AI generation takes time. Inngest handles retries and step-functions to prevent standard HTTP timeouts.
- **Rate Limits**: Heavy usage can hit OpenAI/Anthropic rate limits. Errors are caught by Inngest, which applies exponential backoff and retry logic.
- **Context Windows**: Extremely large PRDs or codebases might exceed the LLM's context window. 

## Related features
- [Tasks and PRDs](tasks-and-prds.md)
- [Repositories and PRs](repositories-and-prs.md)
