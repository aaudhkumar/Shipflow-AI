import { test, expect } from '@playwright/test';

test.describe('PRD Approval', () => {
  test('User can generate and approve PRD', async ({ page }) => {
    await page.goto('/org/test-org/features');
    
    // Click on the first feature in the list
    await page.click('text="E2E Test Feature"');
    await expect(page).toHaveURL(/.*\/features\/.+/);

    // Click Generate AI PRD (if visible, meaning it's in a pre-PRD state)
    const generateBtn = page.locator('button:has-text("Generate AI PRD")');
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await expect(page.locator('button:has-text("Generating...")')).toBeVisible();
    }

    // Wait until "Generate Tasks" appears
    await expect(page.locator('button:has-text("Generate Tasks")')).toBeVisible({ timeout: 15000 });
    
    await page.click('button:has-text("Generate Tasks")');
    await expect(page.locator('button:has-text("Generating...")')).toBeVisible();

    // Wait until "Approve Plan" appears
    await expect(page.locator('button:has-text("Approve Plan")')).toBeVisible({ timeout: 15000 });
    
    await page.click('button:has-text("Approve Plan")');
    
    // Status should change to Plan Approved
    await expect(page.locator('text="Plan Approved"')).toBeVisible();
  });
});
