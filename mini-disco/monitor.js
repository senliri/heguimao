#!/usr/bin/env node
/**
 * Vercel Deployment Monitor
 * 
 * Monitors:
 * 1. Vercel deployment status (via Vercel API)
 * 2. Online health check (mini-disco.vercel.app)
 * 3. GitHub Actions status (if linked repo)
 * 
 * Usage: node monitor.js [--once]
 *   --once: run once and exit (for cron)
 *   default: continuous watch mode
 */

const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || '';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = 'dep_KyZ9GJQmWnfrvjvQhBbNpCkxvLbT'; // mini-disco project
const DOMAIN = 'mini-disco.vercel.app';
const GITHUB_REPO = 'senliri/mini-disco'; // adjust if needed
const NOTIFY_WEBHOOK = process.env.NOTIFY_WEBHOOK; // optional: OpenClaw webhook

// ── Color helpers ──
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function color(text, colorKey) {
  return COLORS[colorKey] + text + COLORS.reset;
}

function timestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// ── Vercel API ──
async function fetchVercel(path, options = {}) {
  const url = `https://api.vercel.com${path}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;
  
  const headers = {
    'Authorization': `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  const resp = await fetch(url, config);
  const data = await resp.json();
  return { status: resp.status, data };
}

async function getLatestDeployment() {
  try {
    const { data } = await fetchVercel(`/v6/deployments?projectId=${PROJECT_ID}&limit=1`);
    return data.deployments?.[0] || null;
  } catch (e) {
    console.error(color('[ERROR] Failed to fetch deployments:', 'red'), e.message);
    return null;
  }
}

async function getProjectInfo() {
  try {
    const { data } = await fetchVercel(`/v2/projects/${PROJECT_ID}`);
    return data;
  } catch (e) {
    console.error(color('[ERROR] Failed to fetch project info:', 'red'), e.message);
    return null;
  }
}

// ── Health Check ──
async function checkHealth() {
  const checks = [
    { name: 'Homepage', url: `https://${DOMAIN}` },
    { name: 'API Health', url: `https://${DOMAIN}/api/health` },
    { name: 'API Chat', url: `https://${DOMAIN}/api/chat` },
    { name: 'API Feedback', url: `https://${DOMAIN}/api/feedback` },
    { name: 'API Send Email', url: `https://${DOMAIN}/api/send-email` },
  ];

  const results = [];
  
  for (const check of checks) {
    try {
      const start = Date.now();
      const resp = await fetch(check.url, { 
        signal: AbortSignal.timeout(10000),
        method: 'HEAD',
      });
      const duration = Date.now() - start;
      
      results.push({
        ...check,
        status: resp.status,
        ok: resp.ok,
        duration,
        error: null,
      });
    } catch (e) {
      results.push({
        ...check,
        status: 0,
        ok: false,
        duration: 0,
        error: e.message,
      });
    }
  }

  return results;
}

