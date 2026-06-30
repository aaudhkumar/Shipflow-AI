# Repositories and Pull Requests

## What it is
Shipflow integrates deeply with your source control to track the implementation of Tasks and Features. By linking GitHub repositories, Shipflow can monitor Pull Requests (PRs), providing visibility into code changes directly alongside project management data.

## How it works
- **GitHub App integration**: When an organization links a repository, the Shipflow GitHub App installs webhooks on the target repo.
- **Data Sync**: The `repository` tRPC router handles the initial linkage and metadata synchronization.
- **Webhooks**: Pushes, PR creation, and PR merges trigger the GitHub App Webhook receiver in Shipflow. The payload is parsed, and the `pullRequest` router logic updates the database (`packages/db`).
- **Linking**: Developers can mention Task IDs (e.g., `TASK-123`) in their PR descriptions. The webhook parser reads this and automatically links the PR to the corresponding Task in Shipflow.

## API surface
| Endpoint (tRPC) | Description |
|-----------------|-------------|
| `repository.link` | Links a GitHub repository to the organization. |
| `repository.list` | Lists all linked repositories. |
| `pullRequest.list`| Lists PRs associated with a specific task or feature. |
| `pullRequest.sync`| Manually triggers a sync of PR statuses. |

*(For full REST endpoint mappings, refer to the API Reference at `/api/docs`)*

## Configuration
Requires a registered GitHub App:
- `GITHUB_APP_ID`: The application ID.
- `GITHUB_PRIVATE_KEY`: The PEM encoded private key for the app.
- `GITHUB_WEBHOOK_SECRET`: The secret used to verify incoming payload signatures from GitHub.
- `NEXT_PUBLIC_GITHUB_APP_NAME`: Used by the frontend to redirect users for installation.

## Example
**Incoming Webhook Payload Handling (Internal logic example):**
```javascript
// When GitHub sends a pull_request.opened event:
const signature = req.headers['x-hub-signature-256'];
verifyGitHubSignature(payload, signature, process.env.GITHUB_WEBHOOK_SECRET);

// Update database
await db.insert(pullRequests).values({
  repoId: payload.repository.id,
  prNumber: payload.pull_request.number,
  status: payload.pull_request.state,
});
```

## Limits & edge cases
- **Limits**: Extremely high-velocity repositories might generate webhook spam. The `packages/workflow` engine (Inngest) can be used to debounce or batch these updates.
- **Security**: Invalid webhook signatures are rejected with a `401 Unauthorized` immediately to prevent tampering.

## Related features
- [Tasks and PRDs](tasks-and-prds.md)
