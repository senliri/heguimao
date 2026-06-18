# Compliance Cat — 下一步行动计划

> 生成时间: 2026-06-12 02:52
> 项目版本: v1.3.0 (当前部署: Netlify)
> 累计提交: 10 commits → senliri/mini-disco:main

---

## 一、项目现状评估

### ✅ 已完成
| 里程碑 | 状态 | 说明 |
|---|---|---|
| P0 UI 全量英语化 | ✅ 完成 | Home/Appeal/Report/Layout 全部英文，0 中文字符残留 |
| P1 安全架构 | ✅ 完成 | Netlify Functions 代理，API Key 不外泄 |
| P2 Agent 特征提取 | ✅ 完成 | 关键词词典 3x 扩展 (~400 词) |
| P3 Hybrid AI+结构化 | ✅ 完成 | AI 推理 + 结构化数据融合 |
| SEO 基础 | ✅ 完成 | Meta/Og/JSON-LD/sitemap |
| 4 大痛点 P4b | ✅ 完成 | Prerequisites & Risks Tab |
| 4 大痛点 P2/部分 | ✅ 完成 | 检测机构推荐 + 证书验证指引 |
| 测试套件 | ✅ 完成 | 6 场景，71% 通过，0 中文泄漏 |

### 🔧 技术债
| 项目 | 说明 | 优先级 |
|---|---|---|
| react-router-dom v6 | 因兼容问题未升级 v7 | 低 |
| 无后端数据库 | 纯前端 localStorage | 中 |
| Netlify 未部署最新代码 | GitHub 已推，需手动部署 | 高 |

---

## 二、下一步计划（按优先级排序）

### 📌 Phase 4a：Smart Appeal Analyzer — 解析 AI 审查通知

**对应痛点 1：AI 误伤申诉难**

#### 问题
- 亚马逊 AI 直接下架 Listing，通知模糊
- 现有 Appeal 页面是通用 POA 模板，不针对具体审查原因

#### 方案
- 在 Appeal 页面增加 **"Paste Review Notice"** 输入框
- 用户粘贴亚马逊审查通知原文 → AI 提取：
  - 审查维度（FCC? CE? CPSIA?）
  - 具体违规条款
  - 严重级别
- 基于提取结果生成**精准 POA**，而非通用模板

#### 技术实现
- 文件：`src/pages/Appeal.tsx`
- 新增字段：`reviewNotice: string`
- 新增 prompt：`AI_REVIEW_NOTICE_PROMPT`（解析审查通知 → 结构化提取）
- 复用现有 `generateAppeal()` 函数，但传入更精准的上下文

#### 预计工作量
- 前端改动：2 小时（增加输入框 + 切换逻辑）
- Prompt 编写：1 小时
- 测试：30 分钟
- **总计：约 3 小时**

---

### 📌 Phase 4c：Pre-submission Review — POA 预审

**对应痛点 1：AI 误伤申诉难**

#### 问题
- POA 生成后无法预估是否会被 Amazon 接受
- 反复被拒导致 Listing 权重持续下降

#### 方案
- POA 生成后，额外触发一次 **"Amazon 审核视角"** 检查
- AI 模拟 Amazon 审核员，检查 POA 是否：
  - 有明确的根本原因分析
  - 纠正措施是否具体可执行
  - 预防措施是否有制度保障
  - 是否存在模板化/空泛语言
- 输出：通过/需修改 + 具体修改建议

#### 技术实现
- 文件：`src/pages/Appeal.tsx`
- 新增 prompt：`AMAZON_REVIEWER_PROMPT`
- 新增 UI 区域：POA 下方的 "Pre-submission Review" 面板

#### 预计工作量
- Prompt 编写：1 小时
- UI 改动：1 小时
- **总计：约 2 小时**

---

### 📌 Phase 5：Product Portfolio — 产品合规看板

**对应痛点 3：多站点多 SKU 管理混乱**

#### 问题
- 卖家管理几十个 SKU，每个合规状态各异
- 手动 Excel 管理，容易遗漏

#### 方案
- 基于 localStorage 的产品管理
- 支持添加产品：产品名 + 类别 + 子类别 + 目标市场
- 每个产品卡片显示合规状态：
  - 🟢 已合规（所有必要认证齐全）
  - 🟡 进行中（部分认证在办）
  - 🔴 未检测（无任何认证）
