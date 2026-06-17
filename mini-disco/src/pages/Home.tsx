import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Loader2, Globe, ArrowRight } from "lucide-react";
import { productCategories } from "../data/site";
import { store, cache, type CacheStats } from "../lib/store";

const MARKET_OPTIONS = [
  { id: "US", label: "🇺🇸 US", desc: "FDA, FCC, CPSC" },
  { id: "EU", label: "🇪🇺 EU", desc: "CE, REACH, RoHS" },
  { id: "UK", label: "🇬🇧 UK", desc: "UKCA, UK REACH" },
  { id: "JP", label: "🇯🇵 JP", desc: "PSE, TELEC, JIS" },
  { id: "CA", label: "🇨🇦 CA", desc: "IC, Health Canada" },
  { id: "AU", label: "🇦🇺 AU", desc: "RCM, EESS" },
  { id: "SG", label: "🇸🇬 SG", desc: "IMDA, NEA" },
  { id: "MY", label: "🇲🇾 MY", desc: "SIRIM, MCMC" },
  { id: "TH", label: "🇹🇭 TH", desc: "TISI, Thai FDA" },
  { id: "VN", label: "🇻🇳 VN", desc: "CR Mark, QC Mark" },
  { id: "ID", label: "🇮🇩 ID", desc: "SNI, Kominfo" },
  { id: "PH", label: "🇵🇭 PH", desc: "BPS, NTC" },
  { id: "SA", label: "🇸🇦 SA", desc: "SASO, SABER" },
  { id: "AE", label: "🇦🇪 AE", desc: "ESMA, TRA" },
  { id: "KR", label: "🇰🇷 KR", desc: "KC, KCC" },
  { id: "IN", label: "🇮🇳 IN", desc: "BIS, WPC" },
  { id: "BR", label: "🇧🇷 BR", desc: "INMETRO, ANVISA" },
  { id: "TR", label: "🇹🇷 TR", desc: "TSE, TSEK" },
  { id: "NZ", label: "🇳🇿 NZ", desc: "NZRC, Medsafe" },
  { id: "ZA", label: "🇿🇦 ZA", desc: "SABS, ICASA" },
];

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "profile" | "error" | "cache-hit";
};

export function Home() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("US");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showMarketDropdown, setShowMarketDropdown] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (userMessage: string) => {
    if (!userMessage.trim() || isAnalyzing) return;
    const userMsg: ConversationMessage = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, userMsg]);
    setIsAnalyzing(true);

    try {
      const cached = cache.getDiagnosis(userMessage, selectedMarket);
      if (cached) {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: "⚡ **Cache hit!** This analysis was already computed — instant result.",
          type: "cache-hit",
        } as ConversationMessage]);
        setTimeout(() => {
          setMessages((prev) => [...prev, {
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

      // Lazy-load agent module only when user sends a message
      const { combinedDiagnose } = await import("../lib/agent");
      const result = await combinedDiagnose(userMessage, undefined, selectedMarket || undefined);

      const assistantMsg: ConversationMessage = {
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
            Compliance Cat
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base text-slate-400 sm:text-lg">
            Enter your product and market — get a compliance report in seconds
          </p>

          {/* Main Input */}
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <input
                type="text"
                placeholder="e.g. Bluetooth headphones, power bank, children's toys..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-white placeholder-slate-500 outline-none text-lg"
              />

              {/* Market Selector */}
              <div className="mt-2 flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMarketDropdown(!showMarketDropdown)}
                    className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10 transition"
                  >
                    <Globe className="h-4 w-4" />
                    {MARKET_OPTIONS.find(m => m.id === selectedMarket)?.label}
                    <ArrowRight className="h-3 w-3 rotate-90" />
                  </button>
                  {showMarketDropdown && (
                    <div className="absolute top-full left-0 mt-1 z-50 w-48 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-slate-900 p-2 shadow-xl">
                      {MARKET_OPTIONS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedMarket(m.id);
                            setShowMarketDropdown(false);
                          }}
                          className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${
                            selectedMarket === m.id
                              ? "bg-blue-600 text-white"
                              : "text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {m.label} <span className="text-xs text-slate-400">{m.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isAnalyzing}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </button>
              </div>
            </div>
          </form>

          {/* Quick Examples */}
          <div className="mt-6">
            <p className="text-xs text-slate-500 mb-3">👆 Try one of these:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Bluetooth headphones",
                "Power bank 10000mAh",
                "Children's plush toys",
                "Skincare serum",
                "Yoga mat",
              ].map((ex) => (
                <button
                  key={ex}
                  onClick={() => handleQuickInput(ex)}
                  disabled={isAnalyzing}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-400 hover:border-blue-500/40 hover:bg-white/5 hover:text-white transition disabled:opacity-50"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Products — for Amazon sellers */}
          <div className="mt-8">
            <p className="text-xs text-slate-500 mb-3">🔥 Hot selling products on Amazon — click to check compliance</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { emoji: "🎧", label: "Wireless Earbuds", hint: "FCC, Bluetooth, Battery" },
                { emoji: "🔋", label: "Power Bank", hint: "UN38.3, FCC, CE" },
                { emoji: "🧸", label: "Kids Toys", hint: "CPSIA, ASTM, EN71" },
                { emoji: "🧴", label: "Face Cream", hint: "FDA, CPNP, INCI" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleQuickInput(item.label)}
                  disabled={isAnalyzing}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition hover:border-blue-500/40 hover:bg-white/5 disabled:opacity-50"
                >
                  <div className="text-lg font-medium text-white">{item.emoji} {item.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{item.hint}</div>
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
            {messages.map((msg, i) => (
              <div
                key={i}
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
            { icon: "🛡️", label: "Appeal Guide", desc: "Product delisted? Quick appeal plan", href: "/appeal" },
            { icon: "📁", label: "Archive", desc: "My product records", href: "/portfolio" },
            { icon: "📢", label: "Regulatory Updates", desc: "Latest compliance news", href: "/dashboard" },
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
                <h3 className="font-semibold text-white">{action.label}</h3>
                <p className="text-sm text-slate-400">{action.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto mt-6 max-w-4xl px-4 sm:px-6 pb-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">How It Works</h3>
          <div className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">1</span>
              Enter product
            </span>
            <span>→</span>
            <span className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">2</span>
              AI analyzes
            </span>
            <span>→</span>
            <span className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">3</span>
              Get report
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
