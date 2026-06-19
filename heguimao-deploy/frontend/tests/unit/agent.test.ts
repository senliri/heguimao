import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FEATURE_KEYWORDS, inferFeaturesFromKeywords, inferCategory, getStaticDiagnosis } from '../../src/lib/agent';

describe('Feature Keyword Matching', () => {
  it('detects battery keywords', () => {
    const result = inferFeaturesFromKeywords('power bank 10000mAh');
    expect(result.has_battery).toBe(true);
  });

  it('detects wireless keywords', () => {
    const result = inferFeaturesFromKeywords('bluetooth wireless headphones');
    expect(result.has_wireless).toBe(true);
  });

  it('detects children product keywords', () => {
    const result = inferFeaturesFromKeywords('baby bottle BPA-free');
    expect(result.is_children).toBe(true);
  });

  it('detects multiple features simultaneously', () => {
    const result = inferFeaturesFromKeywords('wireless rechargeable baby monitor');
    expect(result.has_wireless).toBe(true);
    expect(result.has_battery).toBe(true);
    expect(result.is_children).toBe(true);
  });

  it('returns empty features for unrelated product', () => {
    const result = inferFeaturesFromKeywords('wooden dining table');
    expect(result.has_battery).toBeFalsy();
    expect(result.has_wireless).toBeFalsy();
    expect(result.is_children).toBeFalsy();
  });
});

describe('Category Inference', () => {
  it('infers electronics from product type', () => {
    expect(inferCategory('wireless headphones')).toBe('electronics');
  });

  it('infers toys from product type', () => {
    expect(inferCategory('building blocks')).toBe('toys');
  });

  it('infers beauty from product type', () => {
    expect(inferCategory('face cream')).toBe('beauty');
  });
});

describe('Static Diagnosis', () => {
  it('returns static data for known category-market pairs', () => {
    // Electronics + US should return static diagnosis
    const result = getStaticDiagnosis('Bluetooth headphones', 'US');
    expect(result).not.toBeNull();
    if (result) {
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    }
  });

  it('returns null for unknown products', () => {
    const result = getStaticDiagnosis('unknown weird product xyz', 'US');
    expect(result).toBeNull();
  });
});
