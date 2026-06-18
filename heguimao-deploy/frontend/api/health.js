// Vercel Serverless Function - Health check
// Used by uptime monitors to verify API availability

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check required environment variables exist
  const checks = {
    AGNES_API_KEY: !!process.env.AGNES_API_KEY,
    AUTH_PASSWORD: !!process.env.AUTH_PASSWORD,
    // SMTP is optional — only check if email functionality is expected
    SMTP_CONFIGURED: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
  };

  const allHealthy = Object.values(checks).every(Boolean);

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
    uptime: process.uptime?.() || 0,
  });
}
