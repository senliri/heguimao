import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Loader2, Globe, ChevronDown, X } from "lucide-react";
import { productCategories } from "../data/site";
import { combinedDiagnose, type ProductProfile, type CombinedDiagnosisResult } from "../lib/agent";
import { store, cache, type CacheStats } from "../lib/store";
import { t, getLocale } from "../lib/i18n";

// Market data — labels/desc resolved via i18n at render time
const MARKET_DATA = [
  { id: "US", group: "americas" },
  { id: "CA", group: "americas" },
  { id: "BR", group: "americas" },
  { id: "EU", group: "europe" },
  { id: "UK", group: "europe" },
  { id: "TR", group: "europe" },
  { id: "JP", group: "asia_pacific" },
  { id: "KR", group: "asia_pacific" },
  { id: "AU", group: "asia_pacific" },
  { id: "NZ", group: "asia_pacific" },
  { id: "SG", group: "asia_pacific" },
  { id: "MY", group: "sea_mea" },
  { id: "TH", group: "sea_mea" },
  { id: "VN", group: "sea_mea" },
  { id: "ID", group: "sea_mea" },
  { id: "PH", group: "sea_mea" },
  { id: "SA", group: "sea_mea" },
  { id: "AE", group: "sea_mea" },
  { id: "IN", group: "sea_mea" },
  { id: "ZA", group: "sea_mea" },
];

const GROUP_ORDER = ["americas", "europe", "asia_pacific", "sea_mea"] as const;

type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "profile" | "error" | "cache-hit";
};

function msgId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

