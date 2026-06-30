# API Authentication

Shipflow utilizes `better-auth` for session management. 

## Mechanism
Most API endpoints require a valid session cookie to be present in the request headers.

- **Cookie Name**: `better-auth.session_token`
- **Error Behavior**: Requests lacking a valid cookie will receive a `401 Unauthorized` HTTP response.

## Example: Successful Request
When calling an authenticated endpoint, include the cookie in your headers.

```bash
curl -X GET http://localhost:8000/api/auth/session \
  -H "Cookie: better-auth.session_token=valid_token_here"
```

## Example: Failed Request (401)
If the cookie is missing or expired, the API will reject the request.

```bash
curl -X GET http://localhost:8000/api/auth/session \
  -H "Cookie: better-auth.session_token=expired_token_here"
```

**Expected Response:**
```json
{
  "message": "UNAUTHORIZED",
  "code": -32001
}
```
