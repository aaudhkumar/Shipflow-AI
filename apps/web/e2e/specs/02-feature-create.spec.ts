import { test, expect } from '@playwright/test';

test.describe('Feature Creation', () => {
  test('User can create a new feature request', async ({ page }) => {
    // Navigate to the dashboard (authenticated state is loaded)
    await page.goto('/org/test-org/dashboard');
    
    // Go to features page
    await page.click('text="Features"');
    await page.click('text="New Request"'); // assuming a button exists

    // Or just go directly to the new feature page
    await page.goto('/org/test-org/features/new');

    await expect(page).toHaveURL(/.*\/features\/new/);

    // Fill form
    await page.fill('input[name="title"]', 'E2E Test Feature');
    await page.fill('textarea[name="description"]', 'This is a description for the E2E test feature.');
    
    // Select channel
    await page.selectOption('select#channel', 'EMAIL');

    await page.click('button[type="submit"]');

    // Should redirect to the feature detail page
    await expect(page).toHaveURL(/.*\/features\/.+/);
    await expect(page.locator('h1')).toContainText('E2E Test Feature');
    
    // Wait for Clarification AI to potentially kick in (status badge check)
    await expect(page.locator('text="Submitted"').or(page.locator('text="Clarifying"'))).toBeVisible();
  });
});
