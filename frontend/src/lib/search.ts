// 联网搜索合规数据
// 通过 Vercel Serverless Function 调用搜索 API

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface ComplianceSearchResult {
  results: SearchResult[];
  query: string;
  timestamp: number;
}

// 搜索缓存（24h TTL）
const searchCache = new Map<string, { data: ComplianceSearchResult; expires: number }>();

export async function searchCompliance(query: string, cacheTtl: number = 86400000): Promise<SearchResult[]> {
  const cacheKey = query;
  const cached = searchCache.get(cacheKey);
  
  if (cached && cached.expires > Date.now()) {
    return cached.data.results;
  }

  try {
    const response = await fetch("/api/compliance-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.error("搜索 API 失败:", response.status);
      return [];
    }

    const data = await response.json();
    const result: ComplianceSearchResult = {
      results: data.results || [],
      query,
      timestamp: Date.now(),
    };

    searchCache.set(cacheKey, {
      data: result,
      expires: Date.now() + cacheTtl,
    });

    return result.results;
  } catch (err) {
    console.error("合规搜索失败:", err);
    return [];
  }
}

// 清除特定搜索缓存
export function clearSearchCache(key?: string) {
  if (key) {
    searchCache.delete(key);
  } else {
    searchCache.clear();
  }
}
