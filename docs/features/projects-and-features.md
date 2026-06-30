# Projects and Features

## What it is
Projects and Features form the core organizational hierarchy for software development within Shipflow. A Project represents a high-level goal or repository, while Features are specific, trackable deliverables or modules within that Project.

## How it works
- **Data Model**: Stored in Postgres via Drizzle (`packages/db`), every Project belongs to an Organization. Features belong to Projects.
- **Logic**: The business logic is exposed via the `project` and `feature` tRPC routers.
- **Tracking**: Features act as the parent container for tasks and PRDs, providing a unified view of progress. 

## API surface
| Endpoint (tRPC) | Description |
|-----------------|-------------|
| `project.create` | Initializes a new project in the org. |
| `project.list` | Retrieves all projects for the current org. |
| `feature.create` | Adds a new feature to a project. |
| `feature.updateStatus` | Moves a feature through its lifecycle (e.g. In Progress, Done). |

*(For full REST endpoint mappings, refer to the API Reference at `/api/docs`)*

## Configuration
No specific environment variables are required for this module, as it relies purely on the core database connection (`DATABASE_URL`).

## Example
**Creating a project via curl (using the generated OpenAPI routes):**
```bash
curl -X POST http://localhost:8000/api/project/create \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=..." \
  -d '{"orgId": "org_123", "name": "Q3 Roadmap", "description": "Core platform updates"}'
```

## Limits & edge cases
- **Data Integrity**: Deleting a project cascades or warns depending on attached Features, Tasks, and PRDs.
- **Access Control**: Users must have appropriate permissions within the Organization to create or delete projects.

## Related features
- [Tasks and PRDs](tasks-and-prds.md)
- [Repositories and PRs](repositories-and-prs.md)
