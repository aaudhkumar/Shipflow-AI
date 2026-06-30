# Authentication

## What it is
Authentication in Shipflow securely identifies users and controls access to the platform. It supports both traditional email/password credentials and modern OAuth logins (Google and GitHub), making onboarding seamless for development teams. 

## How it works
Shipflow uses `better-auth` as its core authentication engine, wrapped inside the `@shipflow/auth` package. 
- **Trigger**: When a user visits the login page or initiates OAuth, `better-auth` handles the flow.
- **Persistence**: Upon success, a secure, HTTP-only session cookie is set in the user's browser, and session records are stored in the PostgreSQL database via Drizzle (`packages/db`).
- **Middleware**: For protected API routes, the `apps/api/src/server.ts` extracts the cookie headers and injects them into the tRPC context. The tRPC router then verifies the session before resolving any protected queries or mutations.

## API surface
| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/*` | Base routes managed automatically by `better-auth`. |
| `GET /api/auth/session` | Validates and retrieves the current session data. |

*(For full request/response schemas, refer to the API Reference at `/api/docs`)*

## Configuration
Authentication requires the following environment variables:
- `BETTER_AUTH_SECRET`: A secure string used to sign cookies.
- `BETTER_AUTH_URL`: The base URL of the frontend (e.g., `http://localhost:3000`).
- `GOOGLE_OAUTH_CLIENT_ID` / `SECRET`: Required for Google login.
- `GITHUB_OAUTH_CLIENT_ID` / `SECRET`: Required for GitHub login.

## Example
**Validating a session via curl:**
```bash
curl -X GET http://localhost:8000/api/auth/session \
  -H "Cookie: better-auth.session_token=your_token_here"
```

## Limits & edge cases
- **Session Expiry**: Sessions expire and must be renewed.
- **Errors**: Invalid or missing cookies result in a `401 Unauthorized` HTTP response, or an `UNAUTHORIZED` tRPC code, triggering the client to redirect to the login page.

## Related features
- [Organization and Members](organization-and-members.md)
