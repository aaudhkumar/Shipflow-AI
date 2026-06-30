# Contributing to Shipflow

First off, thanks for taking the time to contribute!

## Development Environment Setup
1. **Clone the repo**: `git clone https://github.com/shipflow/shipflow.git`
2. **Install dependencies**: We use `pnpm`. Run `pnpm install`.
3. **Environment setup**: Copy `.env.example` to `.env` and fill in required values (Postgres DB, API keys).
4. **Database**: Run `pnpm db:generate` and `pnpm db:migrate` to set up your local Drizzle schema.
5. **Start Dev Server**: Run `pnpm dev`. This launches the frontend, API, and worker services.

## Branching & Commit Conventions
- Use descriptive branch names: `feature/your-feature-name` or `fix/issue-description`.
- Write clear, concise commit messages. 

## Testing Before PR
Before submitting a pull request, ensure the codebase is clean:
- **Linting**: `pnpm lint`
- **Formatting**: `pnpm format`
- **Type Checking**: `pnpm check-types`
- **Unit Tests**: `pnpm test` (Runs Vitest)

## PR Review Process
1. Push your branch and open a PR against `main`.
2. Ensure CI checks pass (Type checking, Linting, Tests).
3. A maintainer will review your code.
4. Once approved, it will be merged.
