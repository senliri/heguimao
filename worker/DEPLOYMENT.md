# Mini-Disco Worker 部署文档

## 架构

```
前端 (Vercel)          后端 (Cloudflare Workers)
┌─────────────┐       ┌──────────────────────┐
│ mini-disco. │       │ mini-disco-api.       │
│ vercel.app  │──────▶│ senliri028.workers.dev│
│  (静态站点)  │       │  (AI API Proxy)       │
└─────────────┘       └──────────────────────┘
                          │
                          ▼
                   apihub.agnes-ai.com
                   (Agnes LLM API)
```

## 部署步骤

### 1. 部署 Worker
```bash
cd mini-disco-worker
npx wrangler deploy --name mini-disco-api
```

### 2. 设置环境变量
在 Cloudflare Dashboard → Workers → mini-disco-api → Variables and Secrets:
- `AGNES_API_KEY`: sk-LgcxeEG9Qz6kCipH6mzmm9kkWj9J4gFla8FsV2qjzXhB8y8F
- `AUTH_PASSWORD`: (留空)
- `AGNES_API_URL`: https://apihub.agnes-ai.com/v1/chat/completions
- `AGNES_MODEL`: agnes-2.0-flash

### 3. 部署前端
```bash
cd mini-disco
npm run build
npx vercel --prod --non-interactive
```

## 功能
- ✅ AI 聊天代理（Agnes API 转发）
- ✅ 频率限制（10 次/分钟/IP）
- ✅ Suspicious response 检测
- ✅ CORS 跨域支持
- ✅ 超时保护（25 秒）
- ✅ KV Cache（可选）

## 成本
- Vercel: 免费（静态站点）
- Cloudflare Workers: 免费（10 万次/天）
- Agnes API: 按量计费
