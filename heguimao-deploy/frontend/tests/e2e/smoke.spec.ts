/**
 * Smoke tests for Compliance Cat frontend
 * Run with: npx playwright test tests/smoke.spec.ts
 */
import { test, expect } from '@playwright/test';

test.describe('Compliance Cat - Smoke Tests', () => {
  test('homepage loads with correct title', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await expect(page).toHaveTitle(/Compliance Cat/i);
  });

  test('homepage has hero section with heading', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    const heading = page.locator('h1', { hasText: /Compliance Check/i });
    await expect(heading).toBeVisible();
  });

  test('homepage has input field', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    const input = page.getByPlaceholder(/Bluetooth headphones/i);
    await expect(input).toBeVisible();
  });

  test('homepage has quick input examples', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    const examples = page.getByRole('button', { name: /Bluetooth headphones|Power bank|Children|Yoga mat/i });
    await expect(examples.first()).toBeVisible();
    const count = await examples.count();
    test.info().annotations.push(`Found ${count} examples`);
    expect(count, 'at least 4 quick input buttons').toBeGreaterThanOrEqual(4);
  });

  test('homepage has feature cards', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    const cards = page.locator('a[href="/appeal"], a[href="/portfolio"], a[href="/dashboard"]');
    const cardCount = await cards.count();
    test.info().annotations.push(`Found ${cardCount} navigation links`);
    expect(cardCount, 'at least 3 feature card links').toBeGreaterThanOrEqual(3);
  });

  test('navigate to report page via URL', async ({ page }) => {
    await page.goto('http://localhost:5173/report');
    await expect(page.locator('h1', { hasText: /Compliance Check Report/i })).toBeVisible();
  });

  test('navigate to appeal page', async ({ page }) => {
    await page.goto('http://localhost:5173/appeal');
    await expect(page.locator('h1', { hasText: /Appeal/i })).toBeVisible();
  });

  test('market selector dropdown works', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    const marketBtn = page.locator('button', { hasText: /🇺🇸 US/i }).first();
    await marketBtn.click();
    // Dropdown should appear
    const dropdown = page.locator('.absolute.z-50');
    await expect(dropdown).toBeVisible();
    // Click a different market
    await page.locator('button', { hasText: /🇪🇺 EU/i }).first().click();
  });

  test('static diagnosis works without AI (Home page)', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    // Click a quick input
    await page.getByRole('button', { name: /Yoga mat/i }).click();
    // Should show chat interface - check for diagnosis result area
    await expect(page.locator('text=/Yoga mat|compliance|diagnosis/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    
    // Test Appeal link (public)
    await page.goto('http://localhost:5173/appeal');
    await expect(page.locator('button', { hasText: /Analyze Review Notice/i })).toBeVisible();
    
    // Verify Report link (public)
    await page.goto('http://localhost:5173/report');
    await expect(page.getByRole('heading', { name: 'Compliance Check Report' })).toBeVisible();
    
    // Verify Footer links exist
    await page.goto('http://localhost:5173/');
    const footerLinks = page.locator('footer a');
    await expect(footerLinks).toHaveCount(3); // Home, Report, Appeal
  });
});
