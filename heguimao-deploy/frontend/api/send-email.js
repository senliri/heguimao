// Vercel Serverless Function - Email sending via SMTP
// Uses nodemailer with 126.com SMTP
// All credentials from environment variables

import { createTransport } from 'nodemailer';
import { log } from '@vercel/functions';

const RATE_LIMITS = new Map();
const EMAIL_RATE_LIMIT = 5; // requests per minute per IP
const EMAIL_RATE_WINDOW = 60000; // 1 minute

// Cleanup stale entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of RATE_LIMITS) {
    if (now > entry.resetAt) RATE_LIMITS.delete(ip);
  }
}, 300000);

export default async function handler(req, res) {
  // CORS - only allow production domain
  res.setHeader('Access-Control-Allow-Origin', process.env.VERCEL_URL || 'https://mini-disco.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
  }

  // Rate limit: 5 emails per minute per IP
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  
  let rateEntry = RATE_LIMITS.get(ip);
  if (rateEntry && now < rateEntry.resetAt && rateEntry.count >= EMAIL_RATE_LIMIT) {
    log.warn('Email rate limit exceeded', { ip });
    return res.status(429).json({ error: 'Too many email requests. Try again later.' });
  }
  if (!rateEntry || now > rateEntry.resetAt) {
    RATE_LIMITS.set(ip, { count: 1, resetAt: now + EMAIL_RATE_WINDOW });
    rateEntry = { count: 1, resetAt: now + EMAIL_RATE_WINDOW };
    RATE_LIMITS.set(ip, rateEntry);
  } else {
    rateEntry.count++;
  }

  // Create SMTP transporter
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@compliance.cat';
  const transporter = createTransport({
    host: process.env.SMTP_HOST || 'smtp.126.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || 'senlin2027@126.com',
      pass: process.env.SMTP_PASS || '',
    },
  });

  // Validate SMTP config
  if (!process.env.SMTP_PASS) {
    log.error('SMTP_PASS not configured in Vercel environment variables');
    return res.status(503).json({ 
      error: 'Email service not configured. Please set SMTP_PASS in Vercel dashboard.', 
      code: 'SMTP_NOT_CONFIGURED' 
    });
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });

    log.info('Email sent', { to, messageId: info.messageId });
    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    log.error('Email send failed', { to, error: error.message, code: error.code });
    res.status(500).json({ 
      error: 'Failed to send email', 
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
}
