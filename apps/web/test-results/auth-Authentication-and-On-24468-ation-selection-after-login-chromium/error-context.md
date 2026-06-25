# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication and Onboarding >> User can see Organization selection after login
- Location: e2e/auth.spec.ts:26:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "/login"
Received string:    "http://localhost:3000/org"
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - heading "404" [level=1] [ref=e4]
    - heading "This page could not be found." [level=2] [ref=e6]
  - region "Notifications alt+T"
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e12] [cursor=pointer]:
    - img [ref=e13]
  - alert [ref=e16]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication and Onboarding', () => {
  4  |   test('User can sign in and is redirected to onboarding/dashboard', async ({ page }) => {
  5  |     // 1. Go to landing page
  6  |     await page.goto('/');
  7  | 
  8  |     // 2. Click sign in
  9  |     await page.click('text=Log In');
  10 | 
  11 |     // 3. Since BetterAuth with GitHub is mocked or requires external interaction in real life,
  12 |     // we assume a local dev environment might have a magic link or mock auth. 
  13 |     // In our E2E environment we'll use a mocked API route or assume the user gets routed to login.
  14 |     await expect(page.url()).toContain('/login');
  15 |     
  16 |     // Fill credentials (if we have a credential provider enabled for testing)
  17 |     // If we only have GitHub auth, we might have to mock the provider in the CI.
  18 |     // For this test, we verify the login page renders properly.
  19 |     await expect(page.locator('text=Sign in to your account')).toBeVisible();
  20 |     await expect(page.locator('text=Continue with GitHub')).toBeVisible();
  21 | 
  22 |     // In a fully mocked environment we would inject a session cookie, but for now
  23 |     // we just ensure the login flow is accessible and doesn't crash.
  24 |   });
  25 | 
  26 |   test('User can see Organization selection after login', async ({ page, context }) => {
  27 |     // Simulate an authenticated session by setting a cookie or local storage if possible
  28 |     // Alternatively, we navigate to the org selection directly to check if it redirects back
  29 |     await page.goto('/org');
  30 | 
  31 |     // Because the user is NOT authenticated in this fresh context, they should be redirected to /login
> 32 |     await expect(page.url()).toContain('/login');
     |                              ^ Error: expect(received).toContain(expected) // indexOf
  33 |   });
  34 | });
  35 | 
```