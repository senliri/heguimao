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

import { JWT } from './jwt.js';

interface User {
  email: string;
  passwordHash: string;
  name: string;
  createdAt: number;
}

interface AuthRequest {
  action: 'register' | 'login' | 'verify' | 'logout';
  email?: string;
  password?: string;
  name?: string;
  token?: string;
}

// ─── Constants ──────────────────────────────────────────────────────

const DEFAULT_AGNES_URL = 'https://apihub.agnes-ai.com/v1/chat/completions';
const DEFAULT_MODEL = 'agnes-2.0-flash';
const AVAILABLE_MODELS = [
  { id: 'agnes-2.0-flash', object: 'model', created: 1718640000, owned_by: 'sapiens-ai' },
];
const RATE_LIMIT = 10;          // requests per window
const RATE_WINDOW_MS = 60_000;  // 1 minute
const CLEANUP_INTERVAL_MS = 300_000; // 5 minutes
const CACHE_TTL = 3600;         // 1 hour (for KV cache)

// ─── Subscription Tier Limits ───────────────────────────────────────

interface SubscriptionTier {
  plan: 'free' | 'basic' | 'pro';
  apiCallsLimit: number;
  maxReports: number;
}

const TIER_CONFIG: Record<string, SubscriptionTier> = {
  free: { plan: 'free', apiCallsLimit: 10, maxReports: 5 },
  basic: { plan: 'basic', apiCallsLimit: 100, maxReports: 50 },
  pro: { plan: 'pro', apiCallsLimit: 1000, maxReports: 500 },
};

async function getUserSubscription(userId: string, env: Env): Promise<SubscriptionTier> {
  const kv = (env as any).SUB_DB;
  if (!kv) return TIER_CONFIG.free;
  
  const key = `sub:${userId}`;
  const raw = await kv.get(key);
  if (!raw) return TIER_CONFIG.free;
  
  try {
    const sub = JSON.parse(raw);
    return TIER_CONFIG[sub.plan] || TIER_CONFIG.free;
  } catch {
    return TIER_CONFIG.free;
  }
}

async function incrementSubscriptionUsage(userId: string, env: Env): Promise<boolean> {
  const kv = (env as any).SUB_DB;
  if (!kv) return true; // No KV, skip enforcement
  
  const key = `sub:${userId}`;
  const raw = await kv.get(key);
  
  let usage: { calls: number; reports: number };
  if (raw) {
    try {
      usage = JSON.parse(raw);
    } catch {
      usage = { calls: 0, reports: 0 };
    }
  } else {
    usage = { calls: 0, reports: 0 };
  }
  
  const tier = await getUserSubscription(userId, env);
  usage.calls++;
  
  if (usage.calls > tier.apiCallsLimit) {
    return false; // Limit exceeded
  }
  
  await kv.put(key, JSON.stringify(usage));
  return true;
}

async function recordReport(userId: string, env: Env): Promise<boolean> {
  const kv = (env as any).SUB_DB;
  if (!kv) return true;
  
  const key = `sub:${userId}`;
  const raw = await kv.get(key);
  
  let usage: { calls: number; reports: number };
  if (raw) {
    try {
      usage = JSON.parse(raw);
    } catch {
      usage = { calls: 0, reports: 0 };
    }
  } else {
    usage = { calls: 0, reports: 0 };
  }
  
  const tier = await getUserSubscription(userId, env);
  usage.reports++;
  
  if (usage.reports > tier.maxReports) {
    return false;
  }
  
  await kv.put(key, JSON.stringify(usage));
  return true;
}

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