- 点击卡片进入 Report 页面查看详情
- 支持搜索/筛选/批量删除

#### 技术实现
- 新建文件：`src/pages/Portfolio.tsx`
- 新建 store：`src/lib/portfolio.ts`（localStorage 封装）
- 新增路由：`/portfolio`
- 复用现有 `generateRecommendations()` 判断合规状态

#### 预计工作量
- Portfolio 页面：4 小时
- Portfolio store：2 小时
- 路由集成：1 小时
- **总计：约 7 小时**

---

### 📌 Phase 5b：Certificate Manager — 证书管理 + 到期提醒

**对应痛点 2：证书造假打击**

#### 问题
- 证书过期导致合规失效
- 没有系统管理证书有效期

#### 方案
- 在 Portfolio 中为每个产品管理已有证书
- 记录：证书名称 + 颁发机构 + 颁发日期 + 到期日期 + 证书号
- 过期前 30/15/7 天推送提醒（本地通知）
- 支持上传证书照片/PDF

#### 技术实现
- 扩展 `src/lib/portfolio.ts` 增加证书管理
- 在 Portfolio 卡片上显示证书状态徽章
- 到期提醒逻辑

#### 预计工作量
- 证书数据模型：1 小时
- UI 集成：2 小时
- **总计：约 3 小时**

---

### 📌 Phase 6：Compliance Dashboard — 批量导出

**对应痛点 3：多站点多 SKU 管理混乱**

#### 问题
- 团队管理需要汇总所有产品合规数据
- 手动导出效率低

#### 方案
- 一键导出所有产品的合规报告汇总（CSV/Excel）
- 包含：产品名称、类别、市场、合规状态、所需认证、优先级

#### 技术实现
- 复用 jsPDF + autoTable（已集成）
- 新增导出按钮：`Export All Compliance Data`
- 生成 CSV 格式

#### 预计工作量
- **约 3 小时**

---

## 三、发布计划

### 本次部署（立即执行）
| 任务 | 状态 |
|---|---|
| 推送最新代码到 GitHub | ✅ 已完成 (e37aa67) |
| 在 Netlify 手动部署 | 🔜 待用户执行 |
| 验证 Prerequisites Tab 在线显示 | 🔜 待验证 |

### 本周计划
| 日期 | 任务 | 预估时间 |
|---|---|---|
| Day 1 | Phase 4a: Smart Appeal Analyzer | 3h |
| Day 2 | Phase 4c: Pre-submission Review | 2h + 联调 |
| Day 3 | Netlify 部署 Phase 4a/4c 版本 | 1h |
| Day 4 | 收集真实用户反馈 | — |
| Day 5 | Phase 5: Product Portfolio | 7h |

### 下周计划
| 日期 | 任务 | 预估时间 |
|---|---|---|
| Day 6-7 | Phase 5b: Certificate Manager | 3h |
| Day 8 | Phase 6: Dashboard Export | 3h |
| Day 9 | 全链路测试 | 2h |
| Day 10 | 正式发布 v2.0 | — |

---

## 四、关键依赖与阻塞

### 无外部依赖
- 所有功能纯前端实现（localStorage）
- AI 调用通过 Netlify Functions 代理
- 无需额外 API Key

### 待确认
- [ ] Netlify 部署权限：需用户在 Netlify 控制台触发部署
- [ ] 是否有真实用户可以进行 Phase 4a 测试
- [ ] 是否需要在产品页面增加"添加产品"入口

---

## 五、风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|---|---|---|---|
| AI API 调用成本 | 中 | 中 | 设置每日请求上限，缓存常见产品 |
| localStorage 数据丢失 | 低 | 中 | 增加"导出/导入备份"功能 |
| Amazon 审核规则变化 | 低 | 高 | Prompt 保持通用性，定期更新 |

---

## 六、成功指标（v2.0 目标）

| 指标 | 当前 | 目标 |
|---|---|---|
| 产品合规覆盖度 (测试) | 71% | 80%+ |
| 功能完整性 (痛点覆盖) | 50% (2/4) | 100% (4/4) |
| 页面数 | 5 (Home/Report/Appeal/Category/Market) | 7 (+ Portfolio + Dashboard) |
| 部署状态 | 旧版 | 最新版本 v2.0 |
