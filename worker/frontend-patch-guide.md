/**
 * Vercel Frontend Patch Instructions
 * 
 * This file describes exactly what to change in mini-disco/src/lib/agent.ts
 * to route /api/chat requests to Cloudflare Workers instead.
 */

// ═══════════════════════════════════════════════════════════
// STEP 1: Add Worker URL to .env.local
// ═══════════════════════════════════════════════════════════
// 
// Add this line to mini-disco/.env.local:
// VITE_WORKER_API_URL=https://mini-disco-api.your-subdomain.workers.dev/api/chat
//
// Replace "your-subdomain" with your actual Cloudflare subdomain.
// For production, use a custom domain (recommended):
// VITE_WORKER_API_URL=https://api.compliancecat.app/api/chat

// ═══════════════════════════════════════════════════════════
// STEP 2: Modify src/lib/agent.ts
// ═══════════════════════════════════════════════════════════
//
// Find the callAI function (around line ~150 in agent.ts).
// Replace the production branch:
//
// OLD CODE (around line 170):
// ```
//   } else {
//     // Production: go through Vercel Serverless Function
//     const response = await fetch("/api/chat", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ action: endpoint, ...params }),
//     });
// ```
//
// NEW CODE:
// ```
//   } else {
//     // Production: go through Cloudflare Worker
//     const WORKER_URL = import.meta.env.VITE_WORKER_API_URL || '/api/chat';
//     const response = await fetch(WORKER_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ action: endpoint, ...params }),
//     });
// ```

// ═══════════════════════════════════════════════════════════
// STEP 3: Update vercel.json CORS headers
// ═══════════════════════════════════════════════════════════
//
// In mini-disco/vercel.json, change the /api/ headers:
//
// OLD:
// ```
// {
//   "source": "/api/(.*)",
//   "headers": [
//     { "key": "Access-Control-Allow-Origin", "value": "https://mini-disco.vercel.app" },
//     { "key": "Access-Control-Allow-Methods", "value": "POST, OPTIONS" },
//     { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
//   ]
// }
// ```
//
// NEW (allow all origins since Worker is on different domain):
// ```
// {
//   "source": "/api/(.*)",
//   "headers": [
//     { "key": "Access-Control-Allow-Origin", "value": "*" },
//     { "key": "Access-Control-Allow-Methods", "value": "POST, OPTIONS" },
//     { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
//   ]
// }
// ```

// ═══════════════════════════════════════════════════════════
// STEP 4: Test locally
// ═══════════════════════════════════════════════════════════
//
// 1. Set VITE_WORKER_API_URL in .env.local
// 2. Run `npm run dev`
// 3. Test chat functionality — it should call Worker URL instead of /api/chat
// 4. If Worker isn't deployed yet, you can test with a mock:
//    VITE_WORKER_API_URL=http://localhost:8787/api/chat
//    (assuming `wrangler dev` is running in parallel)

// ═══════════════════════════════════════════════════════════
// STEP 5: Deploy
// ═══════════════════════════════════════════════════════════
//
// 1. Push changes to git
// 2. Vercel auto-deploys
// 3. Verify: curl https://mini-disco.vercel.app/api/health
//    Should return healthy status
