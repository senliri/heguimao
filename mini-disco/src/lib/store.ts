// Cache for AI diagnosis results (saves API calls)
const DIAGNOSIS_CACHE_KEY = "compliance_cat_diagnosis_cache";
const CACHE_STATS_KEY = "compliance_cat_cache_stats";
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours — compliance rules change frequently

// Product category normalization map for fuzzy caching
// Expanded with more keyword mappings for better cross-category cache hits
const CATEGORY_NORMALIZATION: Record<string, string> = {
  // Audio & electronics accessories
  "headphone": "audio-equipment",
  "headset": "audio-equipment",
  "earbud": "audio-equipment",
  "earphone": "audio-equipment",
  "speaker": "audio-equipment",
  "bluetooth": "audio-equipment",
  "power bank": "power-bank",
  "portable charger": "power-bank",
  "battery": "power-bank",
  // Toys
  "toy": "toys",
  "plush": "toys",
  "doll": "toys",
  "children": "toys",
  "kids": "toys",
  "puzzle": "toys",
  "building block": "toys",
  "lego": "toys",
  "rc car": "toys",
  "remote control": "toys",
  "board game": "toys",
  // Jewelry
  "necklace": "jewelry",
  "bracelet": "jewelry",
  "ring": "jewelry",
  "earring": "jewelry",
  "silver": "jewelry",
  "gold": "jewelry",
  "pendant": "jewelry",
  "chain": "jewelry",
  // Food
  "snack": "food",
  "pet food": "pet-food",
  "dog chew": "pet-food",
  "food": "food",
  "beverage": "food",
  "tea": "food",
  "coffee": "food",
  // Beauty & cosmetics
  "cosmetic": "beauty",
  "skincare": "beauty",
  "lipstick": "beauty",
  "perfume": "beauty",
  "foundation": "beauty",
  "mascara": "beauty",
  "shampoo": "beauty",
  "conditioner": "beauty",
  "body wash": "beauty",
  "face cream": "beauty",
  "serum": "beauty",
  "sunscreen": "beauty",
  "nail polish": "beauty",
  "hair dye": "beauty",
  // Home & kitchen
  "kitchen": "home",
  "cookware": "home",
  "pot": "home",
  "pan": "home",
  "plate": "home",
  "bowl": "home",
  "blender": "home",
  "toaster": "home",
  "air fryer": "home",
  "vacuum cleaner": "home",
  "fan": "home",
  "heater": "home",
  "humidifier": "home",
  "lamp": "home",
  "light bulb": "home",
  // Sports
  "yoga": "sports",
  "dumbbell": "sports",
  "resistance band": "sports",
  "jump rope": "sports",
  "cycling": "sports",
  "running": "sports",
  "camping": "sports",
  "tent": "sports",
  "sleeping bag": "sports",
  // Auto
  "car charger": "auto",
  "dash cam": "auto",
  "car cleaner": "auto",
  "seat cover": "auto",
  "floor mat": "auto",
  // Pet
  "pet toy": "pet",
  "pet bed": "pet",
  "pet collar": "pet",
  "pet leash": "pet",
  "pet shampoo": "pet",
  "cat litter": "pet",
  // Baby
  "baby bottle": "baby",
  "pacifier": "baby",
  "stroller": "baby",
  "car seat": "baby",
  "diaper": "baby",
  "bib": "baby",
  "onesie": "baby",
  // Health
  "vitamin": "health",
  "supplement": "health",
  "protein powder": "health",
  "fish oil": "health",
  "probiotic": "health",
  "thermometer": "health",
  "blood pressure": "health",
  "massager": "health",
  // Garden
  "fertilizer": "garden",
  "pesticide": "garden",
  "herbicide": "garden",
  "pruner": "garden",
  "shovel": "garden",
};

/**
 * Normalize product type + market into a deterministic cache key.
 * Priority: exact match → keyword match → first significant word.
 */
export function normalizeCacheKey(productType: string, market: string): string {
  const lower = productType.toLowerCase().trim();
  const marketKey = market.toLowerCase().replace(/[^a-z0-9]/g, "-");
  // 1. Exact match in normalization map
  const direct = CATEGORY_NORMALIZATION[lower];
  if (direct) return `${direct}-${marketKey}`;
  // 2. Keyword inclusion match (more specific keywords first)
  const sortedKeywords = Object.keys(CATEGORY_NORMALIZATION)
    .sort((a, b) => b.length - a.length); // longer keywords first
  for (const keyword of sortedKeywords) {
    // Use word boundary matching to avoid false positives
    // e.g., "phone" should not match "smartphone"
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower)) {
      return `${CATEGORY_NORMALIZATION[keyword]}-${marketKey}`;
    }
  }
  // 3. Fallback: first word with >2 chars
  const words = lower.split(/[\s,.-]+/).filter(w => w.length > 2);
  const primaryWord = words[0] || "generic";
  return `${primaryWord}-${marketKey}`;
}

export interface DiagnosisCacheEntry {
  productType: string;
  market: string;
  result: unknown;
  timestamp: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  totalSaved: number; // approximate API calls saved
  lastHit: number | null;
  lastMiss: number | null;
}

