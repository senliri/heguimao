import { t, useState, useEffect} from "react";
import { Link } from "react-router-dom";
import { FileText, Shield, AlertTriangle, CheckCircle, Upload, Mail, MessageSquare, Calendar, ChevronDown, Sparkles, Loader2, t("appeal.copy"), ScanEye, Zap, Brain, Eye } from "lucide-react";
import { analyzeComplianceNotice, reviewPOA, type NoticeAnalysisResult } from "../lib/appeal-analyzer";

export function Appeal() {
  const [activeTab, setActiveTab] = useState<"analyzer" | "guide" | "archive">("analyzer");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [productType, sett("appeal.product")Type] = useState("");
  const [reason, sett("appeal.reason")] = useState("");
  const [actions, sett("appeal.action")s] = useState("");
  const [language, sett("appeal.language")] = useState("en");
  const [isGenerating, setIsGenerating] = useState(false);
  const [appealResult, setAppealResult] = useState<{ rootCause?: string; poaTemplate?: string; correctiveActions?: string[]; preventiveMeasures?: string[] } | null>(null);
  const [copied, sett("appeal.copied")] = useState(false);
  const [downloadFormat, sett("appeal.download")Format] = useState("txt");
  const [history, setHistory] = useState<Array<{ id: number; product: string; reason: string; date: string; status: "draft" | "submitted" | "approved" | "rejected" }>>([]);

  // Persist history to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("appeal_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("appeal_history", JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // t("appeal.smart_analyzer") state
  const [reviewNotice, setReviewNotice] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<NoticeAnalysisResult | null>(null);
  const [preReviewResult, setPreReviewResult] = useState<any>(null);
  const [preReviewing, setPreReviewing] = useState(false);

  const handleGenerateAppeal = async () => {
    if (!productType || !reason) return;
    setIsGenerating(true);
    sett("appeal.copied")(false);
    try {
      const languageLabel: Record<string, string> = { en: "English", zh: "中文", ja: "日本語", de: t("appeal.lang_de") };
      const workerUrl = import.meta.env.VITE_WORKER_URL || "https://heguimao-api.senliri028.workers.dev";
      const response = await fetch(`${workerUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "appeal",
          prompt: `You are an Amazon appeal expert. Generate an appeal plan based on the user's listing removal reason.\n\nProduct: ${productType}\nRemoval reason: ${reason}\nActions taken: ${actions || "Not provided"}\nOutput language: ${languageLabel[language] || "English"}\n\nOutput format (strict JSON):\n{\n  "rootCause": "Root cause analysis",\n  "correctiveActions": ["Action 1", "Action 2"],\n  "preventiveMeasures": ["Measure 1", "Measure 2"],\n  "poaTemplate": "Complete appeal letter template",\n  "checklist": ["Document 1", "Document 2"],\n  "tips": "Appeal tips"\n}`,
          message: t("appeal.prompt_gen"),
        }),
      });

      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      const reply = data.reply || data.content || "";
      const cleaned = reply.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(t("appeal.unexpected_format"));
      setAppealResult(JSON.parse(jsonMatch[0]));
      setPreReviewResult(null);
      setHistory(prev => [{
        id: t("appeal.date").now(),
        product: productType,
        reason: reason,
        date: new t("appeal.date")().toLocalet("appeal.date")String("en-US"),
        status: "submitted" as const,
      }, ...prev]);
    } catch (err) {
      console.error(t("appeal.gen_failed"), err);
      alert(t("appeal.gen_retry"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleParseReviewNotice = async () => {
    if (!reviewNotice.trim()) return;
    setAnalyzing(true);
    try {
      const result = await analyzeComplianceNotice(reviewNotice, productType || undefined);
      setAnalysisResult(result);
    } catch (err) {
      console.error(t("appeal.analysis_failed"), err);
      alert(t("appeal.analysis_retry"));
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePreReview = async () => {
    if (!appealResult) return;
    setPreReviewing(true);
    try {
      const correctiveActions = (appealResult.correctiveActions as string[])?.join("\n") || [t("appeal.not_provided")];
      const preventiveMeasures = (appealResult.preventiveMeasures as string[])?.join("\n") || [t("appeal.not_provided")];
      const result = await reviewPOA(
        productType || t("appeal.unknown"),
        reason || t("appeal.unknown"),
        appealResult.rootCause || t("appeal.not_provided"),
        Array.isArray(correctiveActions) ? correctiveActions : [correctiveActions],
        Array.isArray(preventiveMeasures) ? preventiveMeasures : [preventiveMeasures],
        appealResult.poaTemplate || t("appeal.not_provided")
      );
      setPreReviewResult(result);
    } catch (err) {
      console.error(t("appeal.pre_review_failed"), err);
      alert(t("appeal.pre_review_retry"));
    } finally {
      setPreReviewing(false);
    }
  };

  const copyPOA = () => {
    if (!appealResult?.poaTemplate) return;
    const text = typeof appealResult.poaTemplate === "string" ? appealResult.poaTemplate : String(appealResult.poaTemplate);
    navigator.clipboard.writeText(text);
    sett("appeal.copied")(true);
    setTimeout(() => sett("appeal.copied")(false), 2000);
  };

  const downloadPOA = () => {
    if (!appealResult?.poaTemplate) return;
    const text = typeof appealResult.poaTemplate === "string" ? appealResult.poaTemplate : String(appealResult.poaTemplate);
    const rootCause = appealResult.rootCause ? `\n\nROOT CAUSE ANALYSIS:\n${appealResult.rootCause}\n\n` : "";
    const actionsList = appealResult.correctiveActions ? `\n\nCORRECTIVE ACTIONS:\n${(appealResult.correctiveActions as string[]).join("\n")}\n\n` : "";
    const preventive = appealResult.preventiveMeasures ? `\n\nPREVENTIVE MEASURES:\n${(appealResult.preventiveMeasures as string[]).join("\n")}\n\n` : "";
    const fullText = `Plan of t("appeal.action") (POA)\nt("appeal.product"): ${productType}\nt("appeal.removal_reason"): ${reason}${rootCause}${actionsList}${preventive}${text}`;
    
    if (downloadFormat === "html") {
      const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>POA - ${productType}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6;}h1{color:#1e40af;}h2{color:#7c3aed;border-bottom:1px solid #e5e7eb;padding-bottom:8px;}p{margin:8px 0;}</style></head><body><h1>Plan of t("appeal.action") for ${productType}</h1><p><strong>t("appeal.removal_reason"):</strong> ${reason}</p><h2>t("appeal.root_cause")</h2>${rootCause}<h2>t("appeal.corrective_actions")</h2>${actionsList}<h2>t("appeal.preventive_measures")</h2>${preventive}${text}</body></html>`;
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `POA_${productType.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `POA_${productType.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const deleteHistory = (id: number) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const severityColor = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case "critical": return "text-red-400 bg-red-500/10";
      case "high": return "text-orange-400 bg-orange-500/10";
      case "medium": return "text-yellow-400 bg-yellow-500/10";
      case "low": return "text-green-400 bg-green-500/10";
      default: return "text-slate-400 bg-slate-500/10";
    }
  };

  const verdictEmoji = (verdict: string) => {
    switch (verdict) {
      case "likely accepted": return "✅";
      case "needs revision": return "🔧";
      case "likely rejected": return "❌";
      default: return "❓";
    }
  };

  // Reset analyzer when tab changes
  const handleTabChange = (tab: "analyzer" | "guide" | "archive") => {
    setActiveTab(tab);
    if (tab !== "analyzer") {
      setAnalysisResult(null);
    }
  };

  return (
    <div>
      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <span className="text-slate-200">Appeal</span>
        </div>
      </section>

      <section className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleTabChange("analyzer")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition ${activeTab === "analyzer" ? "bg-cyan-600 text-white" : "border border-white/10 text-slate-400 hover:text-white"}`}
          >
            <Zap className="h-4 w-4" />
            t("appeal.tab_analyzer")
          </button>
          <button
            onClick={() => handleTabChange("guide")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition ${activeTab === "guide" ? "bg-purple-600 text-white" : "border border-white/10 text-slate-400 hover:text-white"}`}
          >
            <Shield className="h-4 w-4" />
            t("appeal.tab_guide")
          </button>
          <button
            onClick={() => handleTabChange("archive")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition ${activeTab === "archive" ? "bg-blue-600 text-white" : "border border-white/10 text-slate-400 hover:text-white"}`}
          >
            <FileText className="h-4 w-4" />
            t("appeal.tab_archive")
          </button>
        </div>
      </section>

      {/* ========== TAB: SMART ANALYZER ========== */}
      {activeTab === "analyzer" && (
        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-purple-500/5 p-6">
            <h1 className="text-2xl font-bold text-cyan-300">⚡ t("appeal.smart_analyzer")</h1>
            <p className="mt-1 text-sm text-slate-400">t("appeal.smart_analyzer_desc")</p>

            {/* Steps */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-cyan-500/10 px-3 py-2">
                <div className="text-xs font-bold text-cyan-300">1</div>
                <div className="text-xs text-slate-300">t("appeal.step1")</div>
              </div>
              <div className="rounded-lg bg-cyan-500/10 px-3 py-2">
                <div className="text-xs font-bold text-cyan-300">2</div>
                <div className="text-xs text-slate-300">t("appeal.step2")</div>
              </div>
              <div className="rounded-lg bg-cyan-500/10 px-3 py-2">
                <div className="text-xs font-bold text-cyan-300">3</div>
                <div className="text-xs text-slate-300">t("appeal.step3")</div>
              </div>
            </div>

            {/* Paste Notice */}
            <div className="mt-4 space-y-3">
              <textarea
                rows={5}
                placeholder="Paste the exact Amazon review notice here...&#10;&#10;Example: 'Your listing has been suppressed due to a suspected violation of our product compliance policies.'"
                value={reviewNotice}
                onChange={(e) => setReviewNotice(e.target.value)}
                className="w-full rounded-xl border border-cyan-500/20 bg-black/30 py-2.5 px-4 text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 resize-none text-sm font-mono"
              />
              <button
                onClick={handleParseReviewNotice}
                disabled={!reviewNotice.trim() || analyzing}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 py-2.5 px-5 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:opacity-50"
              >
                <span className="relative inline-flex h-4 w-4 items-center justify-center align-middle">
                  <Loader2 className={`h-4 w-4 ${analyzing ? 'animate-spin' : 'opacity-0'}`} />
                  <ScanEye className={`h-4 w-4 absolute inset-0 ${analyzing ? 'opacity-0' : 'opacity-100'}`} />
                </span>
                {analyzing ? t("appeal.analyzing") : t("appeal.analyze_notice")}
              </button>

              {/* Analysis Result */}
              {analysisResult && (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 space-y-4">
                  <div className="flex gap-3 flex-wrap">
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <div className="text-xs text-slate-400">t("appeal.comp_area")</div>
                      <div className="text-sm font-bold text-white">{analysisResult.complianceDimension || "—"}</div>
                    </div>
                    <div className="rounded-lg px-3 py-2">
                      <div className="text-xs text-slate-400">t("appeal.severity")</div>
                      <span className={`text-sm font-bold ${severityColor(analysisResult.severity || "")}`}>
                        {analysisResult.severity?.toUpperCase() || "—"}
                      </span>
                    </div>
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <div className="text-xs text-slate-400">t("appeal.reviewer")</div>
                      <div className="text-sm font-bold text-white">{analysisResult.reviewerType || "—"}</div>
                    </div>
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <div className="text-xs text-slate-400">t("appeal.confidence")</div>
                      <div className="text-sm font-bold text-white">{analysisResult.confidence || "—"}</div>
                    </div>
                  </div>
                  {analysisResult.specificIssue && (
                    <div>
                      <div className="text-xs font-semibold text-cyan-300 mb-1">🎯 t("appeal.specific_issue")</div>
                      <div className="text-sm text-slate-300">{analysisResult.specificIssue}</div>
                    </div>
                  )}
                  {analysisResult.amazonPerspective && (
                    <div>
                      <div className="text-xs font-semibold text-blue-300 mb-1">🤖 t("appeal.amazon_view")</div>
                      <div className="text-sm text-slate-300">{analysisResult.amazonPerspective}</div>
                    </div>
                  )}
                  {analysisResult.requestedEvidence && (analysisResult.requestedEvidence as string[]).length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-yellow-300 mb-1">📋 t("appeal.requested_evidence")</div>
                      <ul className="space-y-1">
                        {(analysisResult.requestedEvidence as string[]).map((e, i) => (
                          <li key={i} className="text-xs text-slate-300">• {e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResult.recommendedt("appeal.strategy") && (
                    <div>
                      <div className="text-xs font-semibold text-green-300 mb-1">💡 t("appeal.strategy")</div>
                      <div className="text-sm text-slate-300">{analysisResult.recommendedt("appeal.strategy")}</div>
                    </div>
                  )}
                  {analysisResult.followUpQuestions && (analysisResult.followUpQuestions as string[]).length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-purple-300 mb-1">❓ t("appeal.info_needed")</div>
                      <ul className="space-y-1">
                        {(analysisResult.followUpQuestions as string[]).map((q, i) => (
                          <li key={i} className="text-xs text-slate-300">• {q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResult.similarPastCases && (analysisResult.similarPastCases as string[]).length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-amber-300 mb-1">📚 t("appeal.similar_cases")</div>
                      <ul className="space-y-1">
                        {(analysisResult.similarPastCases as string[]).map((c, i) => (
                          <li key={i} className="text-xs text-slate-300">• {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                      <span className="text-xs font-semibold text-green-300">t("appeal.analysis_complete")</span>
                    </div>
                    <p className="text-xs text-slate-400">t("appeal.fill_details")</p>
                  </div>
                </div>
              )}
            </div>

            {/* t("appeal.product") Form + POA Generator */}
            <div className="mt-6 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-blue-500/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-purple-300">t("appeal.poa_gen")</h2>
                {analysisResult && (
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    t("appeal.smart_applied")
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">t("appeal.product_type")</label>
                  <input
                    type="text"
                    placeholder=t("appeal.placeholder_product")
                    value={productType}
                    onChange={(e) => sett("appeal.product")Type(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white placeholder-slate-500 outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">t("appeal.removal_reason")</label>
                  <select
                    value={reason}
                    onChange={(e) => sett("appeal.reason")(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white outline-none focus:border-purple-500/50"
                  >
                    <option value="">t("appeal.select_reason")</option>
                    <option value=t("appeal.reason_safety")>t("appeal.reason_safety")</option>
                    <option value=t("appeal.reason_missing_docs")>t("appeal.reason_missing_docs")</option>
                    <option value=t("appeal.reason_labeling")>t("appeal.reason_labeling")</option>
                    <option value=t("appeal.reason_restricted")>t("appeal.reason_restricted")</option>
                    <option value=t("appeal.reason_ip")>t("appeal.reason_ip")</option>
                    <option value=t("appeal.reason_miscat")>t("appeal.reason_miscat")</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">t("appeal.actions_taken")</label>
                  <textarea
                    rows={2}
                    placeholder=t("appeal.placeholder_actions")
                    value={actions}
                    onChange={(e) => sett("appeal.action")s(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white placeholder-slate-500 outline-none focus:border-purple-500/50 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-sm text-slate-300 mb-1 block">t("appeal.language")</label>
                    <select value={language} onChange={(e) => sett("appeal.language")(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white outline-none focus:border-purple-500/50">
                      <option value="en">🇺🇸 English</option>
                      <option value="zh">🇨🇳 t("appeal.lang_zh")</option>
                      <option value="ja">🇯🇵 t("appeal.lang_ja")</option>
                      <option value="de">🇩🇪 t("appeal.lang_de")</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-slate-300 mb-1 block">t("appeal.download")</label>
                    <select value={downloadFormat} onChange={(e) => sett("appeal.download")Format(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white outline-none focus:border-purple-500/50">
                      <option value="txt">.txt</option>
                      <option value="html">.html</option>
                    </select>
                  </div>
                </div>
                <div className="mt-2">
                  <button
                    onClick={handleGenerateAppeal}
                    disabled={!productType || !reason || isGenerating}
                    className="flex-1 rounded-xl bg-purple-600 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 w-full"
                  >
                    <span className="relative inline-flex h-4 w-4 items-center justify-center align-middle">
                      <Loader2 className={`h-4 w-4 ${isGenerating ? 'animate-spin' : 'opacity-0'}`} />
                      <Sparkles className={`h-4 w-4 absolute inset-0 ${isGenerating ? 'opacity-0' : 'opacity-100'}`} />
                    </span>
                    {isGenerating ? t("appeal.generating") : t("appeal.gen_letter")}
                  </button>
                </div>
              </div>

              {/* Generated POA */}
              {appealResult && (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-purple-300">t("appeal.appeal_plan")</span>
                    <div className="flex items-center gap-2">
                      <button onClick={downloadPOA} className="flex items-center gap-1 text-xs text-blue-400 hover:text-white transition">
                        <Upload className="h-3 w-3" /> t("appeal.download")
                      </button>
                      <button onClick={copyPOA} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition">
                        <t("appeal.copy") className="h-3 w-3" /> {copied ? t("appeal.copied") : t("appeal.copy")}
                      </button>
                    </div>
                  </div>
                  {/* t("appeal.pre_review") */}
                  <div className="mb-3 rounded-lg bg-white/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-amber-300">🔍 t("appeal.pre_review")</h4>
                      <button onClick={handlePreReview} disabled={preReviewing} className="text-xs bg-amber-600/30 text-amber-300 hover:bg-amber-600/50 px-2 py-1 rounded transition disabled:opacity-50 flex items-center gap-1">
                        <span className="relative inline-flex h-3 w-3 items-center justify-center align-middle">
                          <Loader2 className={`h-3 w-3 ${preReviewing ? 'animate-spin' : 'opacity-0'}`} />
                          <Shield className={`h-3 w-3 absolute inset-0 ${preReviewing ? 'opacity-0' : 'opacity-100'}`} />
                        </span>
                        {preReviewing ? t("appeal.reviewing") : t("appeal.review_poa")}
                      </button>
                      <span className="text-[10px] text-amber-500/70">t("appeal.beta")</span>
                    </div>
                    {preReviewResult && (
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{verdictEmoji(preReviewResult.overallVerdict || "")}</span>
                          <span className="font-bold text-white">{preReviewResult.overallVerdict?.replace(" ", " ")}</span>
                          <span className="text-xs text-slate-400">Score: <span className="font-bold">{preReviewResult.score}/100</span></span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded bg-black/30 p-2">
                            <div className="text-xs text-slate-400">t("appeal.root_cause")</div>
                            <div className="text-sm font-bold text-white">{preReviewResult.rootCauseQuality?.score || 0}/100</div>
                            {preReviewResult.rootCauseQuality?.weakness && (
                              <div className="text-xs text-slate-500">{preReviewResult.rootCauseQuality.weakness}</div>
                            )}
                          </div>
                          <div className="rounded bg-black/30 p-2">
                            <div className="text-xs text-slate-400">t("appeal.corrective_actions")</div>
                            <div className="text-sm font-bold text-white">{preReviewResult.correctiveActionsQuality?.score || 0}/100</div>
                            {preReviewResult.correctiveActionsQuality?.weakness && (
                              <div className="text-xs text-slate-500">{preReviewResult.correctiveActionsQuality.weakness}</div>
                            )}
                          </div>
                          <div className="rounded bg-black/30 p-2">
                            <div className="text-xs text-slate-400">t("appeal.preventive_measures")</div>
                            <div className="text-sm font-bold text-white">{preReviewResult.preventiveMeasuresQuality?.score || 0}/100</div>
                            {preReviewResult.preventiveMeasuresQuality?.weakness && (
                              <div className="text-xs text-slate-500">{preReviewResult.preventiveMeasuresQuality.weakness}</div>
                            )}
                          </div>
                          <div className="rounded bg-black/30 p-2">
                            <div className="text-xs text-slate-400">t("appeal.tone_structure")</div>
                            <div className="text-sm font-bold text-white">{preReviewResult.toneAndStructure?.score || 0}/100</div>
                          </div>
                        </div>
                        {preReviewResult.mostLikelyRejectiont("appeal.reason") && (
                          <div className="rounded bg-red-500/10 p-2">
                            <div className="text-xs text-red-300 mb-1">⚠ t("appeal.most_likely_rejection")</div>
                            <div className="text-xs text-slate-300">{preReviewResult.mostLikelyRejectiont("appeal.reason")}</div>
                          </div>
                        )}
                        {preReviewResult.redFlags && (preReviewResult.redFlags as string[]).length > 0 && (
                          <div>
                            <div className="text-xs text-red-300 mb-1">🚩 t("appeal.red_flags")</div>
                            {(preReviewResult.redFlags as string[]).map((f: string, i: number) => (
                              <div key={i} className="text-xs text-slate-300">• {f}</div>
                            ))}
                          </div>
                        )}
                        {preReviewResult.topWeaknesses && (preReviewResult.topWeaknesses as string[]).length > 0 && (
                          <div>
                            <div className="text-xs text-orange-300 mb-1">🔧 t("appeal.top_weaknesses")</div>
                            {(preReviewResult.topWeaknesses as string[]).map((w: string, i: number) => (
                              <div key={i} className="text-xs text-slate-300">• {w}</div>
                            ))}
                          </div>
                        )}
                        {preReviewResult.suggestedt("appeal.improvements") && (preReviewResult.suggestedt("appeal.improvements") as string[]).length > 0 && (
                          <div>
                            <div className="text-xs text-green-300 mb-1">💡 t("appeal.improvements")</div>
                            {(preReviewResult.suggestedt("appeal.improvements") as string[]).map((s: string, i: number) => (
                              <div key={i} className="text-xs text-slate-300">• {s}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {appealResult?.rootCause && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-slate-300 mb-1">📋 t("appeal.root_cause")</h4>
                      <p className="text-sm text-slate-300">{appealResult.rootCause}</p>
                    </div>
                  )}
                  {appealResult?.poaTemplate && (
                    <div className="mb-3 rounded-lg bg-white/5 p-3">
                      <h4 className="text-xs font-semibold text-blue-300 mb-2">📝 t("appeal.letter")</h4>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {appealResult.poaTemplate}
                      </div>
                    </div>
                  )}
                  {appealResult.correctiveActions && (appealResult.correctiveActions as string[]).length > 0 && (
                    <div className="mb-2">
                      <h4 className="text-xs font-semibold text-green-300 mb-1">✅ t("appeal.corrective_actions")</h4>
                      {(appealResult.correctiveActions as string[]).map((a, i) => (
                        <p key={i} className="text-xs text-slate-300 mb-1">• {String(a)}</p>
                      ))}
                    </div>
                  )}
                  {appealResult.preventiveMeasures && (
                    <div className="mb-2">
                      <h4 className="text-xs font-semibold text-amber-300 mb-1">🛡️ t("appeal.preventive_measures")</h4>
                      {appealResult.preventiveMeasures!.map((p, i) => (
                        <p key={i} className="text-xs text-slate-300 mb-1">• {p}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========== TAB: APPEAL GUIDE ========== */}
      {activeTab === "guide" && (
        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h1 className="text-2xl font-bold">Amazon t("appeal.tab_guide")</h1>
            <p className="mt-1 text-sm text-slate-400">t("appeal.guide_desc")</p>

            {/* Common t("appeal.removal_reason")s */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold">Common t("appeal.removal_reason")s</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { title: t("appeal.reason_product_safety"), desc: t("appeal.desc_product_safety") },
                  { title: t("appeal.reason_missing_comp"), desc: t("appeal.desc_missing_comp") },
                  { title: t("appeal.reason_labeling"), desc: t("appeal.desc_labeling") },
                  { title: t("appeal.reason_restricted"), desc: t("appeal.desc_restricted") },
                  { title: t("appeal.reason_ip"), desc: t("appeal.desc_ip") },
                  { title: t("appeal.reason_miscat"), desc: t("appeal.desc_miscat") },
                ].map((reason, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <h3 className="font-medium text-white">{reason.title}</h3>
                    </div>
                    <p className="mt-1 pl-6 text-sm text-slate-400">{reason.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* t("appeal.steps") */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold">t("appeal.steps")</h2>
              <div className="mt-4 space-y-3">
                {[
                  { step: 1, title: t("appeal.step_identify_title"), desc: t("appeal.desc_identify") },
                  { step: 2, title: t("appeal.step_gather"), desc: t("appeal.desc_gather") },
                  { step: 3, title: t("appeal.step_develop"), desc: t("appeal.desc_develop") },
                  { step: 4, title: t("appeal.step_write_title"), desc: t("appeal.desc_write") },
                  { step: 5, title: t("appeal.step_submit"), desc: t("appeal.desc_submit") },
                ].map((s) => (
                  <div key={s.step} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-blue-500/30">
                    <div className="flex items-start gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">{s.step}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{s.title}</h3>
                        <p className="mt-1 text-sm text-slate-400">{s.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold">t("appeal.faq")</h2>
              <div className="mt-4 space-y-2">
                {[
                  { q: t("appeal.faq_rejected_q"), a: t("appeal.faq_rejected_a") },
                  { q: t("appeal.faq_time_q"), a: t("appeal.faq_time_a") },
                  { q: t("appeal.faq_lang_q"), a: t("appeal.faq_lang_a") },
                  { q: t("appeal.faq_lawyer_q"), a: t("appeal.faq_lawyer_a") },
                ].map((faq, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                      className="flex w-full items-center justify-between p-4 text-left text-white hover:bg-white/5 transition"
                    >
                      <span className="font-medium text-sm">{faq.q}</span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedFAQ === i ? "rotate-180" : ""}`} />
                    </button>
                    {expandedFAQ === i && (
                      <div className="px-4 pb-4 text-sm text-slate-400 border-t border-white/5 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========== TAB: ARCHIVE ========== */}
      {activeTab === "archive" && (
        <section className="mx-auto mt-6 max-w-7xl px-4 pb-16 sm:px-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h1 className="text-2xl font-bold">Compliance t("appeal.tab_archive")</h1>
            <p className="mt-1 text-sm text-slate-400">t("appeal.archive_desc")</p>

            {history.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-3">t("appeal.history")</h2>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">t("appeal.date")</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">t("appeal.product")</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">t("appeal.reason")</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">t("appeal.status")</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">t("appeal.action")</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-slate-300">{item.date}</td>
                          <td className="px-4 py-3 text-white">{item.product}</td>
                          <td className="px-4 py-3 text-slate-400">{item.reason}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.status === "draft" ? "bg-yellow-500/10 text-yellow-400" :
                              item.status === "submitted" ? "bg-blue-500/10 text-blue-400" :
                              item.status === "approved" ? "bg-green-500/10 text-green-400" :
                              "bg-red-500/10 text-red-400"
                            }`}>
                              {item.status === "draft" ? "📝 t("appeal.draft")" :
                               item.status === "submitted" ? "📤 t("appeal.submitted")" :
                               item.status === "approved" ? "✅ t("appeal.approved")" :
                               "❌ t("appeal.rejected")"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => deleteHistory(item.id)} className="text-xs text-slate-500 hover:text-red-400 transition">t("appeal.delete")</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {history.length === 0 && (
              <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
                <FileText className="mx-auto h-12 w-12 text-slate-500" />
                <h3 className="mt-4 text-lg font-medium text-slate-300">t("appeal.no_records")</h3>
                <p className="mt-2 text-sm text-slate-500">t("appeal.records_saved")</p>
                <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700">
                  <CheckCircle className="h-4 w-4" />
                  t("appeal.start_new")
                </Link>
              </div>
            )}

            {/* Feature placeholders */}
            {history.length === 0 && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Upload, title: t("appeal.upload_docs"), desc: t("appeal.upload_desc") },
                  { icon: Mail, title: t("appeal.notifications"), desc: t("appeal.notif_desc") },
                  { icon: MessageSquare, title: t("appeal.progress"), desc: t("appeal.progress_desc") },
                  { icon: Calendar, title: t("appeal.reminders"), desc: t("appeal.reminder_desc") },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
                      <Icon className="mx-auto h-6 w-6 text-blue-400" />
                      <h3 className="mt-3 font-semibold text-white">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
