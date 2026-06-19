import { test, expect } from '@playwright/test';

test.describe('Main Flow - AI Diagnosis', () => {
  test('complete diagnosis flow', async ({ page }) => {
    await page.goto('/');
    
    // Wait for home page to load - check for main heading
    await expect(page.locator('h1', { hasText: /Compliance Check/i })).toBeVisible({ timeout: 5000 });
    
    // Enter product description via the input field
    const input = page.locator('input[type="text"]').first();
    await input.fill('Bluetooth headphones');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to report page (should happen within 10s)
    // Note: Loading state "Analyzing..." may flash too quickly to catch
    await page.waitForURL(/.*\/report.*/, { timeout: 10000 });
    
    // Verify report page loaded
    await expect(page.getByText('Compliance Check Report')).toBeVisible({ timeout: 5000 });
    
    // Check that report contains certification recommendations
    const recommendationCards = page.locator('.rounded-xl.border.p-4');
    await expect(recommendationCards.first()).toBeVisible({ timeout: 5000 });
  });
});
