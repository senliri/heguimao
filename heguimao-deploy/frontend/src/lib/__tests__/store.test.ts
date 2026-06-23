import { describe, it, expect, beforeEach, vi } from 'vitest';
import { normalizeCacheKey, cache, store, type ReportRecord } from '../store';

// Mock localStorage
const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }),
  get length() { return Object.keys(mockStorage).length; },
  key: vi.fn((n: number) => Object.keys(mockStorage)[n] || null),
});

const localStorageMock = localStorage as any;

function clearStorage() {
  Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
}

describe('store.ts - normalizeCacheKey', () => {
  it('should return exact match from normalization map', () => {
    const key = normalizeCacheKey('headphone', 'us');
    expect(key).toBe('audio-equipment-us');
  });

  it('should normalize power bank keywords', () => {
    expect(normalizeCacheKey('portable charger', 'eu')).toBe('power-bank-eu');
    expect(normalizeCacheKey('battery', 'eu')).toBe('power-bank-eu');
  });

  it('should normalize toy keywords', () => {
    expect(normalizeCacheKey('plush doll', 'us')).toBe('toys-us');
    expect(normalizeCacheKey('lego', 'us')).toBe('toys-us');
  });

  it('should normalize beauty keywords', () => {
    expect(normalizeCacheKey('lipstick', 'uk')).toBe('beauty-uk');
    expect(normalizeCacheKey('shampoo', 'uk')).toBe('beauty-uk');
  });

  it('should normalize home keywords', () => {
    expect(normalizeCacheKey('air fryer', 'jp')).toBe('home-jp');
    expect(normalizeCacheKey('vacuum cleaner', 'jp')).toBe('home-jp');
  });

  it('should normalize auto keywords', () => {
    expect(normalizeCacheKey('dash cam', 'de')).toBe('auto-de');
  });

  it('should normalize pet keywords', () => {
    expect(normalizeCacheKey('cat litter', 'fr')).toBe('pet-fr');
  });

  it('should normalize baby keywords', () => {
    expect(normalizeCacheKey('baby bottle', 'ca')).toBe('baby-ca');
  });

  it('should normalize health keywords', () => {
    expect(normalizeCacheKey('vitamin', 'br')).toBe('health-br');
  });

  it('should normalize garden keywords', () => {
    expect(normalizeCacheKey('fertilizer', 'au')).toBe('garden-au');
  });

  it('should fallback to first significant word when no match', () => {
    const key = normalizeCacheKey('mystery product xyz', 'us');
    expect(key).toContain('-us');
    expect(key.startsWith('mystery-')).toBe(true);
  });

  it('should handle empty product type', () => {
    const key = normalizeCacheKey('', 'us');
    expect(key).toBe('generic-us');
  });

  it('should handle whitespace-only product type', () => {
    const key = normalizeCacheKey('   ', 'us');
    expect(key).toBe('generic-us');
  });

  it('should normalize market by removing non-alphanumeric chars', () => {
    const key = normalizeCacheKey('toy', 'US-East');
    expect(key).toBe('toys-us-east');
  });
});

describe('store.ts - cache', () => {
  beforeEach(() => { clearStorage(); });

  it('should return undefined for empty cache', () => {
    const result = cache.getDiagnosis('headphone', 'us');
    expect(result).toBeUndefined();
  });

  it('should save and retrieve diagnosis', () => {
    const testData = { summary: 'test diagnosis', score: 95 };
    cache.setDiagnosis('headphone', 'us', testData);
    const result = cache.getDiagnosis('headphone', 'us');
    expect(result).toEqual(testData);
  });

  it('should use normalized cache key for retrieval', () => {
    // Store with one keyword
    cache.setDiagnosis('portable charger', 'us', { summary: 'power bank diagnosis' });
    // Retrieve with normalized form
    const result = cache.getDiagnosis('power bank', 'us');
    expect(result).toEqual({ summary: 'power bank diagnosis' });
  });

  it('should expire cache entries after TTL', () => {
    const testData = { summary: 'expiring test' };
    cache.setDiagnosis('test-product', 'us', testData);

    // Manually set timestamp to past
    const data = JSON.parse(localStorage.getItem('compliance_cat_diagnosis_cache')!);
    data[0].timestamp = Date.now() - 13 * 60 * 60 * 1000; // 13 hours ago (> 12h TTL)
    localStorage.setItem('compliance_cat_diagnosis_cache', JSON.stringify(data));

    const result = cache.getDiagnosis('test-product', 'us');
    expect(result).toBeUndefined();
  });

  it('should keep cache within LRU limit of 100', () => {
    for (let i = 0; i < 110; i++) {
      cache.setDiagnosis(`product-${i}`, 'us', { id: i });
    }
    const data = JSON.parse(localStorage.getItem('compliance_cat_diagnosis_cache')!);
    expect(data.length).toBeLessThanOrEqual(100);
  });

  it('should clear all cache', () => {
    cache.setDiagnosis('product', 'us', { data: 'test' });
    cache.clear();
    expect(cache.getDiagnosis('product', 'us')).toBeUndefined();
  });

  it('should track cache stats', () => {
    // Force a miss
    cache.getDiagnosis('nonexistent', 'us');
    // Force a hit
    cache.setDiagnosis('hit-test', 'us', { data: 'hit' });
    cache.getDiagnosis('hit-test', 'us');

    const stats = cache.getStats();
    expect(stats.hits).toBeGreaterThanOrEqual(1);
    expect(stats.misses).toBeGreaterThanOrEqual(1);
    expect(stats.totalSaved).toBeGreaterThanOrEqual(1);
  });

  it('should reset stats', () => {
    cache.setDiagnosis('product', 'us', { data: 'test' });
    cache.getDiagnosis('product', 'us');
    cache.resetStats();
    const stats = cache.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });

  it('should handle corrupted cache gracefully', () => {
    localStorage.setItem('compliance_cat_diagnosis_cache', 'not-json');
    const result = cache.getDiagnosis('product', 'us');
    expect(result).toBeUndefined();
  });

  it('should handle corrupted stats gracefully', () => {
    localStorage.setItem('compliance_cat_cache_stats', 'not-json');
    const stats = cache.getStats();
    expect(stats).toEqual({ hits: 0, misses: 0, totalSaved: 0, lastHit: null, lastMiss: null });
  });
});

