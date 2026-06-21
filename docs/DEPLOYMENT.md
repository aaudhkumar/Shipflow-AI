# ShipFlow AI Deployment Guide

This guide outlines the infrastructure and deployment process for ShipFlow AI in production.

## 1. Database Provisioning (PostgreSQL)
1. Create a managed PostgreSQL database using Supabase, Neon, or Railway.
2. Obtain the connection string.
3. Apply the schema using Drizzle ORM:
   ```bash
   pnpm --filter @shipflow/db exec drizzle-kit push
   ```

## 2. Distributed Cache (Redis)
1. Create an Upstash Redis database.
2. Secure the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
3. This will power our rate limiting and Inngest workflows.

## 3. GitHub App Configuration
1. Go to your GitHub Organization Settings > Developer settings > GitHub Apps.
2. Generate a Private Key and a Webhook Secret.
3. Configure the Webhook URL to `https://yourdomain.com/api/webhooks/github`.
4. Subscribe to the following events:
   - Pull Requests
   - Issues
   - Issue Comments

## 4. Environment Variables
You must configure the following variables in Vercel:

### Core
- `DATABASE_URL`: Your PostgreSQL connection string.
- `BETTER_AUTH_SECRET`: A secure random string for signing sessions.
- `NEXT_PUBLIC_APP_URL`: Your production URL.

### GitHub
- `GITHUB_APP_ID`: Your GitHub App ID.
- `GITHUB_CLIENT_ID`: Your GitHub App Client ID.
- `GITHUB_CLIENT_SECRET`: Your GitHub App Client Secret.
- `GITHUB_PRIVATE_KEY`: Base64 encoded Private Key.
- `GITHUB_WEBHOOK_SECRET`: Your configured Webhook Secret.

### AI Providers
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

### Infrastructure
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`

### Billing
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

## 5. Vercel Deployment
1. Connect your GitHub repository to Vercel.
2. The `vercel.json` file in the root will automatically detect the turborepo and select the Next.js `apps/web` framework.
3. Add all environment variables from Section 4.
4. Add a Custom Domain in Vercel Settings -> Domains. Strict SSL/TLS is handled automatically by Vercel.

## 6. Smoke Testing
1. Navigate to the deployed production URL.
2. Attempt to sign in or create an organization.
3. Link a repository and verify the initial setup webhooks successfully trigger a synchronization.
