# 合规猫（heguimao）部署指南

## 目录结构

```
heguimao-deploy/
├── frontend/          # 前端 React 应用 (Cloudflare Pages)
│   ├── src/           # 源代码
│   ├── vite.config.ts # Vite 配置（已适配 CF Pages）
│   ├── wrangler.json  # CF Pages 配置
│   ├── package.json   # 依赖（已移除 Vercel 相关）
│   └── .env.example   # 环境变量模板
├── worker/            # Cloudflare Workers 后端 (AI API Proxy)
│   ├── src/index.ts   # Worker 主代码
│   ├── wrangler.toml  # Workers 配置
│   └── package.json   # 依赖
└── DEPLOY-GUIDE.md    # 本文档
```

## 架构变化

```
之前:  Vercel Frontend → Vercel Serverless Function → Agnes API
现在:  CF Pages Frontend → CF Workers → Agnes API
```

## 部署步骤

### 1. 部署 Worker（后端）

```bash
cd worker
npm install
npx wrangler deploy --name heguimao-api
```

在 Cloudflare Dashboard → Workers → heguimao-api → Variables and Secrets 设置:
- `AGNES_API_KEY`: 你的 Agnes API Key
- `AUTH_PASSWORD`: (留空或设置)
- `AGNES_API_URL`: https://apihub.agnes-ai.com/v1/chat/completions
- `AGNES_MODEL`: agnes-2.0-flash

### 2. 部署前端

```bash
cd frontend
npm install
npm run build
npx wrangler pages deploy dist --project-name=heguimao
```

### 3. 配置前端环境变量

在 Cloudflare Dashboard → Pages → heguimao → Settings → Environment Variables:
- `VITE_WORKER_URL`: https://heguimao-api.senliri028.workers.dev
- `VITE_AGNES_MODEL`: agnes-2.0-flash

## 改造内容清单

| 文件 | 改动 |
|------|------|
| `vite.config.ts` | 移除 Vercel proxy，保留 /v1 和 /api/chat 代理 |
| `package.json` | 移除 @vercel/functions, @vercel/node, sst, serve |
| `vercel.json` | 已替换为 wrangler.json |
| `src/lib/agent.ts` | Worker URL 改为环境变量 |
| `.env.example` | 更新环境变量模板 |

## 注意事项

1. **不再需要后端 Node.js Functions** — 所有 API 逻辑在 Cloudflare Workers 中
2. **认证功能** — Worker 的 AUTH_PASSWORD 功能已启用（当前未配置密码）
3. **邮件功能** — nodemailer 依赖保留在 node_modules 但不会运行（CF Pages 是静态站点）。如果需要使用邮件功能，需要在 Worker 中实现
4. **速率限制** — Worker 自带 10次/分钟/IP 的速率限制