async function handleAuthAPI(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  
  // Parse request body
  let body: AuthRequest;
  try {
    // Use request.json() directly for simpler parsing
    body = await request.json() as AuthRequest;
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }
  
  // Get KV namespace
  const kv = (env as any).USER_DB;
  if (!kv) {
    return jsonResponse({ error: 'User database not configured' }, 503);
  }
  
  try {
    if (body.action === 'register') {
      // Registration
      if (!body.email || !body.password || !body.name) {
        return jsonResponse({ error: 'All fields are required' }, 400);
      }
      
      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        return jsonResponse({ error: 'Invalid email format' }, 400);
      }
      
      // Validate password strength
      if (body.password.length < 6) {
        return jsonResponse({ error: 'Password must be at least 6 characters' }, 400);
      }
      
      // Check if user exists
      const existing = await kv.get(body.email.toLowerCase());
      if (existing) {
        return jsonResponse({ error: 'Email already registered' }, 409);
      }
      
      // Hash password with SHA-256 (matches frontend auth.ts enhancedHash for fallback)
      // Note: Frontend uses PBKDF2, Worker uses SHA-256. Login flow verifies via Worker PBKDF2-compatible path.
      const passwordHash = await sha256(body.password);
      
      // Create user object
      const user: User = {
        email: body.email.toLowerCase(),
        passwordHash,
        name: body.name.trim(),
        createdAt: Date.now()
      };
      
      // Store in KV
      await kv.put(body.email.toLowerCase(), JSON.stringify(user));
      
      // Generate JWT token
      const token = await JWT.sign(
        { userId: user.email, name: user.name },
        env.JWT_SECRET || 'default-secret-change-in-production'
      );
      
      return jsonResponse({ 
        success: true, 
        user: { email: user.email, name: user.name, createdAt: user.createdAt },
        token 
      });
      
    } else if (body.action === 'login') {
      // Login
      if (!body.email || !body.password) {
        return jsonResponse({ error: 'Email and password are required' }, 400);
      }
      
      // Get user
      const userStr = await kv.get(body.email.toLowerCase());
      if (!userStr) {
        return jsonResponse({ error: 'Invalid email or password' }, 401);
      }
      
      const user: User = JSON.parse(userStr);
      
      // Verify password — support both SHA-256 (legacy/Worker-native) and PBKDF2 (frontend-stored)
      const passwordHash = await sha256(body.password);
      let passwordValid = false;
      
      if (user.passwordHash.startsWith('pbkdf2_')) {
        // Frontend-stored PBKDF2 hash — extract salt and re-verify
        const parts = user.passwordHash.split('_');
        if (parts.length === 3) {
          const b64Salt = parts[1];
          const b64StoredHash = parts[2];
          const padSalt = b64Salt + '='.repeat((4 - b64Salt.length % 4) % 4);
          const padHash = b64StoredHash + '='.repeat((4 - b64StoredHash.length % 4) % 4);
          const salt = Uint8Array.from(atob(padSalt), c => c.charCodeAt(0));
          const storedHashBytes = Uint8Array.from(atob(padHash), c => c.charCodeAt(0));
          
          const keyMaterial = await crypto.subtle.importKey(
            'raw', new TextEncoder().encode(body.password),
            { name: 'PBKDF2' }, false, ['deriveBits']
          );
          const derivedBits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
            keyMaterial, 256
          );
          const derivedHashBytes = new Uint8Array(derivedBits);
          
          if (derivedHashBytes.length === storedHashBytes.length) {
            let match = 0;
            for (let i = 0; i < derivedHashBytes.length; i++) {
              match |= derivedHashBytes[i] ^ storedHashBytes[i];
            }
            passwordValid = match === 0;
          }
        }
      } else {
        // SHA-256 hash (Worker-native or legacy)
        passwordValid = passwordHash === user.passwordHash;
      }
      
      if (!passwordValid) {
        return jsonResponse({ error: 'Invalid email or password' }, 401);
      }
      
      // Generate JWT token
      const token = await JWT.sign(
        { userId: user.email, name: user.name },
        env.JWT_SECRET || 'default-secret-change-in-production'
      );
      
      return jsonResponse({ 
        success: true, 
        user: { email: user.email, name: user.name, createdAt: user.createdAt },
        token 
      });
      
    } else if (body.action === 'verify') {
      // Verify token
      if (!body.token) {
        return jsonResponse({ error: 'Token required' }, 400);
      }
      
      // Verify JWT token
      const payload = await JWT.verify(
        body.token,
        env.JWT_SECRET || 'default-secret-change-in-production'
      );
      
      // Get user from KV
      const userStr = await kv.get(payload.userId);
      if (!userStr) {
        return jsonResponse({ error: 'User not found' }, 404);
      }
      
      const user: User = JSON.parse(userStr);
      return jsonResponse({ 
        success: true, 
        user: { email: user.email, name: user.name, createdAt: user.createdAt }
      });
    }
    
    return jsonResponse({ error: 'Invalid action' }, 400);
    
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: `Server error: ${message}` }, 500);
  }
}

function generateAuthToken(user: User): string {
  // Simple token generation (in production, use JWT)
  const payload = `${user.email}:${user.createdAt}`;
  return btoa(payload);
}

