# AI Execution Methodology

While Shipflow acts as an orchestrator for the SDLC, its key differentiator is the AI Task Execution worker. This document explains how Shipflow approaches autonomous code drafting and PR execution.

## The Approach
Unlike naive code-generation wrappers, Shipflow grounds the AI in deep context provided by your project's PRDs and historical tasks.

### 1. Context Assembly
Before pinging an LLM, the worker:
- Retrieves the Target Task.
- Recursively fetches the parent Feature and parent PRD.
- Compiles this structured data into a bounded context window.

### 2. Prompting Strategy
The worker uses a structured system prompt. While the exact prompt varies by operation, the core structure is:
1. **Role Definition**: Establishing the LLM as a senior software engineer.
2. **Context Injection**: Providing the PRD goals and Task specifics.
3. **Constraint Enforcement**: Ensuring output matches standard formats (like valid JSON or unified diffs).

### 3. Execution & Bias
Because Shipflow allows you to bring your own API keys (OpenAI, Anthropic, Gemini, OpenRouter), the quality of execution relies on the underlying foundation model. 
- **Limitations**: Models may hallucinate internal APIs if the PRD lacks sufficient technical specifications. We recommend highly detailed PRDs for autonomous tasks.
