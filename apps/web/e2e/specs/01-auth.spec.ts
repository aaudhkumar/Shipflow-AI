import { test, expect } from '@playwright/test';

// Do not use the authenticated state for this test
test.use({ storageState: { cookies: [], origins: [] } });

test('User can see the login page and authenticate', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page).toHaveTitle(/Login/i);
  
  await page.fill('input[name="email"]', 'test@shipflow.me');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/.*\/org\/test-org.*/);
});
