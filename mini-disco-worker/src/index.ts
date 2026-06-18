/**
 * Mini-Disco Cloudflare Worker
 * AI Chat API Proxy — replaces Vercel Serverless Function /api/chat
 * 
 * Features:
 * - Rate limiting (10 req/min per IP)
 * - Auth gate (optional password)
 * - Prompt routing (diagnose / appeal / general chat)
 * - Agnes LLM API proxy
 * - Suspicious response detection
 * - Optional KV cache (uncomment in wrangler.toml to enable)
 */

// ─── Types ───────────────────────────────────────────────────────────

// Type definitions removed for JS compatibility
// Types are inferred at runtime

// ─── Constants ──────────────────────────────────────────────────────

const DEFAULT_AGNES_URL = 'https://apihub.agnes-ai.com/v1/chat/completions';
const DEFAULT_MODEL = 'agnes-2.0-flash';
const RATE_LIMIT = 10;          // requests per window
const RATE_WINDOW_MS = 60_000;  // 1 minute
const CLEANUP_INTERVAL_MS = 300_000; // 5 minutes
const CACHE_TTL = 3600;         // 1 hour (for KV cache)

// ─── Rate Limiter ───────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Periodic cleanup of stale entries
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function startCleanupTimer() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
  }, CLEANUP_INTERVAL_MS);
}

function checkRateLimit(ip: string): boolean {
  startCleanupTimer();
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ─── SHA-256 Hash Helper ────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Cache Helpers (KV) ─────────────────────────────────────────────

async function getCachedReply(cacheKey: string, env: Env): Promise<string | null> {
  const cache = (env as any).CHAT_CACHE;
  if (!cache) return null;
  return await cache.get(cacheKey);
}

async function setCachedReply(
  cacheKey: string,
  reply: string,
  env: Env
): Promise<void> {
  const cache = (env as any).CHAT_CACHE;
  if (!cache) return;
  await cache.put(cacheKey, reply, { expirationTtl: CACHE_TTL });
}

function generateCacheKey(text: string): string {
  // Simple hash: use SHA-256 of the input text
  const textBytes = new TextEncoder().encode(text);
  // For speed, use a simple deterministic key format
  // In production, hash the text — here we use it directly (KV supports keys up to 2KB)
  // Truncate to avoid very long keys
  const trimmed = text.slice(0, 1000);
  return `chat:${sha256Sync(trimmed)}`;
}

// Simple sync hash for key generation (first 16 hex chars of SHA-256)
function sha256Sync(text: string): string {
  // We can't do sync SHA-256 in Workers, so use a simple hash function for key generation
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to 8 hex chars
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ─── Request Handlers ───────────────────────────────────────────────

function getIP(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    'unknown'
  );
}

async function parseBody(request: Request): Promise<any> {
  const chunks: Uint8Array[] = [];
  const reader = request.body?.getReader();
  if (!reader) throw new Error('No request body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // Workers-compatible: use TextDecoder instead of Buffer
  const decoder = new TextDecoder('utf-8');
  const allBytes = new Uint8Array(chunks.reduce((acc, v) => acc + v.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    allBytes.set(chunk, offset);
    offset += chunk.length;
  }
  const bodyStr = decoder.decode(allBytes);
  return JSON.parse(bodyStr);
}

async function handleAuth(
  body: ChatRequestBody,
  env: Env
): Promise<{ ok: boolean; error: string } | null> {
  // No auth configured
  if (!env.AUTH_PASSWORD) return null;

  // Auth not required for diagnose/appeal actions
  if (body.action === 'diagnose' || body.action === 'appeal') return null;

  const provided = body.authPassword || '';
  const expectedHash = await sha256(env.AUTH_PASSWORD);
  const providedHash = await sha256(provided);

  if (providedHash !== expectedHash) {
    return { ok: false, error: 'Authentication required' };
  }

  return null;
}

function buildMessages(body: ChatRequestBody): {
  system: string;
  user: string;
  temperature: number;
} {
  const { action, prompt, message, messages } = body;

  let systemPrompt: string;
  let userMessage: string;
  let temperature = body.temperature ?? 0.3;

  if (action === 'diagnose' || action === 'ask') {
    systemPrompt = prompt || 'You are a compliance expert for Amazon sellers.';
    userMessage = message || '';
  } else if (action === 'appeal' || action === 'appeal-analyze') {
    systemPrompt = prompt || 'You are an Amazon appeal expert.';
    userMessage = message || '';
    temperature = 0.7; // Higher creativity for appeals
  } else if (messages && Array.isArray(messages)) {
    // Multi-turn conversation — extract system prompt
    const systemMsg = messages.find(m => m.role === 'system');
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    systemPrompt = systemMsg?.content || 'You are a compliance expert for Amazon sellers.';
    userMessage = lastUserMsg?.content || '';
  } else {
    // General chat
    systemPrompt = prompt || 'You are a compliance expert for Amazon sellers.';
    userMessage = message || '';
  }

  return { system: systemPrompt, user: userMessage, temperature };
}

async function callAgnesAPI(
  env: Env,
  systemPrompt: string,
  userMessage: string,
  temperature: number,
  rest: Record<string, unknown>
): Promise<{ ok: boolean; reply?: string; statusCode?: number; error?: string }> {
  const apiURL = env.AGNES_API_URL || DEFAULT_AGNES_URL;
  const model = env.AGNES_MODEL || DEFAULT_MODEL;

  try {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 25000);

    const response = await fetch(apiURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.AGNES_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature,
        ...rest,
      }),
      signal: timeoutController.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return {
        ok: false,
        statusCode: response.status,
        error: `AI service error: ${response.status}`,
      };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || data.reply || '';

    // Detect suspicious/empty responses
    const suspiciousPatterns = [
      'this page is only available',
      'invalid api key',
      'authentication failed',
      'please configure',
    ];
    const replyLower = (reply || '').toLowerCase();
    const isSuspicious = suspiciousPatterns.some(p => replyLower.includes(p));

    if (isSuspicious || !reply || reply.length < 10) {
      return {
        ok: false,
        statusCode: 502,
        error: isSuspicious
          ? 'AI returned suspicious response'
          : 'AI returned empty response',
      };
    }

    return { ok: true, reply };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, statusCode: 502, error: `AI request failed: ${message}` };
  }
}

