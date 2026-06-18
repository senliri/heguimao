// Vercel Serverless Function - AI proxy with auth + rate limiting
// Replaces Netlify Functions → Vercel Serverless Function (/api/chat)

import crypto from 'node:crypto';
import { log } from '@vercel/functions';

const AGNES_API_KEY = process.env.AGNES_API_KEY || '';
const AGNES_BASE_URL = process.env.AGNES_API_URL || 'https://apihub.agnes-ai.com/v1/chat/completions';
const AGNES_MODEL = process.env.AGNES_MODEL || 'agnes-2.0-flash';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || '';
const AUTH_PASSWORD_HASH = AUTH_PASSWORD ? crypto.createHash('sha256').update(AUTH_PASSWORD).digest('hex') : null;

// Rate limiting (in-memory, per IP, auto-cleanup every 5min)
// NOTE: Vercel free plan = single instance, so in-memory works. For Pro plan,
// consider upgrading to Vercel KV or Upstash Redis for cross-instance rate limiting.
const rateLimitMap = new Map();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60000; // 1 minute

// Cleanup stale entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 300000);

function rateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function secureCompare(a, b) {
  if (!a || !b) return false;
  const hashA = crypto.createHash('sha256').update(a).digest('hex');
  const hashB = crypto.createHash('sha256').update(b).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hashA), Buffer.from(hashB));
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Get client IP
  const ip = req.headers['x-forwarded-for'] || 'unknown';

  // Rate limiting
  if (!rateLimit(ip)) {
    log.warn('Rate limit exceeded', { ip });
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }));
    return;
  }

  // Parse request body
  let body;
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyStr = Buffer.concat(chunks).toString();
    body = JSON.parse(bodyStr);
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid request body' }));
    return;
  }

  // Auth gate (only for non-diagnosis/non-appeal actions)
  if (AUTH_PASSWORD_HASH && body.action !== 'diagnose' && body.action !== 'appeal') {
    const provided = body.authPassword || '';
    const providedHash = crypto.createHash('sha256').update(provided).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(AUTH_PASSWORD_HASH))) {
      log.warn('Auth failed', { ip, action: body.action });
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Authentication required' }));
      return;
    }
  }

  // Build messages array
  const { action, prompt, message, ...rest } = body;
  
  let messages;
  
  if (action === 'diagnose' || action === 'ask') {
    messages = [
      { role: 'system', content: prompt || 'You are a compliance expert.' },
      { role: 'user', content: message || '' },
    ];
  } else if (action === 'appeal' || action === 'appeal-analyze') {
    messages = [
      { role: 'system', content: prompt || 'You are an Amazon appeal expert.' },
      { role: 'user', content: message || '' },
    ];
  } else {
    messages = rest.messages || [
      { role: 'user', content: prompt || message || '' },
    ];
  }

  // Validate API key before making request
  if (!AGNES_API_KEY || AGNES_API_KEY === '') {
    log.error('AGNES_API_KEY not configured in Vercel environment variables');
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      error: 'AI service not configured. Please set AGNES_API_KEY in Vercel dashboard.', 
      details: 'Environment variable AGNES_API_KEY is missing' 
    }));
    return;
  }

  try {
    const response = await fetch(AGNES_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AGNES_API_KEY}`,
      },
      body: JSON.stringify({
        model: AGNES_MODEL,
        messages,
        // Higher temperature for appeal (needs creativity), lower for compliance (needs accuracy)
        temperature: (action === 'appeal' || action === 'appeal-analyze') ? 0.7 : 0.3,
        ...rest,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error('AI API error', { status: response.status, action, ip });
      res.statusCode = response.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        error: `AI service error: ${response.status}`, 
        details: errorText 
      }));
      return;
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';
    
    // Detect invalid API key responses (fallback messages from Agnes)
    const suspiciousPatterns = [
      'this page is only available',
      'invalid api key',
      'authentication failed',
      'please configure',
    ];
    const replyLower = (reply || '').toLowerCase();
    const isSuspicious = suspiciousPatterns.some(p => replyLower.includes(p));
    
    if (isSuspicious || !reply || reply.length < 10) {
      log.error('AI returned suspicious/empty response', { action, reply: reply?.substring(0, 200), ip });
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        error: 'AI service error: invalid configuration',
        details: isSuspicious ? 'Received unexpected response from AI service' : 'Empty response'
      }));
      return;
    }
    
    log.info('AI request completed', { action, ip, hasReply: true });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ reply }));
  } catch (err) {
    log.error('AI request failed', { error: err.message, action, ip });
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'AI service unavailable' }));
  }
}