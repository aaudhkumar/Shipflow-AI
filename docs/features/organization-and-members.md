# Organization and Members

## What it is
Shipflow is multi-tenant by design. The Organization and Members feature allows teams to create isolated workspaces (Organizations), invite their teammates (Members), and assign roles to control access to projects, repositories, and billing.

## How it works
- **Organizations**: Managed via the `organization` tRPC router (`packages/trpc/server/routes/organization`). An organization serves as the root container for projects, members, and connected GitHub repositories.
- **Members**: Managed via the `member` tRPC router (`packages/trpc/server/routes/member`). Users are linked to organizations through an intersection table in the database (`packages/db`). 
- **Invites**: Users can invite others using email. If an invite secret (`INVITATION_SECRET`) is configured, links can be cryptographically verified.

## API surface
| Endpoint (tRPC) | Description |
|-----------------|-------------|
| `organization.create` | Creates a new organization workspace. |
| `organization.getById`| Fetches org details. |
| `organization.update` | Modifies org settings. |
| `member.invite` | Invites a new user via email to the org. |
| `member.list` | Lists all active members and their roles. |
| `member.remove` | Revokes access for a member. |

*(For full REST endpoint mappings, refer to the API Reference at `/api/docs`)*

## Configuration
- `INVITATION_SECRET`: An optional environment variable used to secure and sign email invitation links, preventing forgery.

## Example
**Inviting a member via the SDK (Client Hook):**
```typescript
const inviteMember = trpc.member.invite.useMutation();

inviteMember.mutate({
  orgId: "org_123",
  email: "developer@example.com",
  role: "admin"
});
```

## Limits & edge cases
- **Limits**: Organizations may be limited by their active Billing plan (e.g., maximum member counts on free tiers).
- **Errors**: Attempting to access an organization you are not a member of throws a `FORBIDDEN` error.

## Related features
- [Authentication](auth.md)
- [Billing](billing.md)
