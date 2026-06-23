import { useI18n } from "../lib/i18n-context";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  const toggleLanguage = () => {
    const newLocale = locale === "en" ? "zh" : "en";
    setLocale(newLocale);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:text-white transition"
      title={locale === "en" ? "Switch to Chinese" : "切换到中文"}
    >
      <Globe className="h-4 w-4" />
      <span>{locale === "en" ? "EN" : "中文"}</span>
    </button>
  );
}
