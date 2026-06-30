# Glossary

This document defines terminology used throughout Shipflow to ensure consistency.

- **Organization**: The top-level multi-tenant workspace holding all projects, members, and billing info.
- **Member**: A user who has accepted an invitation to join an Organization.
- **Project**: A high-level collection of Features. Usually maps 1:1 to a specific software product or repository.
- **Feature**: A specific deliverable or epic within a Project.
- **PRD (Product Requirements Document)**: A rich-text specification tied to a Feature that outlines *what* needs to be built.
- **Task**: A granular unit of engineering work. Tasks belong to Features and can be executed by humans or AI.
- **Task Execution**: An asynchronous background job where an AI Worker attempts to fulfill a Task autonomously.
- **Repository**: A linked GitHub repository synced via the GitHub App.
- **AI Worker**: The background Inngest workflow that executes a Task using an LLM provider.
