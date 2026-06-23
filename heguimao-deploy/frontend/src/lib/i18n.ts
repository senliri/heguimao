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
};

// Current locale state
let currentLocale: Locale = "en";

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  localStorage.setItem("compliance_cat_locale", locale);
  // Update HTML lang attribute
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