describe('store.ts - store (history)', () => {
  beforeEach(() => { clearStorage(); });

  it('should save and retrieve report history', () => {
    const record = store.saveReport({
      productType: 'headphone',
      market: 'us',
      profile: { hasBattery: true },
      diagnosis: { riskLevel: 'high' },
    });
    expect(record.id).toBeTruthy();
    expect(record.timestamp).toBeGreaterThan(0);

    const history = store.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].productType).toBe('headphone');
  });

  it('should get single record by id', () => {
    const saved = store.saveReport({
      productType: 'test-product',
      market: 'eu',
      profile: {},
      diagnosis: {},
    });
    const found = store.getRecord(saved.id);
    expect(found).toBeDefined();
    expect(found!.productType).toBe('test-product');
  });

  it('should return undefined for non-existent record', () => {
    const found = store.getRecord('non-existent-id');
    expect(found).toBeUndefined();
  });

  it('should delete a record', () => {
    const saved = store.saveReport({
      productType: 'delete-me',
      market: 'us',
      profile: {},
      diagnosis: {},
    });
    store.deleteRecord(saved.id);
    expect(store.getHistory().length).toBe(0);
  });

  it('should clear all history', () => {
    store.saveReport({ productType: 'a', market: 'us', profile: {}, diagnosis: {} });
    store.saveReport({ productType: 'b', market: 'eu', profile: {}, diagnosis: {} });
    store.clearHistory();
    expect(store.getHistory().length).toBe(0);
  });

  it('should limit history to 50 records', () => {
    for (let i = 0; i < 55; i++) {
      store.saveReport({
        productType: `product-${i}`,
        market: 'us',
        profile: {},
        diagnosis: {},
      });
    }
    const history = store.getHistory();
    expect(history.length).toBeLessThanOrEqual(50);
  });

  it('should put newest records first', () => {
    store.saveReport({ productType: 'first', market: 'us', profile: {}, diagnosis: {} });
    // Small delay to ensure different timestamps
    const saved = store.saveReport({ productType: 'second', market: 'us', profile: {}, diagnosis: {} });
    const history = store.getHistory();
    expect(history[0].productType).toBe('second');
    expect(history[1].productType).toBe('first');
  });

  it('should cleanup expired records (>90 days)', () => {
    // Manually inject old records
    const oldHistory = [
      {
        id: 'old-1',
        productType: 'old-product',
        market: 'us',
        profile: {},
        diagnosis: {},
        timestamp: Date.now() - 100 * 24 * 60 * 60 * 1000, // 100 days ago
      },
      {
        id: 'recent-1',
        productType: 'recent-product',
        market: 'us',
        profile: {},
        diagnosis: {},
        timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
      },
    ];
    localStorage.setItem('compliance_cat_history', JSON.stringify(oldHistory));

    store.cleanupExpired();
    const history = store.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].id).toBe('recent-1');
  });

  it('should handle corrupted history gracefully', () => {
    localStorage.setItem('compliance_cat_history', 'not-valid-json');
    const history = store.getHistory();
    expect(history).toEqual([]);
  });

  it('should handle localStorage write failure', () => {
    // Override setItem to throw
    const origSetItem = localStorage.setItem.bind(localStorage);
    (localStorage.setItem as any).mockImplementation(() => { throw new Error('Quota exceeded'); });

    // Should not throw
    const record = store.saveReport({
      productType: 'quota-test',
      market: 'us',
      profile: {},
      diagnosis: {},
    });
    expect(record).toBeDefined();
    // Restore
    (localStorage.setItem as any).mockImplementation(origSetItem);
  });
});
