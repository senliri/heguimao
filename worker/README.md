# Mini-Disco Cloudflare Worker

AI Chat API proxy for Mini-Disco, deployed on Cloudflare Workers.

## Quick Start

```bash
# Install dependencies
npm install

# Local dev
npm run dev

# Deploy
npm run deploy
```

## Environment Variables

Set these via `npx wrangler secret`:

```bash
npx wrangler secret put AGNES_API_KEY
npx wrangler secret put AUTH_PASSWORD
npx wrangler secret put AGNES_API_URL  # optional, defaults to https://apihub.agnes-ai.com/v1/chat/completions
npx wrangler secret put AGNES_MODEL    # optional, defaults to agnes-2.0-flash
```

## Architecture

This Worker replaces Vercel's `/api/chat` Serverless Function. It:
- Authenticates requests (optional password gate)
- Rate limits per IP (10 req/min)
- Routes to Agnes LLM API
- Detects suspicious/empty responses
- Returns structured JSON responses

## CORS

Configured to accept cross-origin requests from Vercel-hosted frontend.
