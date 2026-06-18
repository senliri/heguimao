# Compliance Cat — 四大痛点优化方案

> 基于 2026-06-12 用户反馈深度分析

---

## 痛点 1：AI 误伤申诉难（"机器审机器"）

### 现状
- 亚马逊 AI 审查（如 ACP 合规审查、Product Compliance 机器人）直接下架 Listing
- 卖家收到的通知通常是模糊的模板文本（"涉嫌违规，请申诉"）
- 现有 Appeal 页面只生成通用 POA，不针对具体 AI 审查结果

### 方案：**Smart Appeal Analyzer** — 逆向解析 AI 审查通知
1. **AI 通知 OCR 解析**（Phase 4+）：用户上传亚马逊审核截图/PDF → AI 提取具体审查维度（FCC? CE? CPSIA?）
2. **审查维度匹配**：自动映射到具体合规要求 + 历史成功案例
3. **逆向 POA 生成**：针对"亚马逊怀疑的具体问题"生成精准回复，而非通用模板
4. **Pre-submission Review**：POA 生成后，AI 模拟 Amazon 审核视角进行预审，指出可能再次被拒的风险点

### 实现优先级
- ✅ 已有：Appeal 页面 + POA 生成
- 🔄 Phase 4：添加 "Upload Review Notice" 功能（截图/PDF 上传 → AI 解析通知内容）
- 🔄 Phase 5：Pre-submission Review（POA 逆向审核）

---

## 痛点 2：证书造假打击

### 现状
- CPC/GPSR 证书可伪造，Amazon 抽查后直接封号冻结资金
- 卖家分不清哪些证书是真的、哪些是"万能证书"
- 没有证书真伪核验渠道

### 方案：**Certificate Authenticity Checker** — 从源头杜绝风险
1. **推荐正规测试机构**：报告中的每个认证都推荐 3-5 家正规第三方检测机构（SGS, TUV, Intertek, CTI 等），附上参考价格和时间
2. **证书验证指引**：每个认证类型附带官方验证方法（如 FCC ID 可在 fcc.gov 验证、CE DoC 的欧盟数据库查询方法）
3. **风险等级标注**：明确标注哪些认证"必须第三方实验室"、哪些"可自行签署"、哪些"有官方数据库可查"
4. **证书过期提醒**：记录卖家已有证书的有效期，到期前 30 天推送提醒

### 实现优先级
- ✅ 已有：Cost/Time 估算（Hybrid 模式已实现）
- ✅ 已有：NeedsThirdParty 标记
- 🔄 Phase 4：添加检测机构推荐列表（机构名称 + 官网 + 参考价格）
- 🔄 Phase 5：卖家证书管理 + 过期提醒（LocalStorage 本地存储）

---

## 痛点 3：多站点多 SKU 管理混乱

### 现状
- 一个产品可能同时卖 US/EU/UK/JP 四个站点，每个站点合规要求不同
- 品牌下有几十个 SKU，每个 SKU 合规状态各异
- 手动管理 Excel，容易遗漏

### 方案：**Compliance Dashboard** — SKU 级合规看板
1. **Product Portfolio**：卖家添加产品列表（产品名 + 分类 + 目标市场），自动生成每个产品的合规矩阵
2. **合规状态看板**：每个 SKU 显示 🟢已合规 / 🟡进行中 / 🔴未检测 状态
3. **跨站点对比**：同一产品在不同站点的合规差异一目了然
4. **批量导出**：一键导出所有产品的合规报告汇总（适合团队管理）

### 实现优先级
- 🔄 Phase 5：Product Portfolio 页面（基于 localStorage，不依赖后端）
- 🔄 Phase 6：合规看板 + 批量导出（Excel/CSV）

---

## 痛点 4：资质与地址风险

### 现状
- 空壳公司主体易被封（无实际经营地址）
- VAT/EPR 是合规前置条件（EU 卖家先注册 VAT，才能做 CE 合规）
- 卖家不了解这些前置条件，直接做合规导致被拒

### 方案：**Compliance Prerequisites Engine** — 前置条件检查
1. **主体资质检查清单**：根据目标市场展示前置条件（VAT/EORI 号、注册地址、税号等）
2. **VAT/EPR 指引**：EU 市场自动标注 EPR 注册要求（德国 LUCID、法国 éco-EMballages 等）
3. **合规路径规划**：生成"从零开始的合规路线图"——先做什么后做什么，每一步的成本和时间

### 实现优先级
- ✅ 已有：Profile 提取（Market 字段）
- 🔄 Phase 4：添加 VAT/EPR 前置条件检查（在 Report 页面增加一个 "Prerequisites" tab）
- 🔄 Phase 5：合规路线图生成（Timeline 视图）

---

## 市场缺口：一站式自动化合规 Agent

### 现有定位
- ✅ AI 合规诊断（已有）
- ✅ 申诉辅助（已有）
- ❌ 证书管理（缺失）
- ❌ 多 SKU 看板（缺失）
- ❌ 合规前置条件（缺失）

### 差异化竞争策略

| 竞品类型 | 特点 | Compliance Cat 差异化 |
|---|---|---|
| 侵权检测工具 | Helium 10, Jungle Scout | 我们不检测侵权，我们专注**合规** |
| 合规数据库 | 单个认证查询网站 | 我们提供**一站式**，一个产品查所有市场 |
| 申诉服务 | 付费律师/服务商 | 我们是**自助式**，先免费诊断再付费深度服务 |
| ERP 工具 | 店小秘, 马帮 | 我们**轻量独立**，嵌入卖家工作流 |

### 核心壁垒
1. **AI 驱动**：不是死板的表单查询，而是自然语言对话 → 精准诊断
2. **混合模式**：AI 推理 + 结构化数据 = 既准确又全面
3. **免费引流 + 增值服务**：基础诊断免费，深度报告/申诉/证书管理增值服务

---

## 实施路线图

| Phase | 内容 | 复杂度 | 时间估算 |
|---|---|---|---|
| Phase 4a | **Smart Appeal Analyzer** — 在现有 Appeal 页面增加"AI 审查通知"输入框 | 低 | 1 天 |
| Phase 4b | **VAT/EPR Prerequisites** — Report 页面新增 Prerequisites tab | 低 | 1 天 |
| Phase 4c | **检测机构推荐列表** — 扩展 certifications.js，增加机构信息 | 低 | 1 天 |
| Phase 5 | **Product Portfolio** — 基于 localStorage 的产品合规看板 | 中 | 3 天 |
| Phase 5b | **Certificate Expiry Reminders** — 本地存储证书 + 到期提醒 | 低 | 1 天 |
| Phase 6 | **Compliance Dashboard** — SKU 级合规矩阵 + 批量导出 | 高 | 5 天 |

### 本周优先执行
1. ✅ P0: UI 全量英语化
2. ✅ P2: Agent 特征提取优化
3. 🔜 **新增**: Report 页面增加 "Prerequisites" tab（痛点 4）
4. 🔜 **新增**: Appeal 页面增加 AI 通知解析（痛点 1）
