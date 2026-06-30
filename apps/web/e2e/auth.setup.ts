import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // We want to login here.
  await page.goto('/auth/login');
  
  // Wait for page load
  await page.waitForSelector('input[name="email"]');
  
  await page.fill('input[name="email"]', 'test@shipflow.me');
  await page.fill('input[name="password"]', 'password123');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/.*\/org\/test-org.*/);
  
  // Ensure the dir exists
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  
  // Save state
  await page.context().storageState({ path: authFile });
});
