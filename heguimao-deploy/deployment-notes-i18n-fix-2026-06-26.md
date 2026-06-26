# 合规猫前端部署记录

## 2026-06-26 最终修复部署

### 背景
i18n 正则批量替换 `t("` → `${t("`` 引入了严重 collateral damage：
- `import(` → `impor{t(` — 破坏所有 lazy import
- `split(` → `spli{t(` — 破坏 Layout.tsx 的用户名分割
- `recommendedt(` → `recommended{t(` — 拼接表达式被破坏
- `mostLikelyRejectiont(` → `mostLikelyRejection{t(` — 同上
- 多处 `|| {t(...)` 双大括号语法错误

### 修复文件

| 文件 | 问题 | 修复 |
|------|------|------|
| `App.tsx:16-17` | `impor{t(` 破坏 import | 恢复 `import()` |
| `Appeal.tsx:313` | `recommendedt("appeal.strategy")` | → `recommendedStrategy` |
| `Appeal.tsx:316` | `recommended{t("appeal.strategy")}` | → `recommendedStrategy` |
| `Appeal.tsx:496` | `mostLikelyRejection{t("appeal.reason")}` | → `mostLikelyRejection` |
| `Report.tsx:361` | `|| {t("breadcrumb.category")}` | → `|| t("breadcrumb.category")` |
| `Report.tsx:364` | `|| {t("breadcrumb.market")}` | → `|| t("breadcrumb.market")` |
| `Layout.tsx:98` | `.spli{t(" ")}` | → `.split(" ")` |

### 构建结果
```
✓ built in 15.76s
dist/index.html (6.6 KB)
dist/assets/index-C2Y1URKx.js (711.8 KB, gzip: 188.62 KB)
```

### Git
- Commit: `1d75a85` → `2208f74`
- Removed: `test_token.py`, `verify_token.py`, `verify_token2.py` (GitHub secret scanning blocked push)
- Added: `.gitignore`

### 经验教训
1. **正则批量替换必须配合 scan-collateral 验证** — 替换后必须扫描常见函数名是否被破坏
2. **`import(` 是最危险的替换目标** — 正则必须排除关键字内部的 `t(`
3. **`split(` 也极易误伤** — 正则应使用更精确的模式（如只匹配 `t("` 前面没有 `\w` 的情况）
4. **构建是最终验证** — 不要依赖肉眼检查，每次替换后必须 `vite build`
5. **GitHub secret scanning** — 包含 API key 的测试文件会被 push protection 拦截
