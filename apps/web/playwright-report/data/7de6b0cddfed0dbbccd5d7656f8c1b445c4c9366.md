# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pr-workflow.spec.ts >> PR Workflow & Dashboard >> Dashboard loads and displays recent activity
- Location: e2e/pr-workflow.spec.ts:4:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "/login"
Received string:    "http://localhost:3000/org/demo-org"
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e7]:
      - img [ref=e8]
    - generic [ref=e11]:
      - button "Open issues overlay" [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: "0"
          - generic [ref=e15]: "1"
        - generic [ref=e16]: Issue
      - button "Collapse issues badge" [ref=e17]:
        - img [ref=e18]
  - generic [ref=e21]:
    - 'heading "Application error: a server-side exception has occurred while loading localhost (see the server logs for more information)." [level=2] [ref=e22]'
    - paragraph [ref=e23]: "Digest: 3059278074"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('PR Workflow & Dashboard', () => {
  4  |   test('Dashboard loads and displays recent activity', async ({ page }) => {
  5  |     // 1. In a real test, we'd navigate to /org/[mock-org]/project/[mock-project]
  6  |     // Since we don't have a seeded DB yet, we can attempt to hit a mock route or just check the landing
  7  |     // Actually, we can check if the Command Center layout exists by forcing a navigation (which redirects if no auth)
  8  |     
  9  |     await page.goto('/org/demo-org');
  10 |     
  11 |     // We expect it to redirect to login because we aren't authenticated
> 12 |     await expect(page.url()).toContain('/login');
     |                              ^ Error: expect(received).toContain(expected) // indexOf
  13 |   });
  14 | 
  15 |   test('Webhook API endpoint accepts valid payloads', async ({ request }) => {
  16 |     // We can test the Next.js API route directly to simulate a Vercel webhook
  17 |     const response = await request.post('/api/webhooks/deploy?secret=test-secret', {
  18 |       data: {
  19 |         type: 'deployment.succeeded',
  20 |         payload: {
  21 |           deployment: {
  22 |             url: 'test.vercel.app',
  23 |             meta: {
  24 |               githubCommitSha: 'abcdef',
  25 |               githubCommitRepo: 'test/repo'
  26 |             }
  27 |           },
  28 |           target: 'production'
  29 |         }
  30 |       }
  31 |     });
  32 | 
  33 |     // Since we don't have the actual `DEPLOYMENT_WEBHOOK_SECRET` configured in the test environment,
  34 |     // it will likely return a 500 (Server misconfiguration) or 401 if we send a wrong secret.
  35 |     const status = response.status();
  36 |     expect([400, 401, 500, 200]).toContain(status); 
  37 |     
  38 |     // The main point is that the route is alive and parsing the request.
  39 |   });
  40 | });
  41 | 
```