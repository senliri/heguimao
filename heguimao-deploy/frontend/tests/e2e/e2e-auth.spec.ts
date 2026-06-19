import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('auth page loads', async ({ page }) => {
    await page.goto('/auth');
    
    // Should show Compliance Cat branding
    await expect(page.locator('h1', { hasText: /Compliance Cat/i })).toBeVisible({ timeout: 5000 });
    
    // Should show Sign In / Register toggle
    await expect(page.locator('button', { hasText: /Sign In/i }).first()).toBeVisible();
    await expect(page.locator('button', { hasText: /Register/i })).toBeVisible();
    
    // Check form fields (email and password always visible)
    await expect(page.getByPlaceholder(/Email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Password/i)).toBeVisible();
  });

  test('switch to register mode', async ({ page }) => {
    await page.goto('/auth');
    
    // Click Register button
    await page.locator('button', { hasText: /Register/i }).first().click();
    
    // Name field should appear
    await expect(page.getByPlaceholder(/Name/i)).toBeVisible({ timeout: 3000 });
    
    // Should show 'Create Account' button
    await expect(page.locator('button', { hasText: /Create Account/i })).toBeVisible();
  });

  test('successful registration redirects to home', async ({ page }) => {
    await page.goto('/auth');
    
    // Switch to register mode
    await page.locator('button', { hasText: /Register/i }).first().click();
    
    // Fill in registration form with unique email
    const uniqueEmail = `e2e-${Date.now()}@compliance.cat`;
    await page.getByPlaceholder(/Name/i).fill('E2E Test User');
    await page.getByPlaceholder(/Email/i).fill(uniqueEmail);
    await page.getByPlaceholder(/Password/i).fill('test123456');
    
    // Click Create Account button
    await page.locator('form').getByRole('button', { name: /Create Account/i }).click();
    
    // Wait for navigation to home
    await page.waitForURL(/\/?(\?.*)?$/, { timeout: 15000 });
    
    // Verify home page loaded - check for main heading
    await expect(page.locator('h1', { hasText: /Compliance Check/i })).toBeVisible({ timeout: 5000 });
  });
});
