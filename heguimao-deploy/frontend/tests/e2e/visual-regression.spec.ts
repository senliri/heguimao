import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('homepage baseline screenshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('homepage.png', { 
      fullPage: false
    });
  });

  test('report page baseline screenshot', async ({ page }) => {
    await page.goto('http://localhost:5173/report');
    await expect(page).toHaveScreenshot('report-page.png', { fullPage: false });
  });

  test('appeal page baseline screenshot', async ({ page }) => {
    await page.goto('http://localhost:5173/appeal');
    await expect(page).toHaveScreenshot('appeal-page.png', { fullPage: false });
  });

  test('auth page baseline screenshot', async ({ page }) => {
    await page.goto('http://localhost:5173/auth');
    await expect(page).toHaveScreenshot('auth-page.png', { fullPage: false });
  });
});