function decodeAuthToken(token: string): string | null {
  try {
    const decoded = atob(token);
    const parts = decoded.split(':');
    return parts[0] || null;
  } catch {
    return null;
  }
}

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

  if (action === 'diagnose') {
    systemPrompt = 'You are an Amazon compliance expert. You output ONLY valid JSON describing required certifications.';
    userMessage = prompt + '\n\n---PRODUCT DATA---\n' + (message || '');
    temperature = 0.3;
  } else if (action === 'ask') {
    // Follow-up questioning — keep it conversational
    systemPrompt = prompt || 'You are an Amazon compliance expert. Ask targeted follow-up questions to gather product information needed for compliance diagnosis.';
    userMessage = message || '';
    temperature = 0.5;
  } else if (action === 'appeal' || action === 'appeal-analyze') {
    systemPrompt = prompt || 'You are an Amazon appeal expert specializing in account reinstatement and Plan of Action writing.';
    userMessage = message || '';
    temperature = 0.7; // Higher creativity for appeals
  } else if (action === 'compliance_search') {
    systemPrompt = prompt || 'You are an Amazon product compliance researcher. Identify the product and its compliance requirements.';
    userMessage = message || '';
    temperature = 0.3;
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
    const timeoutId = setTimeout(() => timeoutController.abort(), 60000);

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
  const ip = getIP(request);

  // Rate limiting (IP-based, always active)
  if (!checkRateLimit(ip)) {
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

  // ─── JWT + Subscription Enforcement ─────────────────────────────
  let jwtPayload: { userId: string; name: string } | null = null;
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      jwtPayload = await JWT.verify(
        token,
        env.JWT_SECRET || 'default-secret-change-in-production'
      ) as { userId: string; name: string };
    } catch {
      // Invalid token — fall through to IP-based rate limit only
    }
  }

  // If JWT present, enforce subscription limits
  if (jwtPayload) {
    const allowed = await incrementSubscriptionUsage(jwtPayload.userId, env);
    if (!allowed) {
      return json_response(
        { error: 'API call limit reached. Please upgrade your plan.', plan: 'free' },
        429
      );
    }
  } else {
    // No JWT — use IP-based rate limit (already checked above)
  }

  // Auth check (password-based, legacy)
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
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Handle authentication API
    const url = new URL(request.url);
    // Support both /auth and /api/auth (frontend uses /api/auth)
    const authPath = url.pathname.replace(/^\/api\//, '/');
    if (authPath === '/auth' && request.method === 'POST') {
      return handleAuthAPI(request, env);
    }

    // ─── Subscription API ─────────────────────────────────────────
    if (authPath === '/subscription' && request.method === 'POST') {
      return handleSubscriptionAPI(request, env);
    }

    // Handle GET /v1/models for health check
    if (request.method === 'GET' && url.pathname === '/v1/models') {
      return json_response({ object: 'list', data: AVAILABLE_MODELS });
    }

    // Only allow POST for chat API
    if (request.method !== 'POST') {
      return json_response({ error: 'Method not allowed' }, 405);
    }

    return handleChat(request, env);
  },
};

// ─── Subscription Handler ───────────────────────────────────────────

async function handleSubscriptionAPI(request: Request, env: Env): Promise<Response> {
  const kv = (env as any).SUB_DB;
  if (!kv) {
    return jsonResponse({ error: 'Subscription service not available' }, 503);
  }

  // Verify JWT
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  const token = authHeader.slice(7);
  let jwtPayload: { userId: string; name: string };
  try {
    jwtPayload = await JWT.verify(
      token,
      env.JWT_SECRET || 'default-secret-change-in-production'
    ) as { userId: string; name: string };
  } catch {
    return jsonResponse({ error: 'Invalid token' }, 401);
  }

  const userId = jwtPayload.userId;
  const key = `sub:${userId}`;

  try {
    const body = await request.json() as { action?: string; plan?: string };
    const action = body.action || 'get';

    if (action === 'get') {
      // Get current subscription
      const raw = await kv.get(key);
      if (!raw) {
        return jsonResponse({ plan: 'free', apiCallsUsed: 0, apiCallsLimit: 10, reportsGenerated: 0, maxReports: 5 });
      }
      const usage = JSON.parse(raw);
      const tier = await getUserSubscription(userId, env);
      return jsonResponse({
        plan: tier.plan,
        apiCallsUsed: usage.calls || 0,
        apiCallsLimit: tier.apiCallsLimit,
        reportsGenerated: usage.reports || 0,
        maxReports: tier.maxReports,
      });

    } else if (action === 'upgrade') {
      // Upgrade plan (in production, this would verify payment)
      const plan = body.plan as 'basic' | 'pro';
      if (!plan || !TIER_CONFIG[plan]) {
        return jsonResponse({ error: 'Invalid plan' }, 400);
      }
      
      // Read existing usage
      const raw = await kv.get(key);
      let usage: { calls: number; reports: number };
      if (raw) {
        try { usage = JSON.parse(raw); } catch { usage = { calls: 0, reports: 0 }; }
      } else {
        usage = { calls: 0, reports: 0 };
      }
      
      // Save updated tier (we store the tier in the usage object)
      await kv.put(key, JSON.stringify({ ...usage, plan, upgradedAt: Date.now() }));
      
      const tier = TIER_CONFIG[plan];
      return jsonResponse({
        success: true,
        plan: tier.plan,
        apiCallsLimit: tier.apiCallsLimit,
        maxReports: tier.maxReports,
      });

    } else if (action === 'reset') {
      // Reset usage (admin only — in production, verify admin token)
      await kv.put(key, JSON.stringify({ calls: 0, reports: 0 }));
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: 'Invalid action' }, 400);

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: `Server error: ${message}` }, 500);
  }
}

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
