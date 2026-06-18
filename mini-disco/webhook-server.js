#!/usr/bin/env node
/**
 * Vercel Webhook Receiver
 * 
 * Receives deployment events from Vercel and forwards to OpenClaw notification.
 * 
 * Setup:
 * 1. Run: node webhook-server.js
 * 2. Copy the public URL (ngrok/localtunnel/etc)
 * 3. In Vercel Dashboard: Settings > Webhooks > Add Endpoint
 * 4. Paste URL and select events: Deployment Created, Deployment Error, Deployment Ready
 */

const http = require('http');
const crypto = require('crypto');

const PORT = process.env.WEBHOOK_PORT || 3000;
const SECRET = process.env.WEBHOOK_SECRET || 'vercel-webhook-secret';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.PROJECT_ID || 'dep_KyZ9GJQmWnfrvjvQhBbNpCkxvLbT';

function log(msg, level = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
  };
  const color = colors[level] || colors.info;
  console.log(`${color}[${new Date().toISOString().replace('T', ' ').substring(0, 19)}]${colors.reset} ${msg}`);
}

function verifySignature(payload, signature, secret) {
  if (!signature) return false;
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  
  // Compare using constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature.replace('sha256=', '')),
    Buffer.from(digest)
  );
}

async function notify(message, severity = 'info') {
  const emojis = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };
  
  const notification = `${emojis[severity] || '📋'} **${message.title}**\n\n${message.body}`;
  
  // Save to log file
  try {
    const fs = require('fs');
    const path = require('path');
    const logDir = path.join(
      process.env.HOME || process.env.USERPROFILE || '.',
      '.qclaw',
      'workspace-ua58rsb93veqtxl7',
      'monitor-logs'
    );
    fs.mkdirSync(logDir, { recursive: true });
    
    const logFile = path.join(logDir, 'webhook-events.log');
    const logEntry = `[${new Date().toISOString()}] [${severity}] ${JSON.stringify(message)}\n`;
    fs.appendFileSync(logFile, logEntry);
    
    log(`Notification saved: ${message.title}`);
  } catch (e) {
    log(`Failed to save notification: ${e.message}`, 'warning');
  }
  
  // In a real setup, you'd forward this to OpenClaw via API
  // For now, it's logged locally and can be picked up by cron
  console.log(notification);
}

const server = http.createServer(async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end('Method not allowed');
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', async () => {
    try {
      // Verify signature
      const signature = req.headers['x-vercel-signature'] || req.headers['x-hub-signature-256'];
      if (signature && !verifySignature(body, signature, SECRET)) {
        log('Invalid signature!', 'error');
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }

      const event = JSON.parse(body);
      const eventType = event.type || event.event;
      
      log(`Received event: ${eventType}`, 'info');

      // Handle different event types
      switch (eventType) {
        case 'deployment.created':
        case 'DEPLOYMENT.CREATED':
          log(`New deployment: ${event.payload?.uid?.substring(0, 8) || 'unknown'}`, 'info');
          await notify({
            title: '🔨 部署开始',
            body: `部署 ID: ${event.payload?.uid?.substring(0, 8) || 'unknown'}\n作者: ${event.payload?.author?.username || 'unknown'}\n分支: ${event.payload?.source?.branch || 'unknown'}`,
            severity: 'info',
          });
          break;

        case 'deployment.ready':
        case 'DEPLOYMENT.READY':
          log(`Deployment ready: ${event.payload?.uid?.substring(0, 8) || 'unknown'}`, 'success');
          await notify({
            title: '✅ 部署成功',
            body: `部署 ID: ${event.payload?.uid?.substring(0, 8) || 'unknown'}\nURL: ${event.payload?.url || 'https://' + '${DOMAIN}' || 'mini-disco.vercel.app'}\n构建时间: ${event.payload?.meta?.build?.duration || 'unknown'}s`,
            severity: 'success',
          });
          break;

        case 'deployment.error':
        case 'DEPLOYMENT.ERROR':
          log(`Deployment error: ${event.payload?.uid?.substring(0, 8) || 'unknown'}`, 'error');
          await notify({
            title: '❌ 部署失败',
            body: `部署 ID: ${event.payload?.uid?.substring(0, 8) || 'unknown'}\n错误: ${event.payload?.error?.message || 'Unknown error'}\n请检查 Vercel Dashboard 查看详情`,
            severity: 'error',
          });
          break;

        case 'alias.assigned':
        case 'ALIAS.ASSIGNED':
          log(`Alias assigned: ${event.payload?.domain || 'unknown'}`, 'info');
          break;

        case 'alias.removed':
        case 'ALIAS.REMOVED':
          log(`Alias removed: ${event.payload?.domain || 'unknown'}`, 'warning');
          break;

        default:
          log(`Unhandled event type: ${eventType}`, 'warning');
      }

      // Always respond 200 to acknowledge receipt
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok' }));

    } catch (e) {
      log(`Error processing webhook: ${e.message}`, 'error');
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
  });
});

server.listen(PORT, () => {
  log(`Webhook server listening on port ${PORT}`, 'success');
  log(`Secret: ${SECRET}`, 'info');
  log(`Expected events: DEPLOYMENT.CREATED, DEPLOYMENT.READY, DEPLOYMENT.ERROR`, 'info');
  log('\nTo test: curl -X POST http://localhost:' + PORT + ' -H "Content-Type: application/json" -d \'{"type":"DEPLOYMENT.CREATED","payload":{"uid":"test123","author":{"username":"test"},"source":{"branch":"main"}}}\'');
});
