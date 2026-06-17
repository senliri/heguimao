import { test, expect } from '@playwright/test';

test.describe('Appeal Page - Three Tabs', () => {
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

  test('appeal page loads with three tabs', async ({ page }) => {
    await page.goto('/appeal');
    
    // Should show three tabs
    await expect(page.getByRole('button', { name: /Smart Analyzer/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Appeal Guide/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Archive/i })).toBeVisible();
  });

  test('smart analyzer tab functionality', async ({ page }) => {
    await page.goto('/appeal');
    
    // Click on Smart Analyzer tab
    await page.getByRole('button', { name: 'Smart Analyzer' }).click();
    
    // Should show analyzer interface
    await expect(page.getByText(/Smart Appeal Analyzer/i)).toBeVisible({ timeout: 5000 });
    
    // Should have textarea for pasting notice
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    
    // Should have analyze button (specific to the analyzer, not the tab)
    await expect(page.getByRole('button', { name: 'Analyze Review Notice' })).toBeVisible();
  });

  test('appeal guide tab content', async ({ page }) => {
    await page.goto('/appeal');
    
    // Click on Appeal Guide tab
    await page.getByRole('button', { name: /Appeal Guide/i }).click();
    
    // Should show guide content
    await expect(page.getByText(/Amazon Appeal Guide/i)).toBeVisible({ timeout: 5000 });
    
    // Should show common removal reasons
    await expect(page.getByText(/Common Removal Reasons/i)).toBeVisible();
    
    // Should show appeal steps
    await expect(page.getByText(/Appeal Steps/i)).toBeVisible();
    
    // Should show FAQ section
    await expect(page.getByText(/Appeal FAQ/i)).toBeVisible();
  });

  test('archive tab functionality', async ({ page }) => {
    await page.goto('/appeal');
    
    // Click on Archive tab
    await page.getByRole('button', { name: /Archive/i }).click();
    
    // Should show archive interface
    await expect(page.getByText(/Compliance Archive/i)).toBeVisible({ timeout: 5000 });
    
    // Should show empty state or history table
    const emptyState = page.getByText(/No Appeal Records Yet/i);
    const historyTable = page.locator('table');
    
    // Either empty state or history table should be visible
    await expect(emptyState.or(historyTable)).toBeVisible();
  });
});
