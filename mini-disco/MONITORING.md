# Mini-Disco 监控方案

## 三合一监控体系

### 1. Vercel Webhook（实时通知）

**作用：** 部署事件实时推送，零延迟

**配置步骤：**

1. 运行 webhook 服务器（可选）：
```bash
cd mini-disco
node webhook-server.js
```

2. 获取公网 URL（用 ngrok/localtunnel 暴露本地端口）：
```bash
npx localtunnel -p 3000
# 输出: your url is: https://abc123.loca.lt
```

3. 在 Vercel Dashboard 配置 Webhook：
   - 打开 https://vercel.com/senliris-projects/mini-disco/settings/webhooks
   - 点击 "Add Endpoint"
   - URL: `https://abc123.loca.lt/`（你的公网地址）
   - Events 选择：
     - `DEPLOYMENT.CREATED`
     - `DEPLOYMENT.READY`
     - `DEPLOYMENT.ERROR`
   - Secret: 任意密码（默认 `vercel-webhook-secret`）

4. **更简单的方式：** 直接用 Vercel 内置通知
   - Settings > Notifications > Telegram/Discord/Slack
   - 绑定你的聊天工具，自动推送部署状态

---

### 2. 定时巡检（兜底告警）

**作用：** 每 30 分钟检查线上状态，Webhook 失效时兜底

**使用 OpenClaw Cron 设置：**

```json
{
  "name": "Mini-Disco 巡检",
  "schedule": {
    "kind": "cron",
    "expr": "0 */30 * * *",
    "tz": "Asia/Shanghai"
  },
  "payload": {
    "kind": "agentTurn",
    "message": "运行 mini-disco 监控检查：\n1. 用 web_fetch 访问 https://mini-disco.vercel.app 检查首页是否正常\n2. 访问 https://mini-disco.vercel.app/api/health 检查 API 健康\n3. 访问 https://vercel.com/senliris-projects/mini-disco/deployments 获取最新部署状态\n4. 如有异常，向我报告",
    "model": "custom-1781344887385/agnes-2.0-flash"
  },
  "delivery": {
    "mode": "announce"
  }
}
```

**或者用 monitor.js（需要 VERCEL_TOKEN）：**
```bash
# 一次性检查
node monitor.js --once

# 持续监控（每 30 分钟）
node monitor.js
```

需要设置环境变量：
- `VERCEL_TOKEN`: Vercel API Token（https://vercel.com/account/tokens）
- `GITHUB_TOKEN`: GitHub Token（可选，用于检查 Actions 状态）

---

### 3. GitHub Actions 状态检测

**作用：** 监控 CI/CD 流水线状态

**GitHub Actions 工作流示例**（添加到 `.github/workflows/deploy.yml`）：

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_AGNES_BASE_URL: ${{ secrets.VITE_AGNES_BASE_URL }}
          VITE_AGNES_API_KEY: ${{ secrets.VITE_AGNES_API_KEY }}
          AUTH_PASSWORD: ${{ secrets.AUTH_PASSWORD }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          vercel-args: '--prod'
          working-directory: ./mini-disco
```

**监控 GitHub 状态：**
- `monitor.js` 已内置 GitHub Actions 检查
- 或者在 Vercel Dashboard 绑定 GitHub 仓库，自动显示 CI 状态

---

## 快速开始（推荐方案）

### 最简配置（5 分钟搞定）

1. **Vercel 内置通知：**
   - Settings > Notifications > 选择 Telegram/Discord/Slack
   - 绑定后自动推送部署成功/失败通知

2. **OpenClaw 定时巡检：**
   - 运行以下命令创建 cron job（我帮你设置）

3. **GitHub 绑定 Vercel：**
   - Vercel Dashboard > Settings > Git > 确认 GitHub 绑定
   - 推送代码时自动触发部署 + 显示 CI 状态

要我帮你创建 OpenClaw cron 巡检任务吗？
