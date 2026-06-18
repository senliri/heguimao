import { test, expect } from "@playwright/test";

test.describe("New Markets Compliance Data — E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Inject auth session before page load (bypass AuthGate)
    await page.addInitScript(() => {
      localStorage.setItem("compliance_cat_session", JSON.stringify({
        user: { id: "e2e-user", email: "e2e@test.com", name: "E2E User" },
        token: "e2e-token",
        expiresAt: Date.now() + 86400000,
      }));
    });
  });

  // Navigate directly to Report page with market + category params
  async function goToReportPage(page, marketId, catId) {
    await page.goto(`/report?market=${marketId}&cat=${catId}`);
    // Wait for report content to render
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    // Wait for compliance content to appear
    await expect(page.locator("body").filter({ hasText: /compliance/i })).toBeVisible({ timeout: 10000 });
  }

  // ── Market-specific certification checks ──

  test("Singapore (SG) electronics → shows IMDA / NEA safety mark", async ({ page }) => {
    await goToReportPage(page, "sg", "electronics");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/IMDA|NEA|Safety Mark/i);
  });

  test("Thailand (TH) electronics → shows TISI certification", async ({ page }) => {
    await goToReportPage(page, "th", "electronics");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/TISI/i);
  });

  test("Saudi Arabia (SA) electronics → shows SASO / SABER", async ({ page }) => {
    await goToReportPage(page, "sa", "electronics");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/SASO|SABER/i);
  });

  test("Brazil (BR) electronics → shows INMETRO", async ({ page }) => {
    await goToReportPage(page, "br", "electronics");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/INMETRO/i);
  });

  test("India (IN) electronics → shows BIS certification", async ({ page }) => {
    await goToReportPage(page, "in", "electronics");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/BIS/i);
  });

  test("South Korea (KR) electronics → shows KC Mark", async ({ page }) => {
    await goToReportPage(page, "kr", "electronics");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/KC/i);
  });

  test("Turkey (TR) electronics → shows TSE certification", async ({ page }) => {
    await goToReportPage(page, "tr", "electronics");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/TSE/i);
  });

  test("South Africa (ZA) electronics → shows SABS", async ({ page }) => {
    await goToReportPage(page, "za", "electronics");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/SABS/i);
  });

  test("New Zealand (NZ) electronics → shows NZRC", async ({ page }) => {
    await goToReportPage(page, "nz", "electronics");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/NZRC/i);
  });

  // ── Additional market cross-checks ──

  test("UAE (AE) electronics → shows ESMA", async ({ page }) => {
    await goToReportPage(page, "ae", "electronics");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/ESMA/i);
  });

  test("Indonesia (ID) electronics → shows SNI", async ({ page }) => {
    await goToReportPage(page, "id", "electronics");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/SNI/i);
  });

  test("Malaysia (MY) electronics → shows SIRIM", async ({ page }) => {
    await goToReportPage(page, "my", "electronics");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/SIRIM/i);
  });

  test("Philippines (PH) electronics → shows BPS", async ({ page }) => {
    await goToReportPage(page, "ph", "electronics");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/BPS/i);
  });

  test("Vietnam (VN) electronics → shows CR Mark", async ({ page }) => {
    await goToReportPage(page, "vn", "electronics");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/CR/i);
  });
});