export const cache = {
  /**
   * Get cached diagnosis result by product+market
   */
  getDiagnosis(productType: string, market: string): unknown {
    try {
      const data = localStorage.getItem(DIAGNOSIS_CACHE_KEY);
      if (!data) {
        cache.recordMiss();
        return undefined;
      }
      const entries: DiagnosisCacheEntry[] = JSON.parse(data);
      const targetKey = normalizeCacheKey(productType, market);
      const entry = entries.find(e => {
        // Try normalized key match first (fuzzy)
        if (normalizeCacheKey(e.productType, e.market) === targetKey) return true;
        // Then try exact match
        if (e.productType.toLowerCase() === productType.toLowerCase() &&
            e.market.toLowerCase() === market.toLowerCase()) return true;
        return false;
      });
      if (!entry) {
        cache.recordMiss();
        return undefined;
      }
      // Check if cache expired
      if (Date.now() - entry.timestamp > CACHE_TTL) {
        const filtered = entries.filter(e => e !== entry);
        localStorage.setItem(DIAGNOSIS_CACHE_KEY, JSON.stringify(filtered));
        cache.recordMiss();
        return undefined;
      }
      cache.recordHit();
      return entry.result;
    } catch {
      cache.recordMiss();
      return undefined;
    }
  },

  /**
   * Save diagnosis result to cache
   */
  setDiagnosis(productType: string, market: string, result: unknown): void {
    try {
      const data = localStorage.getItem(DIAGNOSIS_CACHE_KEY);
      const entries: DiagnosisCacheEntry[] = data ? JSON.parse(data) : [];
      const targetKey = normalizeCacheKey(productType, market);
      const filtered = entries.filter(e => {
        const eKey = normalizeCacheKey(e.productType, e.market);
        if (eKey === targetKey) return false;
        if (e.productType.toLowerCase() === productType.toLowerCase() &&
            e.market.toLowerCase() === market.toLowerCase()) return false;
        return true;
      });
      filtered.push({
        productType,
        market,
        result,
        timestamp: Date.now(),
      });
      // LRU: keep most recent 100
      if (filtered.length > 100) {
        filtered.splice(0, filtered.length - 100);
      }
      localStorage.setItem(DIAGNOSIS_CACHE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn("Cache write failed:", e);
    }
  },

  /**
   * Clear all cache
   */
  clear(): void {
    try {
      localStorage.removeItem(DIAGNOSIS_CACHE_KEY);
      localStorage.removeItem(CACHE_STATS_KEY);
    } catch {
      // silent
    }
  },

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    try {
      const data = localStorage.getItem(CACHE_STATS_KEY);
      if (!data) {
        return { hits: 0, misses: 0, totalSaved: 0, lastHit: null, lastMiss: null };
      }
      return JSON.parse(data);
    } catch {
      return { hits: 0, misses: 0, totalSaved: 0, lastHit: null, lastMiss: null };
    }
  },

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    try {
      localStorage.removeItem(CACHE_STATS_KEY);
    } catch {
      // silent
    }
  },

  /**
   * Record a cache hit
   */
  recordHit(): void {
    try {
      const stats = this.getStats();
      stats.hits++;
      stats.totalSaved++;
      stats.lastHit = Date.now();
      localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(stats));
    } catch {
      // silent
    }
  },

  /**
   * Record a cache miss
   */
  recordMiss(): void {
    try {      const stats = this.getStats();
      stats.misses++;
      stats.lastMiss = Date.now();
      localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(stats));
    } catch {
      // silent
    }
  },
};

// localStorage 数据持久化

export interface ReportRecord {
  id: string;
  productType: string;
  market: string;
  profile: Record<string, unknown>;
  diagnosis: Record<string, unknown>;
  timestamp: number;
}

const STORAGE_KEY = "compliance_cat_history";
const MAX_HISTORY = 50;

export const store = {
  /**
   * 保存诊断报告到历史
   */
  saveReport(record: Omit<ReportRecord, "id" | "timestamp">): ReportRecord {
    const history = this.getHistory();
    const newRecord: ReportRecord = {
      ...record,
      id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: Date.now(),
    };
    history.unshift(newRecord);
    // 最多保留 50 条
    while (history.length > MAX_HISTORY) {
      history.pop();
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      console.warn("localStorage 写入失败，可能存储空间不足");
    }
    return newRecord;
  },

  /**
   * 获取历史记录
   */
  getHistory(): ReportRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * 获取单条记录
   */
  getRecord(id: string): ReportRecord | undefined {
    return this.getHistory().find((r) => r.id === id);
  },

  /**
   * 删除记录
   */
  deleteRecord(id: string): void {
    const history = this.getHistory().filter((r) => r.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      console.warn("localStorage 删除失败");
    }
  },

  /**
   * 清空所有历史
   */
  clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // silent
    }
  },

  /**
   * 删除过期记录（超过 90 天）
   */
  cleanupExpired(): void {
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const history = this.getHistory().filter((r) => r.timestamp > ninetyDaysAgo);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // silent
    }
  },
};
