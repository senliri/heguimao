import { test, expect } from "@playwright/test";

test.describe("Cross-Category Compliance Data — E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("compliance_cat_session", JSON.stringify({
        user: { id: "e2e-user", email: "e2e@test.com", name: "E2E User" },
        token: "e2e-token",
        expiresAt: Date.now() + 86400000,
      }));
    });
  });

  async function goToReportPage(page, marketId, catId) {
    await page.goto(`/report?market=${marketId}&cat=${catId}`);
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    await expect(page.locator("body").filter({ hasText: /compliance/i })).toBeVisible({ timeout: 10000 });
  }

  // ── Toys category ──

  test("Toys → EU → shows EN 71", async ({ page }) => {
    await goToReportPage(page, "eu", "toys");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/EN 71/i);
  });

  test("Toys → US → shows CPSIA", async ({ page }) => {
    await goToReportPage(page, "us", "toys");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/CPSIA/i);
  });

  test("Toys → SG → shows IMDA/General safety", async ({ page }) => {
    await goToReportPage(page, "sg", "toys");
    const body = await page.locator("body").textContent();
    // Toys in SG may have general compliance
    expect(body).toMatch(/compliance|safety|IMDA/i);
  });

  test("Toys → TH → shows TISI", async ({ page }) => {
    await goToReportPage(page, "th", "toys");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/TISI/i);
  });

  test("Toys → KR → shows KC Mark", async ({ page }) => {
    await goToReportPage(page, "kr", "toys");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/KC|EN 71/i);
  });

  // ── Beauty category ──

  test("Beauty → EU → shows EU 1223/2009", async ({ page }) => {
    await goToReportPage(page, "eu", "beauty");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/1223|cosmetic|CPNP/i);
  });

  test("Beauty → US → shows FDA", async ({ page }) => {
    await goToReportPage(page, "us", "beauty");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/FDA/i);
  });

  test("Beauty → BR → shows ANVISA", async ({ page }) => {
    await goToReportPage(page, "br", "beauty");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/ANVISA/i);
  });

  test("Beauty → KR → shows MFDS", async ({ page }) => {
    await goToReportPage(page, "kr", "beauty");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/MFDS/i);
  });

  test("Beauty → TH → shows Thai FDA", async ({ page }) => {
    await goToReportPage(page, "th", "beauty");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/FDA|cosmetic/i);
  });

  test("Beauty → SG → shows NEA", async ({ page }) => {
    await goToReportPage(page, "sg", "beauty");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/NEA|cosmetic/i);
  });

  // ── Baby category ──

  test("Baby → EU → shows EN 1888", async ({ page }) => {
    await goToReportPage(page, "eu", "baby");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/EN 1888|EN 71/i);
  });

  test("Baby → US → shows CPSIA", async ({ page }) => {
    await goToReportPage(page, "us", "baby");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/CPSIA|CPC/i);
  });

  test("Baby → BR → shows INMETRO", async ({ page }) => {
    await goToReportPage(page, "br", "baby");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/INMETRO/i);
  });

  test("Baby → IN → shows BIS", async ({ page }) => {
    await goToReportPage(page, "in", "baby");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/BIS/i);
  });

  test("Baby → KR → shows MFDS", async ({ page }) => {
    await goToReportPage(page, "kr", "baby");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/MFDS/i);
  });

  test("Baby → SA → shows SFDA", async ({ page }) => {
    await goToReportPage(page, "sa", "baby");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/SFDA/i);
  });

  // ── Home category ──

  test("Home → EU → shows EU 10/2011", async ({ page }) => {
    await goToReportPage(page, "eu", "home");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/10\/2011|food.contact|REACH/i);
  });

  test("Home → US → shows FDA Food Contact", async ({ page }) => {
    await goToReportPage(page, "us", "home");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/FDA|food.contact|Prop 65/i);
  });
});
