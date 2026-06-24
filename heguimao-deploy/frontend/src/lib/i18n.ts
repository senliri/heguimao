// Internationalization (i18n) support

type Locale = "en" | "zh";

interface Translations {
  [key: string]: {
    en: string;
    zh: string;
  };
}

const translations: Translations = {
  // Navigation
  "nav.home": { en: "Home", zh: "首页" },
  "nav.report": { en: "Compliance Report", zh: "合规报告" },
  "nav.appeal": { en: "Appeal Assistant", zh: "申诉助手" },
  "nav.monitor": { en: "System Monitor", zh: "系统监控" },
  "nav.pricing": { en: "Upgrade Plan", zh: "升级计划" },
  "nav.profile": { en: "Profile", zh: "个人资料" },
  "nav.signin": { en: "Sign In", zh: "登录" },
  "nav.signup": { en: "Register", zh: "注册" },
  "nav.logout": { en: "Logout", zh: "退出" },
  "nav.admin": { en: "Admin", zh: "管理" },
  "nav.settings": { en: "Settings", zh: "设置" },
  "nav.account": { en: "Account", zh: "账户" },
  "nav.subscriptions": { en: "Subscriptions", zh: "订阅" },
  "nav.billing": { en: "Billing", zh: "账单" },
  "nav.help": { en: "Help", zh: "帮助" },
  "nav.faq": { en: "FAQ", zh: "常见问题" },
  "nav.docs": { en: "Docs", zh: "文档" },
  "nav.feedback": { en: "Feedback", zh: "反馈" },
  "nav.switch_lang": { en: "Switch language", zh: "切换语言" },
  "nav.signout": { en: "Sign out", zh: "退出登录" },

  // Home Page
  "home.title": { en: "Product Compliance Checker", zh: "产品合规检查器" },
  "home.subtitle": { en: "Check compliance requirements for your product in any market", zh: "检查你的产品在任何市场的合规要求" },
  "home.market": { en: "Select Market", zh: "选择市场" },
  "home.product": { en: "Enter Product Description", zh: "输入产品描述" },
  "home.analyze": { en: "Analyze", zh: "分析" },
  "home.loading": { en: "Analyzing...", zh: "分析中..." },
  "home.placeholder": { en: "e.g., USB-C charger, Bluetooth headphones, baby toy...", zh: "例如：USB-C充电器、蓝牙耳机、婴儿玩具..." },

  // Report Page
  "report.title": { en: "Compliance Report", zh: "合规报告" },
  "report.generate": { en: "Generate Report", zh: "生成报告" },
  "report.export_pdf": { en: "Export PDF", zh: "导出 PDF" },
  "report.export_csv": { en: "Export CSV", zh: "导出 CSV" },

  // Appeal Page
  "appeal.title": { en: "Appeal Assistant", zh: "申诉助手" },
  "appeal.description": { en: "Generate appeal letters for platform violations", zh: "生成平台违规申诉信" },
  "appeal.platform": { en: "Platform", zh: "平台" },
  "appeal.reason": { en: "Violation Reason", zh: "违规原因" },
  "appeal.generate": { en: "Generate Appeal", zh: "生成申诉信" },

  // Pricing Page
  "pricing.title": { en: "Choose Your Plan", zh: "选择你的计划" },
  "pricing.subtitle": { en: "Start free, upgrade when you need more", zh: "免费开始，需要时升级" },
  "pricing.free": { en: "Free", zh: "免费" },
  "pricing.basic": { en: "Basic", zh: "基础版" },
  "pricing.pro": { en: "Pro", zh: "专业版" },
  "pricing.upgrade": { en: "Upgrade", zh: "升级" },
  "pricing.current": { en: "Current Plan", zh: "当前计划" },

  // Profile Page
  "profile.title": { en: "User Profile", zh: "用户资料" },
  "profile.name": { en: "Name", zh: "姓名" },
  "profile.email": { en: "Email", zh: "邮箱" },
  "profile.plan": { en: "Current Plan", zh: "当前计划" },
  "profile.changepassword": { en: "Change Password", zh: "修改密码" },

  // Monitor Page
  "monitor.title": { en: "System Monitor", zh: "系统监控" },
  "monitor.health": { en: "Health Check", zh: "健康检查" },
  "monitor.export": { en: "Export Logs", zh: "导出日志" },
  "monitor.clear": { en: "Clear Logs", zh: "清除日志" },
  "monitor.api_connected": { en: "API Connected", zh: "API 已连接" },
  "monitor.api_disconnected": { en: "API Disconnected", zh: "API 断开" },
  "monitor.cache_active": { en: "Cache Active", zh: "缓存活跃" },
  "monitor.cache_empty": { en: "Cache Empty", zh: "缓存为空" },

  // Auth Page
  "auth.login": { en: "Login", zh: "登录" },
  "auth.register": { en: "Register", zh: "注册" },
  "auth.email": { en: "Email", zh: "邮箱" },
  "auth.password": { en: "Password", zh: "密码" },
  "auth.name": { en: "Full Name", zh: "姓名" },
  "auth.submit": { en: "Submit", zh: "提交" },
  "auth.forgot_password": { en: "Forgot Password?", zh: "忘记密码？" },
  "auth.have_account": { en: "Already have an account? Login", zh: "已有账号？登录" },
  "auth.no_account": { en: "Don't have an account? Register", zh: "没有账号？注册" },

  // Common
  "common.save": { en: "Save", zh: "保存" },
  "common.cancel": { en: "Cancel", zh: "取消" },
  "common.confirm": { en: "Confirm", zh: "确认" },
  "common.success": { en: "Success", zh: "成功" },
  "common.error": { en: "Error", zh: "错误" },
  "common.loading": { en: "Loading...", zh: "加载中..." },
  "common.back": { en: "Back", zh: "返回" },

  // Home Page (extended)
  "home.hero_title": { en: "3-Minute Compliance Check for Amazon Sellers", zh: "亚马逊卖家3分钟合规检查" },
  "home.hero_subtitle": { en: "Enter your product and market — get a risk assessment, required certifications, and appeal guide", zh: "输入产品和市场 — 获取风险评估、所需认证和申诉指南" },
  "home.input_placeholder": { en: "e.g. Bluetooth headphones, power bank, children's toys...", zh: "例如：蓝牙耳机、充电宝、儿童玩具..." },
  "home.market_select": { en: "Market", zh: "市场" },
  "home.analyze_btn": { en: "Analyze", zh: "分析" },
  "home.analyzing": { en: "Analyzing...", zh: "分析中..." },
  "home.try_one": { en: "Try one of these:", zh: "试试这些：" },
  "home.hot_products": { en: "Hot selling products on Amazon — click to check compliance", zh: "亚马逊热销产品 — 点击检查合规" },
  "home.quick_earbuds": { en: "Wireless Earbuds", zh: "无线耳机" },
  "home.quick_earbuds_hint": { en: "FCC, Bluetooth, Battery", zh: "FCC、蓝牙、电池" },
  "home.quick_powerbank": { en: "Power Bank", zh: "充电宝" },
  "home.quick_powerbank_hint": { en: "UN38.3, FCC, CE", zh: "UN38.3、FCC、CE" },
  "home.quick_toys": { en: "Kids Toys", zh: "儿童玩具" },
  "home.quick_toys_hint": { en: "CPSIA, ASTM, EN71", zh: "CPSIA、ASTM、EN71" },
  "home.quick_cream": { en: "Face Cream", zh: "面霜" },
  "home.quick_cream_hint": { en: "FDA, CPNP, INCI", zh: "FDA、CPNP、INCI" },
  "home.cache_hit": { en: "⚡ Cache hit! This analysis was already computed — instant result.", zh: "⚡ 命中缓存！该分析已计算 — 即时结果" },
  "home.no_markets_found": { en: "No markets found", zh: "未找到市场" },
  "home.search_placeholder": { en: "Search market...", zh: "搜索市场..." },
  "home.feature_appeal": { en: "Appeal Guide", zh: "申诉指南" },
  "home.feature_appeal_desc": { en: "Product delisted? Quick appeal plan", zh: "产品下架？快速申诉方案" },
  "home.feature_archive": { en: "Archive", zh: "档案" },
  "home.feature_archive_desc": { en: "My product records", zh: "我的产品记录" },
  "home.feature_updates": { en: "Regulatory Updates", zh: "法规更新" },
  "home.feature_updates_desc": { en: "Latest compliance news", zh: "最新合规资讯" },
  "home.how_title": { en: "How It Works", zh: "工作原理" },
  "home.step_enter": { en: "Enter product", zh: "输入产品" },
  "home.step_analyze": { en: "AI analyzes", zh: "AI 分析" },
  "home.step_report": { en: "Get report", zh: "获取报告" },

  // Market group labels
  "market.americas": { en: "Americas", zh: "美洲" },
  "market.europe": { en: "Europe", zh: "欧洲" },
  "market.asia_pacific": { en: "Asia-Pacific", zh: "亚太" },
  "market.sea_mea": { en: "SEA / MEA", zh: "东南亚/中东/非洲" },

  // Market country labels (flag + name)
  "market.US": { en: "🇺🇸 US", zh: "🇺🇸 美国" },
  "market.CA": { en: "🇨🇦 CA", zh: "🇨🇦 加拿大" },
  "market.BR": { en: "🇧🇷 BR", zh: "🇧🇷 巴西" },
  "market.EU": { en: "🇪🇺 EU", zh: "🇪🇺 欧盟" },
  "market.UK": { en: "🇬🇧 UK", zh: "🇬🇧 英国" },
  "market.TR": { en: "🇹🇷 TR", zh: "🇹🇷 土耳其" },
  "market.JP": { en: "🇯🇵 JP", zh: "🇯🇵 日本" },
  "market.KR": { en: "🇰🇷 KR", zh: "🇰🇷 韩国" },
  "market.AU": { en: "🇦🇺 AU", zh: "🇦🇺 澳大利亚" },
  "market.NZ": { en: "🇳🇿 NZ", zh: "🇳🇿 新西兰" },
  "market.SG": { en: "🇸🇬 SG", zh: "🇸🇬 新加坡" },
  "market.MY": { en: "🇲🇾 MY", zh: "🇲🇾 马来西亚" },
  "market.TH": { en: "🇹🇭 TH", zh: "🇹🇭 泰国" },
  "market.VN": { en: "🇻🇳 VN", zh: "🇻🇳 越南" },
  "market.ID": { en: "🇮🇩 ID", zh: "🇮🇩 印度尼西亚" },
  "market.PH": { en: "🇵🇭 PH", zh: "🇵🇭 菲律宾" },
  "market.SA": { en: "🇸🇦 SA", zh: "🇸🇦 沙特阿拉伯" },
  "market.AE": { en: "🇦🇪 AE", zh: "🇦🇪 阿联酋" },
  "market.IN": { en: "🇮🇳 IN", zh: "🇮🇳 印度" },
  "market.ZA": { en: "🇿🇦 ZA", zh: "🇿🇦 南非" },

  // Market descriptions (certifications)
  "market.US.desc": { en: "FDA, FCC, CPSC", zh: "FDA、FCC、CPSC" },
  "market.CA.desc": { en: "IC, Health Canada", zh: "IC、加拿大卫生部" },
  "market.BR.desc": { en: "INMETRO, ANVISA", zh: "INMETRO、ANVISA" },
  "market.EU.desc": { en: "CE, REACH, RoHS", zh: "CE、REACH、RoHS" },
  "market.UK.desc": { en: "UKCA, UK REACH", zh: "UKCA、UK REACH" },
  "market.TR.desc": { en: "TSE, TSEK", zh: "TSE、TSEK" },
  "market.JP.desc": { en: "PSE, TELEC, JIS", zh: "PSE、TELEC、JIS" },
  "market.KR.desc": { en: "KC, KCC", zh: "KC、KCC" },
  "market.AU.desc": { en: "RCM, EESS", zh: "RCM、EESS" },
  "market.NZ.desc": { en: "NZRC, Medsafe", zh: "NZRC、Medsafe" },
  "market.SG.desc": { en: "IMDA, NEA", zh: "IMDA、NEA" },
  "market.MY.desc": { en: "SIRIM, MCMC", zh: "SIRIM、MCMC" },
  "market.TH.desc": { en: "TISI, Thai FDA", zh: "TISI、泰国FDA" },
  "market.VN.desc": { en: "CR Mark, QC Mark", zh: "CR Mark、QC Mark" },
  "market.ID.desc": { en: "SNI, Kominfo", zh: "SNI、Kominfo" },
  "market.PH.desc": { en: "BPS, NTC", zh: "BPS、NTC" },
  "market.SA.desc": { en: "SASO, SABER", zh: "SASO、SABER" },
  "market.AE.desc": { en: "ESMA, TRA", zh: "ESMA、TRA" },
  "market.IN.desc": { en: "BIS, WPC", zh: "BIS、WPC" },
  "market.ZA.desc": { en: "SABS, ICASA", zh: "SABS、ICASA" },
};

// Current locale state
let currentLocale: Locale = "en";

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  localStorage.setItem("compliance_cat_locale", locale);
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
}

export function getLocale(): Locale {
  if (typeof document !== "undefined") {
    const saved = localStorage.getItem("compliance_cat_locale");
    if (saved === "zh" || saved === "en") {
      currentLocale = saved;
    }
  }
  return currentLocale;
}

export function t(key: string): string {
  const translation = translations[key];
  if (!translation) {
    console.warn(`Translation key not found: ${key}`);
    return key;
  }
  return translation[currentLocale];
}

export function isZh(): boolean {
  return currentLocale === "zh";
}
