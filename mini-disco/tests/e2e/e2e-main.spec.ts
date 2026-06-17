import { test, expect } from '@playwright/test';

test.describe('Main Flow - AI Diagnosis', () => {
  test.beforeEach(async ({ page }) => {
    // Inject auth session before page load
    await page.addInitScript(() => {
      localStorage.setItem('compliance_cat_session', JSON.stringify({
        user: { id: 'e2e-user', email: 'e2e@test.com', name: 'E2E User' },
        token: 'e2e-token',
        expiresAt: Date.now() + 86400000,
      }));
    });
  });

  test('complete diagnosis flow', async ({ page }) => {
    await page.goto('/');
    
    // Wait for home page to load
    await expect(page.getByText('Tell me your product')).toBeVisible({ timeout: 5000 });
    
    // Enter product description
    const input = page.locator('input[type="text"]');
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
