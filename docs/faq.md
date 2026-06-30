# Frequently Asked Questions

**Q: How is this different from standard task management tools like Jira or Linear?**
A: Shipflow not only tracks the task but can autonomously execute it. By linking a PRD to a Task and assigning it to an AI Worker, Shipflow drafts the code for you in the background.

**Q: Which model providers are supported?**
A: We support OpenAI, Anthropic, Gemini, and OpenRouter. You must provide your own API keys in the `.env` file to enable the AI Task Execution engine.

**Q: How does the AI worker access my codebase?**
A: Currently, the AI worker operates on the context provided in the PRD and the Task definition. Full repository codebase context relies on future integrations (see Roadmap).

**Q: Is there a self-hosted option?**
A: Yes! Shipflow is entirely open-source and built on standard infrastructure (Postgres, Node, Redis). You can deploy it to your own VPC.

**Q: How are webhooks secured?**
A: All incoming webhooks from GitHub, Razorpay, and Deployment providers are cryptographically signed. Shipflow uses your configured secret keys (e.g., `GITHUB_WEBHOOK_SECRET`) to verify the `x-hub-signature-256` headers before processing any payload.

**Q: Why do I need Redis?**
A: Redis (via Upstash or a local instance) is used primarily for rate-limiting the API and AI endpoints to prevent abuse and API quota exhaustion.

**Q: Does Shipflow have an MCP (Model Context Protocol) server?**
A: Not currently. Shipflow operates as a standalone SDLC orchestration platform with its own integrated AI workers, rather than serving tools to external LLM clients.
