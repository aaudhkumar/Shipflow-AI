# Tasks and PRDs

## What it is
Shipflow bridges the gap between product management and engineering. It allows teams to write Product Requirements Documents (PRDs) and seamlessly break them down into actionable engineering Tasks. 

## How it works
- **PRDs**: Managed by the `prd` tRPC router. PRDs are rich text or markdown documents that outline the scope and specifications of a feature.
- **Tasks**: Managed by the `task` tRPC router. Tasks represent granular units of work. 
- **Relationship**: Tasks are linked to Features and PRDs in the database (`packages/db`). What makes Shipflow unique is that Tasks can be assigned to **AI Workers** (via the Task Execution engine) to automatically draft code based on the PRD context.

## API surface
| Endpoint (tRPC) | Description |
|-----------------|-------------|
| `prd.create` | Creates a new PRD document. |
| `prd.get` | Retrieves a PRD's content. |
| `task.create` | Creates a new task. |
| `task.assign` | Assigns a task to a human member or AI worker. |
| `task.updateStatus`| Updates task progress. |

*(For full REST endpoint mappings, refer to the API Reference at `/api/docs`)*

## Configuration
Core task and PRD management require only standard database access (`DATABASE_URL`). However, if tasks are assigned to AI for execution, the Task Execution dependencies (`OPENAI_API_KEY`, etc.) become relevant.

## Example
**Fetching tasks for a feature (Client SDK):**
```typescript
const { data: tasks } = trpc.task.listByFeature.useQuery({ 
  featureId: "feat_890" 
});

console.log(tasks); 
// Returns [{ id: "tsk_1", title: "Implement login route", status: "todo" }]
```

## Limits & edge cases
- **Limits**: Free-tier organizations may have limits on the number of active tasks or PRD length.
- **Edge Cases**: Large PRD contents are stored efficiently; however, extremely long documents might hit max-payload limits when submitted over the API.

## Related features
- [Projects and Features](projects-and-features.md)
- [Task Execution](task-execution.md)
