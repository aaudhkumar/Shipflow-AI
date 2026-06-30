# Security Policy

## Supported Versions
Currently, only the latest `main` branch and most recent tagged release receive security updates.

## Reporting a Vulnerability
If you discover a security vulnerability within Shipflow, please do not disclose it publicly. Instead, send an email to the core maintainers. We will review all reports and provide a timeline for fixes.

## Existing Security Measures
Shipflow implements robust security measures by default:
- **Session Management**: Powered by `better-auth`, utilizing HTTP-only, secure cookies.
- **CORS Protection**: Restricted by `CORS_ALLOWED_ORIGINS` environment variables.
- **Webhook Verification**: All webhooks (GitHub, Razorpay, Deployments) cryptographically verify incoming payload signatures.
- **Rate Limiting**: Upstash Redis is integrated to prevent brute-force attacks and abuse.

For more details on how these are implemented, see the [Technical DOCS (DOCS.md)](DOCS.md).