// ── GitHub Status ──
async function checkGitHub() {
  if (!GITHUB_REPO || !process.env.GITHUB_TOKEN) {
    return { skipped: true, reason: 'No GitHub token configured' };
  }

  try {
    // Get latest workflow runs
    const { data } = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=3`, {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }).then(r => r.json());

    if (!data?.length) {
      return { runs: [], latest: null };
    }

    const latest = data[0];
    return {
      runs: data.map(run => ({
        id: run.id,
        status: run.status,
        conclusion: run.conclusion,
        branch: run.head_branch,
        actor: run.actor?.login,
        created: run.created_at,
      })),
      latest: {
        id: latest.id,
        status: latest.status,
        conclusion: latest.conclusion,
        branch: latest.head_branch,
        actor: latest.actor?.login,
        created: latest.created_at,
        url: latest.html_url,
      },
    };
  } catch (e) {
    return { error: e.message };
  }
}

// ── Notification ──
async function sendNotification(title, body, severity = 'info') {
  const emojis = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  const message = `${emojis[severity] || '📋'} **${title}**\n\n${body}`;
  
  if (NOTIFY_WEBHOOK) {
    try {
      await fetch(NOTIFY_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
    } catch (e) {
      console.error('Notification send failed:', e.message);
    }
  }

  // Log to file for persistence
  const logEntry = `[${timestamp()}] [${severity.toUpperCase()}] ${title}: ${body}\n`;
  try {
    const fs = await import('fs');
    const path = await import('path');
    const logDir = path.default.join(process.env.HOME || process.env.USERPROFILE || '.', '.qclaw', 'workspace-ua58rsb93veqtxl7', 'monitor-logs');
    fs.default.mkdirSync(logDir, { recursive: true });
    fs.default.appendFileSync(path.default.join(logDir, 'monitor.log'), logEntry);
  } catch (e) {
    // Silently ignore logging errors
  }

  console.log(message);
}

// ── Main Monitor ──
async function runCheck() {
  console.log(color('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan'));
  console.log(color(`  Mini-Disco Monitor Check - ${timestamp()}`, 'cyan'));
  console.log(color('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan'));

  const results = {
    vercel: null,
    health: null,
    github: null,
    issues: [],
  };

  // 1. Vercel deployment status
  console.log(color('🔵 Checking Vercel deployment...', 'blue'));
  const deployment = await getLatestDeployment();
  results.vercel = deployment;

  if (deployment) {
    const statusEmoji = {
      BUILDING: '🔨',
      ERROR: '❌',
      CANCELLED: '⏹️',
      QUEUED: '⏳',
      READY: '✅',
    };
    const emoji = statusEmoji[deployment.status] || '❓';
    
    console.log(`  ${emoji} Status: ${deployment.status}`);
    console.log(`  📦 ID: ${deployment.uid.substring(0, 8)}`);
    console.log(`  🕐 Created: ${new Date(deployment.created).toLocaleString('zh-CN')}`);
    console.log(`  🔗 URL: ${deployment.url}`);
    console.log(`  👤 Author: ${deployment.author?.username || 'unknown'}`);

    if (deployment.status === 'ERROR') {
      results.issues.push({
        type: 'critical',
        message: `Vercel 部署失败！部署 ID: ${deployment.uid.substring(0, 8)}`,
        detail: `错误信息: ${deployment.error?.message || 'Unknown error'}`,
      });
    } else if (deployment.status === 'BUILDING') {
      results.issues.push({
        type: 'info',
        message: 'Vercel 部署正在进行中...',
        detail: `预计完成时间: 2-5 分钟`,
      });
    }
  } else {
    results.issues.push({
      type: 'warning',
      message: '无法获取 Vercel 部署信息',
      detail: '请检查 VERCEL_TOKEN 和 PROJECT_ID 配置',
    });
  }

  // 2. Health check
  console.log(color('\n🟢 Running health checks...', 'green'));
  const healthResults = await checkHealth();
  results.health = healthResults;

  let healthyCount = 0;
  for (const check of healthResults) {
    const status = check.ok ? color('✓', 'green') : color('✗', 'red');
    const duration = check.duration > 0 ? `${check.duration}ms` : 'N/A';
    console.log(`  ${status} ${check.name.padEnd(20)} ${duration.padEnd(8)} HTTP ${check.status}`);
    if (check.ok) healthyCount++;
    
    if (!check.ok) {
      results.issues.push({
        type: 'critical',
        message: `${check.name} 健康检查失败`,
        detail: check.error || `HTTP ${check.status}`,
      });
    }
  }

  console.log(`\n  健康: ${healthyCount}/${healthResults.length} 通过`);

  // 3. GitHub status
  console.log(color('\n🐙 Checking GitHub Actions...', 'cyan'));
  const githubStatus = await checkGitHub();
  results.github = githubStatus;

  if (githubStatus.skipped) {
    console.log(`  ⏭️  Skipped: ${githubStatus.reason}`);
  } else if (githubStatus.latest) {
    const statusMap = {
      success: '✅',
      failure: '❌',
      cancelled: '⏹️',
      neutral: '⚪',
      timed_out: '⏰',
      action_required: '⚠️',
      queued: '⏳',
      in_progress: '🔨',
    };
    const emoji = statusMap[githubStatus.latest.conclusion] || '?';
    console.log(`  ${emoji} Latest: ${githubStatus.latest.conclusion}`);
    console.log(`  📋 Branch: ${githubStatus.latest.branch}`);
    console.log(`  👤 Actor: ${githubStatus.latest.actor}`);
    console.log(`  🕐 Time: ${new Date(githubStatus.latest.created).toLocaleString('zh-CN')}`);

    if (githubStatus.latest.conclusion === 'failure') {
      results.issues.push({
        type: 'critical',
        message: 'GitHub Actions 构建失败',
        detail: `分支: ${githubStatus.latest.branch}\n详情: ${githubStatus.latest.url}`,
      });
    }
  } else if (githubStatus.error) {
    console.log(`  ❌ Error: ${githubStatus.error}`);
  }

  // Summary
  console.log(color('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan'));
  
  if (results.issues.length === 0) {
    console.log(color('  ✅ All checks passed!', 'green'));
    await sendNotification(
      'Mini-Disco 监控正常',
      `Vercel 部署: ${deployment?.status || 'Unknown'}\n健康检查: ${healthyCount}/${healthResults.length}\nGitHub: ${githubStatus.latest?.conclusion || 'Skipped'}`,
      'success'
    );
  } else {
    const criticalIssues = results.issues.filter(i => i.type === 'critical');
    const warnings = results.issues.filter(i => i.type === 'warning');
    
    if (criticalIssues.length > 0) {
      console.log(color(`  ❌ ${criticalIssues.length} CRITICAL ISSUES DETECTED!`, 'red'));
      for (const issue of criticalIssues) {
        console.log(color(`    → ${issue.message}`, 'red'));
        console.log(color(`      ${issue.detail}`, 'yellow'));
        
        await sendNotification(
          `🚨 ${issue.message}`,
          issue.detail,
          'error'
        );
      }
    }
    
    if (warnings.length > 0) {
      console.log(color(`  ⚠️  ${warnings.length} warnings`, 'yellow'));
      for (const warn of warnings) {
        console.log(color(`    → ${warn.message}`, 'yellow'));
      }
    }
  }

  console.log(color('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan'));

  // Save results to file
  try {
    const fs = await import('fs');
    const path = await import('path');
    const logDir = path.default.join(process.env.HOME || process.env.USERPROFILE || '.', '.qclaw', 'workspace-ua58rsb93veqtxl7', 'monitor-logs');
    fs.default.mkdirSync(logDir, { recursive: true });
    
    const resultFile = path.default.join(logDir, `check-${Date.now()}.json`);
    fs.default.writeFileSync(resultFile, JSON.stringify(results, null, 2));
    console.log(`  Results saved to: ${resultFile}`);
  } catch (e) {
    // Ignore file write errors
  }

  return results;
}

// ── Watch Mode ──
async function watchMode(interval = 1800000) { // 30 minutes default
  console.log(color('Starting monitor in watch mode...', 'cyan'));
  console.log(color(`Check interval: ${interval / 60000} minutes`, 'cyan'));
  console.log(color('Press Ctrl+C to stop\n', 'cyan'));

  // Run immediately on start
  await runCheck();

  // Then periodic
  setInterval(async () => {
    try {
      await runCheck();
    } catch (e) {
      console.error(color(`\n[WATCH ERROR] ${e.message}`, 'red'));
    }
  }, interval);
}

// ── Entry Point ──
const args = process.argv.slice(2);
const once = args.includes('--once');

if (once) {
  runCheck().catch(e => {
    console.error(color('Monitor failed:', 'red'), e);
    process.exit(1);
  });
} else {
  watchMode();
}