// ─── Main Handler ───────────────────────────────────────────────────

async function handleChat(request: Request, env: Env): Promise<Response> {
  const startTime = Date.now();
  const ip = getIP(request);
  const userAgent = request.headers.get('User-Agent') || '';

  // Rate limiting
  if (!checkRateLimit(ip)) {
    console.log(`[RATE_LIMIT] ip=${ip} ua=${userAgent.substring(0, 50)}`);
    return json_response(
      { error: 'Rate limit exceeded. Try again later.' },
      429
    );
  }

  // Parse body
  let body: ChatRequestBody;
  try {
    body = await parseBody(request);
  } catch {
    return json_response({ error: 'Invalid request body' }, 400);
  }

  // Auth check
  const authResult = await handleAuth(body, env);
  if (authResult) {
    return json_response({ error: authResult.error }, 401);
  }

  // Build messages
  const { system, user, temperature } = buildMessages(body);

  // Extract rest (temperature, etc.)
  const { action, prompt: _prompt, message: _message, messages: _messages, authPassword: _auth, ...rest } = body;

  // Check KV cache
  const cacheKey = generateCacheKey(user);
  const cached = await getCachedReply(cacheKey, env);
  if (cached) {
    return json_response({ reply: cached });
  }

  // Call Agnes API
  const result = await callAgnesAPI(env, system, user, temperature, rest);

  const elapsed = Date.now() - startTime;
  if (result.ok) {
    console.log(`[OK] ip=${ip} elapsed=${elapsed}ms`);
  } else {
    console.error(`[ERROR] ip=${ip} elapsed=${elapsed}ms error=${result.error}`);
  }

  if (!result.ok) {
    return json_response(
      { error: result.error },
      result.statusCode ?? 502
    );
  }

  // Write to cache
  await setCachedReply(cacheKey, result.reply!, env);

  return json_response({ reply: result.reply });
}

// ─── Exports ─────────────────────────────────────────────────────────

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      // Health check endpoint
      if (request.method === 'GET' && request.url.endsWith('/health')) {
        const checks = {
          AGNES_API_KEY: !!(env as any).AGNES_API_KEY,
          AUTH_PASSWORD: !!(env as any).AUTH_PASSWORD,
        };
        const allHealthy = Object.values(checks).every(Boolean);
        return json_response({
          status: allHealthy ? 'healthy' : 'degraded',
          checks,
          timestamp: new Date().toISOString(),
        }, allHealthy ? 200 : 503);
      }
      return json_response({ error: 'Method not allowed' }, 405);
    }

    return handleChat(request, env);
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Alias for consistency
const json_response = jsonResponse;

// Type helper for accessing typed env
function getEnv(): Env {
  return globalThis as unknown as Env;
}