export function Home() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("US");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showMarketDropdown, setShowMarketDropdown] = useState(false);
  const [marketSearch, setMarketSearch] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (userMessage: string) => {
    if (!userMessage.trim() || isAnalyzing) return;
    const userMsg: ConversationMessage = { id: msgId(), role: "user", content: userMessage };
    setMessages((prev) => [...prev, userMsg]);
    setIsAnalyzing(true);

    try {
      const cached = cache.getDiagnosis(userMessage, selectedMarket);
      if (cached) {
        setMessages((prev) => [...prev, {
          id: msgId(),
          role: "assistant",
          content: t("home.cache_hit"),
          type: "cache-hit",
        } as ConversationMessage]);
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            id: msgId(),
            role: "assistant",
            content: (cached as CombinedDiagnosisResult).summary,
            type: "profile",
          }]);
        }, 600);
        setTimeout(() => {
          navigate(`/report?ai=true&market=${selectedMarket}&product=${encodeURIComponent(userMessage)}`, {
            state: { cached },
          });
        }, 1000);
        setIsAnalyzing(false);
        return;
      }

      const result = await combinedDiagnose(userMessage, undefined, selectedMarket || undefined);

      const assistantMsg: ConversationMessage = {
        id: msgId(),
        role: "assistant",
        content: result.summary || `Let me analyze **${result.profile.product_type || "your product"}** for you.`,
        type: "profile",
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (result.recommendations && result.recommendations.length > 0) {
        cache.setDiagnosis(userMessage, selectedMarket, result);
        setTimeout(() => {
          navigate(`/report?ai=true&market=${selectedMarket}&product=${encodeURIComponent(userMessage)}`, {
            state: { profile: result.profile, cachedResult: result },
          });
        }, 800);
      }
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: msgId(),
        role: "assistant",
        content: "Sorry, encountered an issue: " + (err instanceof Error ? err.message : String(err)),
        type: "error",
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setShowChat(true);
    handleSend(input);
    setInput("");
  };

  const handleQuickInput = (product: string) => {
    setInput(product);
    setShowChat(true);
    handleSend(product);
  };

  // Filtered markets based on search
  const filteredMarkets = marketSearch
    ? MARKET_DATA.filter(m =>
        m.id.toLowerCase().includes(marketSearch.toLowerCase())
      )
    : MARKET_DATA;

  // Grouped filtered markets
  const groupedMarkets = filteredMarkets.reduce<Record<string, typeof MARKET_DATA>>((acc, m) => {
    if (!acc[m.group]) acc[m.group] = [];
    acc[m.group].push(m);
    return acc;
  }, {});

  const selected = MARKET_DATA.find(m => m.id === selectedMarket);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-12 pt-16 sm:px-6 sm:pt-24">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300">
            <Sparkles className="h-4 w-4" />
            AI Compliance Checker
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {t("home.hero_title")}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base text-slate-400 sm:text-lg">
            {t("home.hero_subtitle")}
          </p>

          {/* Main Input */}
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <input
                type="text"
                placeholder={t("home.input_placeholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-white placeholder-slate-500 outline-none text-lg"
              />

              {/* Market Selector */}
              <div className="mt-2 flex items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <button
                    type="button"
                    onClick={() => setShowMarketDropdown(!showMarketDropdown)}
                    className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10 transition w-full justify-between"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Globe className="h-4 w-4" />
                      {selected && t(`market.${selected.id}`)}
                      {selected && <span className="text-xs text-slate-500">{t(`market.${selected.id}.desc`)}</span>}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {showMarketDropdown && (
                    <div className="absolute top-full left-0 mt-1 z-50 w-56 max-h-72 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-xl">
                      {/* Search */}
                      <div className="p-2 border-b border-white/10">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder={t("home.search_placeholder")}
                            value={marketSearch}
                            onChange={(e) => setMarketSearch(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                setShowMarketDropdown(false);
                                setMarketSearch("");
                              }
                            }}
                            className="w-full rounded-lg bg-white/5 py-1.5 pl-2 pr-6 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => { setShowMarketDropdown(false); setMarketSearch(""); }}
                            className="absolute right-1 top-1.5 text-slate-500 hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {/* Grouped list */}
                      <div className="max-h-52 overflow-y-auto p-1">
                        {GROUP_ORDER.map(group => {
                          const markets = groupedMarkets[group];
                          if (!markets || markets.length === 0) return null;
                          return (
                            <div key={group}>
                              <div className="px-2 py-1">
                                <span className="text-[10px] font-semibold uppercase text-slate-600">{t(`market.${group}`)}</span>
                              </div>
                              {markets.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => { setSelectedMarket(m.id); setShowMarketDropdown(false); setMarketSearch(""); }}
                                  className={`w-full text-left rounded-lg px-3 py-1.5 text-sm transition ${
                                    selectedMarket === m.id
                                      ? "bg-blue-600 text-white"
                                      : "text-slate-300 hover:bg-white/10"
                                  }`}
                                >
                                  {t(`market.${m.id}`)}{" "}
                                  <span className="text-xs text-slate-500">{t(`market.${m.id}.desc`)}</span>
                                </button>
                              ))}
                            </div>
                          );
                        })}
                        {Object.keys(groupedMarkets).length === 0 && (
                          <div className="px-3 py-4 text-center text-xs text-slate-500">{t("home.no_markets_found")}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isAnalyzing}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 shrink-0"
                >
                  <span className="relative inline-flex h-4 w-4 items-center justify-center align-middle">
                    <Loader2 className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : "opacity-0"}`} />
                    <Sparkles className={`h-4 w-4 absolute inset-0 ${isAnalyzing ? "opacity-0" : "opacity-100"}`} />
                  </span>
                  {isAnalyzing ? t("home.analyzing") : t("home.analyze_btn")}
                </button>
              </div>
            </div>
          </form>

          {/* Quick Examples */}
          <div className="mt-6">
            <p className="text-xs text-slate-500 mb-3">{t("home.try_one")}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { label: "home.quick_earbuds", hint: "home.quick_earbuds_hint" },
                { label: "home.quick_powerbank", hint: "home.quick_powerbank_hint" },
                { label: "home.quick_toys", hint: "home.quick_toys_hint" },
                { label: "home.quick_cream", hint: "home.quick_cream_hint" },
              ].map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => handleQuickInput(t(ex.label))}
                  disabled={isAnalyzing}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-400 hover:border-blue-500/40 hover:bg-white/5 hover:text-white transition disabled:opacity-50"
                >
                  {t(ex.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Products — for Amazon sellers */}
          <div className="mt-8">
            <p className="text-xs text-slate-500 mb-3">{t("home.hot_products")}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { emoji: "🎧", label: "home.quick_earbuds", hint: "home.quick_earbuds_hint" },
                { emoji: "🔋", label: "home.quick_powerbank", hint: "home.quick_powerbank_hint" },
                { emoji: "🧸", label: "home.quick_toys", hint: "home.quick_toys_hint" },
                { emoji: "🧴", label: "home.quick_cream", hint: "home.quick_cream_hint" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleQuickInput(t(item.label))}
                  disabled={isAnalyzing}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition hover:border-blue-500/40 hover:bg-white/5 disabled:opacity-50"
                >
                  <div className="text-lg font-medium text-white">{item.emoji} {t(item.label)}</div>
                  <div className="text-xs text-slate-500 mt-1">{t(item.hint)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Chat / Result Stream */}
      {showChat && (
        <section className="mx-auto max-w-2xl px-4 pb-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl p-3 ${
                  msg.role === "user"
                    ? "bg-blue-600/20 border border-blue-500/20"
                    : msg.type === "error"
                    ? "bg-red-500/10 border border-red-500/20"
                    : msg.type === "cache-hit"
                    ? "bg-green-500/10 border border-green-500/30"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap text-white">
                  {msg.content}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </section>
      )}

      {/* Features */}
      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 pb-8">
        <div className="grid gap-3 sm:grid-cols-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {[
            { icon: "🛡️", label: "home.feature_appeal", desc: "home.feature_appeal_desc", href: "/appeal" },
            { icon: "📁", label: "home.feature_archive", desc: "home.feature_archive_desc", href: "/portfolio" },
            { icon: "📢", label: "home.feature_updates", desc: "home.feature_updates_desc", href: "/dashboard" },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-blue-500/40 hover:bg-white/10"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-2xl">
                {action.icon}
              </span>
              <div className="text-left">
                <h3 className="font-semibold text-white">{t(action.label)}</h3>
                <p className="text-sm text-slate-400">{t(action.desc)}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto mt-6 max-w-4xl px-4 sm:px-6 pb-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">{t("home.how_title")}</h3>
          <div className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">1</span>
              {t("home.step_enter")}
            </span>
            <span>→</span>
            <span className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">2</span>
              {t("home.step_analyze")}
            </span>
            <span>→</span>
            <span className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">3</span>
              {t("home.step_report")}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
