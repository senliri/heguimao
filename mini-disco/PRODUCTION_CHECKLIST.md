# Mini-Disco Production Deployment Checklist

**Last Updated:** 2026-06-15
**Status:** ✅ Ready for Vercel Deployment

## Pre-Deploy

- [ ] `VITE_DEMO_ENABLED=false` in Vercel environment variables
- [ ] `VITE_AGNES_BASE_URL` configured in Vercel
- [ ] `VITE_AGNES_MODEL` set to `agnes-2.0-flash` (or desired model)
- [ ] SMTP credentials (BREVO API key) configured in Vercel
- [ ] `DEMO_USER_PASSWORD` set via env var (not hardcoded)
- [ ] `VITE_DEMO_EMAIL` configured if demo mode needed
- [ ] `VITE_DEMO_NAME` configured if demo mode needed

## Vercel Configuration

- [ ] Project connected to GitHub repo
- [ ] Framework preset: Vite (auto-detected)
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`
- [ ] Development Command: `npm run dev`
- [ ] SPA Fallback: `* 200!` (handled by vercel.json)

## Environment Variables (Vercel)

```
VITE_DEMO_ENABLED=false
VITE_AGNES_BASE_URL=https://apihub.agnes-ai.com/v1/chat/completions
VITE_AGNES_MODEL=agnes-2.0-flash
SMTP_HOST=smtp.brevo.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASSWORD=your_api_key
BREVO_API_KEY=your_api_key
```

## Post-Deploy Verification

- [ ] Homepage loads correctly
- [ ] Product diagnosis works (AI mode)
- [ ] Static diagnosis works (non-AI mode)
- [ ] Report PDF export works
- [ ] Email sending works
- [ ] Authentication (register/login/logout) works
- [ ] **Unauthenticated users redirected to /auth when accessing /portfolio**
- [ ] **Unauthenticated users redirected to /auth when accessing /dashboard**
- [ ] Portfolio management works
- [ ] Appeal tool works
- [ ] Dashboard loads
- [ ] Mobile responsive on iOS Safari
- [ ] Mobile responsive on Android Chrome
- [ ] Console has no errors
- [ ] No 404s in network tab
- [ ] CSP headers present
- [ ] HTTPS enforced

## Monitoring Setup

- [ ] Sentry error tracking configured
- [ ] Vercel Analytics enabled
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate verified
- [ ] robots.txt present
- [ ] sitemap.xml present

## Known Issues (Non-Blocking)

- [ ] Auth migration to server-side planned (P1 post-launch)
- [ ] Rate limiting upgrade to KV store planned (P1 post-launch)
- [ ] Accessibility audit planned (P1 post-launch)
- [ ] Unit tests planned (P3 post-launch)

## Changes in This Version (2026-06-15)

- ✅ **Route guards added** — `/portfolio` and `/dashboard` now require login
- ✅ **Lazy-loaded routes** — Report (40KB), Portfolio (16KB), Dashboard (13KB) split into separate chunks
- ✅ **site.ts chunked** — 50KB compliance data in its own `siteData` chunk
- ✅ **Auth redirect optimized** — reduced from 800ms to 500ms delay
- ✅ **All routes have Suspense fallbacks** — loading spinner during chunk download
