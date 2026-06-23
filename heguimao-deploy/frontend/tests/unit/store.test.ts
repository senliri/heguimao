import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
vi.stubGlobal("localStorage", localStorageMock);

describe("store module", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("should normalize cache key with exact match", async () => {
    const { normalizeCacheKey } = await import("../../src/lib/store");
    const key = normalizeCacheKey("USB-C Charger", "us");
    expect(typeof key).toBe("string");
    expect(key).toContain("us");
  });

  it("should normalize cache key with keyword match", async () => {
    const { normalizeCacheKey } = await import("../../src/lib/store");
    const key = normalizeCacheKey("Bluetooth Headphones", "eu");
    expect(typeof key).toBe("string");
    expect(key).toContain("audio-equipment");
  });

  it("should fallback to first word for unknown products", async () => {
    const { normalizeCacheKey } = await import("../../src/lib/store");
    const key = normalizeCacheKey("Random Widget", "us");
    expect(key).toContain("random");
  });

  it("should save and retrieve diagnosis from cache", async () => {
    const { cache } = await import("../../src/lib/store");
    const testData = { certification: "FCC", confidence: "high" };
    cache.setDiagnosis("USB Charger", "us", testData);
    const result = cache.getDiagnosis("USB Charger", "us");
    expect(result).toEqual(testData);
  });

  it("should expire cache after TTL", async () => {
    const { cache } = await import("../../src/lib/store");
    const key = "compliance_cat_diagnosis_cache";
    localStorageMock.setItem(key, JSON.stringify([
      {
        productType: "Old Product",
        market: "us",
        result: { old: true },
        timestamp: Date.now() - 13 * 60 * 60 * 1000,
      },
    ]));
    const result = cache.getDiagnosis("Old Product", "us");
    expect(result).toBeUndefined();
  });

  it("should record cache stats", async () => {
    const { cache } = await import("../../src/lib/store");
    cache.recordHit();
    cache.recordMiss();
    const stats = cache.getStats();
    expect(stats.hits).toBeGreaterThan(0);
    expect(stats.misses).toBeGreaterThan(0);
  });

  it("should save report to history", async () => {
    const { store } = await import("../../src/lib/store");
    const record = store.saveReport({
      productType: "USB Charger",
      market: "us",
      profile: { category: "electronics" },
      diagnosis: { certifications: ["FCC"] },
    });
    expect(record.id).toMatch(/^report_/);
    expect(record.timestamp).toBeDefined();
  });

  it("should limit history to MAX_HISTORY (50)", async () => {
    const { store } = await import("../../src/lib/store");
    for (let i = 0; i < 55; i++) {
      store.saveReport({
        productType: `Product ${i}`,
        market: "us",
        profile: {},
        diagnosis: {},
      });
    }
    const history = store.getHistory();
    expect(history.length).toBeLessThanOrEqual(50);
  });

  it("should delete individual record", async () => {
    const { store } = await import("../../src/lib/store");
    const record = store.saveReport({
      productType: "Test Product",
      market: "us",
      profile: {},
      diagnosis: {},
    });
    store.deleteRecord(record.id);
    expect(store.getRecord(record.id)).toBeUndefined();
  });

  it("should clear all history", async () => {
    const { store } = await import("../../src/lib/store");
    store.saveReport({
      productType: "Test Product",
      market: "us",
      profile: {},
      diagnosis: {},
    });
    store.clearHistory();
    expect(store.getHistory()).toHaveLength(0);
  });
});
