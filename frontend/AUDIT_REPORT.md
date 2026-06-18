# Mini-Disco 项目全面审计报告

**日期**: 2026-06-15
**项目**: Compliance Cat (senliri/mini-disco)
**技术栈**: React + TypeScript + Vite + Tailwind + Vercel Serverless Functions

---

## 审计结果汇总

| 等级 | 数量 | 状态 |
|------|------|------|
| P0 (严重) | 5 | ✅ 全部修复 |
| P1 (中等) | 5 | ✅ 全部修复 |
| P2 (轻微/优化) | 12 | ✅ 全部修复 |

---

## P0 修复详情

### 1. vercel.json 格式错误 ✅
- **问题**: JSON 语法错误，`rewrites` 和 `headers` 配置混乱
- **修复**: 重写为标准 Vercel 配置，包含正确的 rewrites、headers、functions 配置
- **影响**: 部署直接失败

### 2. package.json 依赖分类错误 ✅
- **问题**: 构建工具混在 `dependencies` 中
- **修复**: 将 vite/esbuild/typescript/@vitejs/plugin-react 等移入 `devDependencies`
- **影响**: 生产部署时不必要包被打包

### 3. api/send-email.js CommonJS/ESM 混用 ✅
- **问题**: 使用 `require`/`module.exports` 而其他 API 用 `export default`
- **修复**: 统一为 ES Module 格式
- **影响**: Vercel Node.js runtime 解析失败

### 4. api/chat.js 密码哈希不安全 ✅
- **问题**: 使用 djb2 变体哈希，易被绕过
- **修复**: 升级为 SHA-256 + timing-safe comparison
- **影响**: 认证可被暴力破解

### 5. index.html 旧 Netlify 域名残留 ✅
- **问题**: 结构化数据中引用 `catcompliance.netlify.app`
- **修复**: 全部替换为 `mini-disco.vercel.app`
- **影响**: SEO 指向旧域名

---

## P1 修复详情

### 6. AUTH_PASSWORD 环境变量提示 ✅
- **修复**: 在 `.env.example` 中添加 SHA-256 哈希说明

### 7. api/feedback.js 功能未实现 ✅
- **问题**: 只有 `console.log`，无实际功能
- **修复**: 添加 SMTP 邮件通知功能

### 8. FEATURE_KEYWORDS 重复关键词 ✅
- **修复**: 清理 `contains_magnets` 中蓝牙设备关键词、`has_flammable` 中 `nail polish` 重复、`PRODUCT_TYPE_CATEGORY_MAP` 中重复项

### 9. store.ts 代码格式 ✅
- **修复**: `normalizeCacheKey` 函数闭合括号缺少换行

### 10. PRODUCTION_CHECKLIST.md 过时 ✅
- **修复**: 更新已完成项标记

---

## P2 修复详情

### 11. temperature 硬编码 ✅
- **修复**: appeal 场景使用 0.7，合规场景保持 0.3

### 12. generateDiagnosis 重复代码 ✅
- **修复**: 将市场名称映射提取为 IIFE

### 13. vite.config.ts hmr: false ✅
- **修复**: 移除 `hmr: false`，恢复热更新

### 14. health.js SMTP 检查过严 ✅
- **修复**: 改为 `SMTP_CONFIGURED`，区分必需和非必需配置

### 15-17. FEATURE_KEYWORDS 重复/冗余 ✅
- **修复**: 移除 `has_battery` 中的 usb-c/type-c、消费电子产品关键词；清理 wearable 中重复 bracelet/smart glasses

### 18. store.ts 缓存模糊匹配 ✅
- **修复**: 使用单词边界正则匹配，避免 "phone" 误匹配 "smartphone"

### 19. env 变量名不一致 ✅
- **修复**: `VITE_AI_BASE_URL` → `VITE_AGNES_BASE_URL`

### 20-22. 其他细节 ✅
- 清理各类重复关键词

---

## 剩余建议（需 Alex 决策）

1. **has_battery 关键词过宽**: "electric"/"electronic" 会匹配几乎所有产品，考虑改为精确匹配
2. **跨类别重叠**: 某些产品同时被标记为 has_battery 和 wearable，考虑加权机制
3. **缓存 TTL**: 已调整为 12 小时 ✅
4. **API 限流**: 内存限流已添加注释说明 Vercel Pro 升级方案 ✅
5. **日志**: 已引入 `@vercel/functions` logger，统一替换 console.log ✅
6. **has_battery 关键词**: 已精简，移除过于宽泛的 "electric"/"electronic" ✅
7. **demo 密码**: 改为环境变量配置（VITE_DEMO_ENABLED/EMAIL/PASSWORD/NAME）✅
8. **备份文件**: 已清理 Appeal.tsx.bak 和 tests/e2e/*.bak ✅
9. **README**: 已更新部署说明（Vercel + 环境变量表）✅

---

## 文件变更清单

| 文件 | 变更 |
|------|------|
| `vercel.json` | 完全重写 |
| `package.json` | 依赖分类修正 |
| `api/send-email.js` | ESM 格式转换 |
| `api/chat.js` | 密码哈希升级 + temperature 动态化 |
| `api/feedback.js` | 功能实现 |
| `api/health.js` | SMTP 检查逻辑优化 |
| `index.html` | 域名替换 |
| `agent.ts` | 关键词清理 + has_battery 精简 ✅ |
| `store.ts` | 格式修复 + 缓存匹配优化 + TTL 12h ✅ |
| `vite.config.ts` | 移除 hmr: false |
| `auth.ts` | 添加 demo 用户生产部署注释 ✅ |
| `site.ts` | 添加 BOM 字符注释 ✅ |
| `.env.example` | 生产部署注意事项 ✅ |
| `Appeal.tsx.bak` | 已删除 ✅ |
| `tests/e2e/*.bak` | 已删除 ✅ |
