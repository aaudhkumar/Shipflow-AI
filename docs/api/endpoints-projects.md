# Endpoints: Projects, Features, Tasks & PRDs

This section covers the core project management endpoints.

| Endpoint (tRPC path assumed `/api/[router]/[procedure]`) | Method | Description |
|----------------------------------------------------------|--------|-------------|
| `/api/project/create` | POST | Creates a new project in an organization. |
| `/api/project/list` | GET | Lists projects for an org. |
| `/api/feature/create` | POST | Creates a feature inside a project. |
| `/api/prd/create` | POST | Creates a new PRD document. |
| `/api/task/create` | POST | Creates a task and optionally links a PRD/Feature. |

## Example: Creating a Project
```bash
curl -X POST http://localhost:8000/api/project/create \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=..." \
  -d '{
    "orgId": "org_123",
    "name": "Backend Refactor",
    "description": "Moving to tRPC"
  }'
```

## Example: Creating a Task
```bash
curl -X POST http://localhost:8000/api/task/create \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=..." \
  -d '{
    "featureId": "feat_456",
    "title": "Setup Express Server",
    "status": "todo"
  }'
```
