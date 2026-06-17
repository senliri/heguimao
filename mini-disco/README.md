# 合规猫 (Compliance Cat)

> Amazon 卖家合规排查助手 — 帮助卖家快速排查产品合规风险，生成合规报告，支持申诉指导。

## 技术栈

- **React 18** + **TypeScript**
- **Vite** (构建工具) + **Tailwind CSS** (样式)
- **React Router v6** (SPA 路由)
- **Vercel Serverless Functions** (后端 API)
- **jsPDF** (PDF 报告导出)
- **Nodemailer** (邮件发送)

## 架构

```
User → Vercel Edge Network → SPA (Static) + Serverless Functions (API)
                                ├── /          → index.html (SPA)
                                ├── /api/chat  → AI 代理
                                ├── /api/send-email → 邮件发送
                                └── /api/feedback → 用户反馈
```

## 功能

- ✅ 12 个大类、60+ 子分类产品选择
- ✅ 6 个目标市场 (美/欧/英/日/加/澳)
- ✅ 品类×市场 联动合规数据
- ✅ 高风险/中风险分级标注
- ✅ PDF 报告导出（含整改建议）
- ✅ 申诉指导 + AI 分析
- ✅ 密码找回 + 邮箱验证
- ✅ 用户反馈

## 快速开始

```bash
npm install              # 安装依赖
npm run dev              # 本地开发 (localhost:5173)
npm run build            # 生产构建 → dist/
npm run preview          # 预览构建产物
```

## 项目结构

```
src/
├── pages/           # 页面组件
│   ├── Home.tsx     # 首页（产品选择 + 搜索）
│   ├── Category.tsx # 子分类选择
│   ├── Market.tsx   # 市场选择
│   ├── Report.tsx   # 合规报告 + PDF 导出
│   ├── Appeal.tsx   # 申诉指导
│   └── AuthPage.tsx # 登录/注册/密码重置
├── components/      # 共享 UI 组件
├── data/            # 业务数据（可编辑）
│   └── site.ts      # 品类、市场、合规数据
├── lib/             # 工具函数
│   ├── api.ts       # API 客户端
│   ├── auth.ts      # 认证逻辑 + 密码重置
│   └── env.ts       # 环境变量管理
└── styles.css       # 全局样式
```

## 环境变量

### 本地开发

复制 `.env.example` 为 `.env.local` 并填写真实值：

```bash
cp .env.example .env.local
```

```env
VITE_AGNES_BASE_URL=https://apihub.agnes-ai.com/v1/chat/completions
VITE_AGNES_API_KEY=your_api_key_here
AUTH_PASSWORD=your_secure_password
```

### Vercel 部署

在 Vercel Dashboard → Project Settings → Environment Variables 中配置：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `AGNES_API_KEY` | ✅ | AI API 密钥 |
| `AUTH_PASSWORD` | ✅ | 应用访问密码 |
| `SMTP_USER` | ⚠️ | 发件邮箱 (126.com) |
| `SMTP_PASS` | ⚠️ | 邮箱授权码 |
| `AGNES_API_URL` | ⚠️ | 可选，默认 apihub.agnes-ai.com |
| `AGNES_MODEL` | ⚠️ | 可选，默认 agnes-2.0-flash |
| `VITE_DEMO_ENABLED` | ⚠️ | 是否启用 demo 用户，默认 false |

> ⚠️ **Never commit `.env.local` to git** — it's in `.gitignore`.

## 部署

```bash
# 推送代码触发 Vercel 自动部署
git add -A && git commit -m "description" && git push origin main

# 手动部署（需要 vercel CLI）
vercel deploy --prod
```

## 合规数据

合规数据在 `src/data/site.ts` 的 `categoryComplianceData` 中定义，按 `品类 → 市场` 两级索引。

## 免责声明

本报告仅供参考，不构成法律意见。合规要求可能随时更新，请以各监管机构和亚马逊官方发布的最新信息为准。
