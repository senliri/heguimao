import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, Shield, AlertTriangle, CheckCircle, Upload, Mail, MessageSquare, Calendar, ChevronDown, Sparkles, Loader2, Copy, ScanEye, Zap, Brain, Eye } from "lucide-react";
import { analyzeComplianceNotice, reviewPOA, type NoticeAnalysisResult } from "../lib/appeal-analyzer";

export function Appeal() {
  const [activeTab, setActiveTab] = useState<"analyzer" | "guide" | "archive">("analyzer");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [productType, setProductType] = useState("");
  const [reason, setReason] = useState("");
  const [actions, setActions] = useState("");
  const [language, setLanguage] = useState("en");
  const [isGenerating, setIsGenerating] = useState(false);
  const [appealResult, setAppealResult] = useState<{ rootCause?: string; poaTemplate?: string; correctiveActions?: string[]; preventiveMeasures?: string[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("txt");
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

  // Smart Appeal Analyzer state
  const [reviewNotice, setReviewNotice] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<NoticeAnalysisResult | null>(null);
  const [preReviewResult, setPreReviewResult] = useState<any>(null);
  const [preReviewing, setPreReviewing] = useState(false);

  const handleGenerateAppeal = async () => {
    if (!productType || !reason) return;
    setIsGenerating(true);
    setCopied(false);
    try {
      const languageLabel: Record<string, string> = { en: "English", zh: "中文", ja: "日本語", de: "Deutsch" };
      const workerUrl = import.meta.env.VITE_WORKER_URL || "https://heguimao-api.senliri028.workers.dev";
      const response = await fetch(`${workerUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "appeal",
          prompt: `You are an Amazon appeal expert. Generate an appeal plan based on the user's listing removal reason.\n\nProduct: ${productType}\nRemoval reason: ${reason}\nActions taken: ${actions || "Not provided"}\nOutput language: ${languageLabel[language] || "English"}\n\nOutput format (strict JSON):\n{\n  "rootCause": "Root cause analysis",\n  "correctiveActions": ["Action 1", "Action 2"],\n  "preventiveMeasures": ["Measure 1", "Measure 2"],\n  "poaTemplate": "Complete appeal letter template",\n  "checklist": ["Document 1", "Document 2"],\n  "tips": "Appeal tips"\n}`,
          message: "Please generate a complete appeal plan",
        }),
      });

      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      const reply = data.reply || data.content || "";
      const cleaned = reply.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI returned unexpected format");
      setAppealResult(JSON.parse(jsonMatch[0]));
      setPreReviewResult(null);
      setHistory(prev => [{
        id: Date.now(),
        product: productType,
        reason: reason,
        date: new Date().toLocaleDateString("en-US"),
        status: "submitted" as const,
      }, ...prev]);
    } catch (err) {
      console.error("Appeal generation failed:", err);
      alert("Appeal generation failed. Please try again.");
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
      console.error("Analysis failed:", err);
      alert("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePreReview = async () => {
    if (!appealResult) return;
    setPreReviewing(true);
    try {
      const correctiveActions = (appealResult.correctiveActions as string[])?.join("\n") || ["Not provided"];
      const preventiveMeasures = (appealResult.preventiveMeasures as string[])?.join("\n") || ["Not provided"];
      const result = await reviewPOA(
        productType || "Unknown",
        reason || "Unknown",
        appealResult.rootCause || "Not provided",
        Array.isArray(correctiveActions) ? correctiveActions : [correctiveActions],
        Array.isArray(preventiveMeasures) ? preventiveMeasures : [preventiveMeasures],
        appealResult.poaTemplate || "Not provided"
      );
      setPreReviewResult(result);
    } catch (err) {
      console.error("Pre-review failed:", err);
      alert("Pre-review failed. Please try again.");
    } finally {
      setPreReviewing(false);
    }
  };

  const copyPOA = () => {
    if (!appealResult?.poaTemplate) return;
    const text = typeof appealResult.poaTemplate === "string" ? appealResult.poaTemplate : String(appealResult.poaTemplate);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPOA = () => {
    if (!appealResult?.poaTemplate) return;
    const text = typeof appealResult.poaTemplate === "string" ? appealResult.poaTemplate : String(appealResult.poaTemplate);
    const rootCause = appealResult.rootCause ? `\n\nROOT CAUSE ANALYSIS:\n${appealResult.rootCause}\n\n` : "";
    const actionsList = appealResult.correctiveActions ? `\n\nCORRECTIVE ACTIONS:\n${(appealResult.correctiveActions as string[]).join("\n")}\n\n` : "";
    const preventive = appealResult.preventiveMeasures ? `\n\nPREVENTIVE MEASURES:\n${(appealResult.preventiveMeasures as string[]).join("\n")}\n\n` : "";
    const fullText = `Plan of Action (POA)\nProduct: ${productType}\nRemoval Reason: ${reason}${rootCause}${actionsList}${preventive}${text}`;
    
    if (downloadFormat === "html") {
      const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>POA - ${productType}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6;}h1{color:#1e40af;}h2{color:#7c3aed;border-bottom:1px solid #e5e7eb;padding-bottom:8px;}p{margin:8px 0;}</style></head><body><h1>Plan of Action for ${productType}</h1><p><strong>Removal Reason:</strong> ${reason}</p><h2>Root Cause</h2>${rootCause}<h2>Corrective Actions</h2>${actionsList}<h2>Preventive Measures</h2>${preventive}${text}</body></html>`;
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
            Smart Analyzer
          </button>
          <button
            onClick={() => handleTabChange("guide")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition ${activeTab === "guide" ? "bg-purple-600 text-white" : "border border-white/10 text-slate-400 hover:text-white"}`}
          >
            <Shield className="h-4 w-4" />
            Appeal Guide
          </button>
          <button
            onClick={() => handleTabChange("archive")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition ${activeTab === "archive" ? "bg-blue-600 text-white" : "border border-white/10 text-slate-400 hover:text-white"}`}
          >
            <FileText className="h-4 w-4" />
            Archive
          </button>
        </div>
      </section>

      {/* ========== TAB: SMART ANALYZER ========== */}
      {activeTab === "analyzer" && (
        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-purple-500/5 p-6">
            <h1 className="text-2xl font-bold text-cyan-300">⚡ Smart Appeal Analyzer</h1>
            <p className="mt-1 text-sm text-slate-400">Paste your Amazon compliance notice — AI identifies the issue, analyzes severity, and auto-generates a targeted appeal letter.</p>

            {/* Steps */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-cyan-500/10 px-3 py-2">
                <div className="text-xs font-bold text-cyan-300">1</div>
                <div className="text-xs text-slate-300">Paste notice</div>
              </div>
              <div className="rounded-lg bg-cyan-500/10 px-3 py-2">
                <div className="text-xs font-bold text-cyan-300">2</div>
                <div className="text-xs text-slate-300">AI analyzes issue</div>
              </div>
              <div className="rounded-lg bg-cyan-500/10 px-3 py-2">
                <div className="text-xs font-bold text-cyan-300">3</div>
                <div className="text-xs text-slate-300">Fill form & generate POA</div>
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
                {analyzing ? "Analyzing..." : "Analyze Review Notice"}
              </button>

              {/* Analysis Result */}
              {analysisResult && (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 space-y-4">
                  <div className="flex gap-3 flex-wrap">
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <div className="text-xs text-slate-400">Compliance Area</div>
                      <div className="text-sm font-bold text-white">{analysisResult.complianceDimension || "—"}</div>
                    </div>
                    <div className="rounded-lg px-3 py-2">
                      <div className="text-xs text-slate-400">Severity</div>
                      <span className={`text-sm font-bold ${severityColor(analysisResult.severity || "")}`}>
                        {analysisResult.severity?.toUpperCase() || "—"}
                      </span>
                    </div>
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <div className="text-xs text-slate-400">Reviewer</div>
                      <div className="text-sm font-bold text-white">{analysisResult.reviewerType || "—"}</div>
                    </div>
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <div className="text-xs text-slate-400">Confidence</div>
                      <div className="text-sm font-bold text-white">{analysisResult.confidence || "—"}</div>
                    </div>
                  </div>
                  {analysisResult.specificIssue && (
                    <div>
                      <div className="text-xs font-semibold text-cyan-300 mb-1">🎯 Specific Issue</div>
                      <div className="text-sm text-slate-300">{analysisResult.specificIssue}</div>
                    </div>
                  )}
                  {analysisResult.amazonPerspective && (
                    <div>
                      <div className="text-xs font-semibold text-blue-300 mb-1">🤖 Amazon's View</div>
                      <div className="text-sm text-slate-300">{analysisResult.amazonPerspective}</div>
                    </div>
                  )}
                  {analysisResult.requestedEvidence && (analysisResult.requestedEvidence as string[]).length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-yellow-300 mb-1">📋 Requested Evidence</div>
                      <ul className="space-y-1">
                        {(analysisResult.requestedEvidence as string[]).map((e, i) => (
                          <li key={i} className="text-xs text-slate-300">• {e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResult.recommendedStrategy && (
                    <div>
                      <div className="text-xs font-semibold text-green-300 mb-1">💡 Strategy</div>
                      <div className="text-sm text-slate-300">{analysisResult.recommendedStrategy}</div>
                    </div>
                  )}
                  {analysisResult.followUpQuestions && (analysisResult.followUpQuestions as string[]).length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-purple-300 mb-1">❓ Info Needed for POA</div>
                      <ul className="space-y-1">
                        {(analysisResult.followUpQuestions as string[]).map((q, i) => (
                          <li key={i} className="text-xs text-slate-300">• {q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResult.similarPastCases && (analysisResult.similarPastCases as string[]).length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-amber-300 mb-1">📚 Similar Cases</div>
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
                      <span className="text-xs font-semibold text-green-300">Analysis Complete</span>
                    </div>
                    <p className="text-xs text-slate-400">Fill in product details below to generate a targeted appeal letter.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Product Form + POA Generator */}
            <div className="mt-6 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-blue-500/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-purple-300">AI Appeal Letter Generator</h2>
                {analysisResult && (
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Smart analysis applied
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Product Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Bluetooth speakers, children plush toys"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white placeholder-slate-500 outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Removal Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white outline-none focus:border-purple-500/50"
                  >
                    <option value="">Select a removal reason</option>
                    <option value="Product safety complaint">Product safety complaint</option>
                    <option value="Missing compliance documents">Missing compliance documents</option>
                    <option value="Non-compliant product labeling">Non-compliant product labeling</option>
                    <option value="Restricted product violation">Restricted product violation</option>
                    <option value="Intellectual property complaint">Intellectual property complaint</option>
                    <option value="Misclassified / wrong category">Misclassified / wrong category</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Actions Taken (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Contacted supplier for latest test report, updated labels"
                    value={actions}
                    onChange={(e) => setActions(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white placeholder-slate-500 outline-none focus:border-purple-500/50 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-sm text-slate-300 mb-1 block">Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white outline-none focus:border-purple-500/50">
                      <option value="en">🇺🇸 English</option>
                      <option value="zh">🇨🇳 Chinese</option>
                      <option value="ja">🇯🇵 Japanese</option>
                      <option value="de">🇩🇪 Deutsch</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-slate-300 mb-1 block">Download</label>
                    <select value={downloadFormat} onChange={(e) => setDownloadFormat(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white outline-none focus:border-purple-500/50">
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
                    {isGenerating ? "Generating..." : "Generate Appeal Letter"}
                  </button>
                </div>
              </div>

              {/* Generated POA */}
              {appealResult && (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-purple-300">Appeal Plan</span>
                    <div className="flex items-center gap-2">
                      <button onClick={downloadPOA} className="flex items-center gap-1 text-xs text-blue-400 hover:text-white transition">
                        <Upload className="h-3 w-3" /> Download
                      </button>
                      <button onClick={copyPOA} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition">
                        <Copy className="h-3 w-3" /> {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                  {/* Pre-submission Review */}
                  <div className="mb-3 rounded-lg bg-white/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-amber-300">🔍 Pre-submission Review</h4>
                      <button onClick={handlePreReview} disabled={preReviewing} className="text-xs bg-amber-600/30 text-amber-300 hover:bg-amber-600/50 px-2 py-1 rounded transition disabled:opacity-50 flex items-center gap-1">
                        <span className="relative inline-flex h-3 w-3 items-center justify-center align-middle">
                          <Loader2 className={`h-3 w-3 ${preReviewing ? 'animate-spin' : 'opacity-0'}`} />
                          <Shield className={`h-3 w-3 absolute inset-0 ${preReviewing ? 'opacity-0' : 'opacity-100'}`} />
                        </span>
                        {preReviewing ? "Reviewing..." : "Review POA"}
                      </button>
                      <span className="text-[10px] text-amber-500/70">Beta</span>
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
                            <div className="text-xs text-slate-400">Root Cause</div>
                            <div className="text-sm font-bold text-white">{preReviewResult.rootCauseQuality?.score || 0}/100</div>
                            {preReviewResult.rootCauseQuality?.weakness && (
                              <div className="text-xs text-slate-500">{preReviewResult.rootCauseQuality.weakness}</div>
                            )}
                          </div>
                          <div className="rounded bg-black/30 p-2">
                            <div className="text-xs text-slate-400">Corrective Actions</div>
                            <div className="text-sm font-bold text-white">{preReviewResult.correctiveActionsQuality?.score || 0}/100</div>
                            {preReviewResult.correctiveActionsQuality?.weakness && (
                              <div className="text-xs text-slate-500">{preReviewResult.correctiveActionsQuality.weakness}</div>
                            )}
                          </div>
                          <div className="rounded bg-black/30 p-2">
                            <div className="text-xs text-slate-400">Preventive Measures</div>
                            <div className="text-sm font-bold text-white">{preReviewResult.preventiveMeasuresQuality?.score || 0}/100</div>
                            {preReviewResult.preventiveMeasuresQuality?.weakness && (
                              <div className="text-xs text-slate-500">{preReviewResult.preventiveMeasuresQuality.weakness}</div>
                            )}
                          </div>
                          <div className="rounded bg-black/30 p-2">
                            <div className="text-xs text-slate-400">Tone & Structure</div>
                            <div className="text-sm font-bold text-white">{preReviewResult.toneAndStructure?.score || 0}/100</div>
                          </div>
                        </div>
                        {preReviewResult.mostLikelyRejectionReason && (
                          <div className="rounded bg-red-500/10 p-2">
                            <div className="text-xs text-red-300 mb-1">⚠ Most Likely Rejection Reason</div>
                            <div className="text-xs text-slate-300">{preReviewResult.mostLikelyRejectionReason}</div>
                          </div>
                        )}
                        {preReviewResult.redFlags && (preReviewResult.redFlags as string[]).length > 0 && (
                          <div>
                            <div className="text-xs text-red-300 mb-1">🚩 Red Flags</div>
                            {(preReviewResult.redFlags as string[]).map((f: string, i: number) => (
                              <div key={i} className="text-xs text-slate-300">• {f}</div>
                            ))}
                          </div>
                        )}
                        {preReviewResult.topWeaknesses && (preReviewResult.topWeaknesses as string[]).length > 0 && (
                          <div>
                            <div className="text-xs text-orange-300 mb-1">🔧 Top Weaknesses</div>
                            {(preReviewResult.topWeaknesses as string[]).map((w: string, i: number) => (
                              <div key={i} className="text-xs text-slate-300">• {w}</div>
                            ))}
                          </div>
                        )}
                        {preReviewResult.suggestedImprovements && (preReviewResult.suggestedImprovements as string[]).length > 0 && (
                          <div>
                            <div className="text-xs text-green-300 mb-1">💡 Improvements</div>
                            {(preReviewResult.suggestedImprovements as string[]).map((s: string, i: number) => (
                              <div key={i} className="text-xs text-slate-300">• {s}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {appealResult?.rootCause && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-slate-300 mb-1">📋 Root Cause</h4>
                      <p className="text-sm text-slate-300">{appealResult.rootCause}</p>
                    </div>
                  )}
                  {appealResult?.poaTemplate && (
                    <div className="mb-3 rounded-lg bg-white/5 p-3">
                      <h4 className="text-xs font-semibold text-blue-300 mb-2">📝 Appeal Letter</h4>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {appealResult.poaTemplate}
                      </div>
                    </div>
                  )}
                  {appealResult.correctiveActions && (appealResult.correctiveActions as string[]).length > 0 && (
                    <div className="mb-2">
                      <h4 className="text-xs font-semibold text-green-300 mb-1">✅ Corrective Actions</h4>
                      {(appealResult.correctiveActions as string[]).map((a, i) => (
                        <p key={i} className="text-xs text-slate-300 mb-1">• {String(a)}</p>
                      ))}
                    </div>
                  )}
                  {appealResult.preventiveMeasures && (
                    <div className="mb-2">
                      <h4 className="text-xs font-semibold text-amber-300 mb-1">🛡️ Preventive Measures</h4>
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
            <h1 className="text-2xl font-bold">Amazon Appeal Guide</h1>
            <p className="mt-1 text-sm text-slate-400">Product delisted or received a compliance warning? Follow these steps to prepare your appeal materials.</p>

            {/* Common Removal Reasons */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold">Common Removal Reasons</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { title: "Product Safety Complaint", desc: "Customer complaint about product safety, Amazon requires compliance proof" },
                  { title: "Missing Compliance Documents", desc: "Missing mandatory certification documents like FDA/CE/FCC" },
                  { title: "Non-Compliant Product Labeling", desc: "Missing warning labels, ingredient lists, or compliance marks" },
                  { title: "Restricted Product Violation", desc: "Product categorized as restricted but without submitted credentials" },
                  { title: "Intellectual Property Complaint", desc: "Patent, trademark, or copyright infringement complaint" },
                  { title: "Misclassified / Wrong Category", desc: "Product wrongly placed in a category requiring additional certification" },
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

            {/* Appeal Steps */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold">Appeal Steps</h2>
              <div className="mt-4 space-y-3">
                {[
                  { step: 1, title: "Identify Removal Reason", desc: "Log into Amazon Seller Central, check Performance Notifications for the specific removal reason." },
                  { step: 2, title: "Gather Compliance Documents", desc: "Prepare test reports, certification certificates, product images, supplier invoices, etc." },
                  { step: 3, title: "Develop Corrective Action Plan", desc: "Describe corrective measures already taken: updated labels, switched suppliers, improved production process." },
                  { step: 4, title: "Write Appeal Letter", desc: "Format: include Plan of Action (POA), root cause analysis, corrective actions, and preventive measures." },
                  { step: 5, title: "Submit Appeal", desc: "Submit through Seller Central appeal channel. Ensure all files are PDF format and clearly readable." },
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
              <h2 className="text-lg font-semibold">Appeal FAQ</h2>
              <div className="mt-4 space-y-2">
                {[
                  { q: "What if the appeal is rejected?", a: "First rejection is common. Read Amazon's rejection reason carefully, supplement materials, and resubmit. You can usually appeal up to 3 times." },
                  { q: "How long does an appeal take?", a: "Usually 1-2 weeks for a response; complex cases may take 2-4 weeks. Do not repeatedly submit appeals within 24 hours." },
                  { q: "Must the appeal letter be in English?", a: "Yes, recommended for US/EU markets. For Japan, you can attach a Japanese translation." },
                  { q: "Do I need a lawyer?", a: "General compliance issues can be handled yourself. For legal disputes or intellectual property conflicts, consult a professional attorney." },
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
            <h1 className="text-2xl font-bold">Compliance Archive</h1>
            <p className="mt-1 text-sm text-slate-400">Manage your product compliance records and historical check reports</p>

            {history.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-3">Appeal History</h2>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Reason</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Action</th>
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
                              {item.status === "draft" ? "📝 Draft" :
                               item.status === "submitted" ? "📤 Submitted" :
                               item.status === "approved" ? "✅ Approved" :
                               "❌ Rejected"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => deleteHistory(item.id)} className="text-xs text-slate-500 hover:text-red-400 transition">Delete</button>
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
                <h3 className="mt-4 text-lg font-medium text-slate-300">No Appeal Records Yet</h3>
                <p className="mt-2 text-sm text-slate-500">Appeal plans will be saved here automatically after generation</p>
                <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700">
                  <CheckCircle className="h-4 w-4" />
                  Start a New Compliance Check
                </Link>
              </div>
            )}

            {/* Feature placeholders */}
            {history.length === 0 && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Upload, title: "Upload Documents", desc: "Upload test reports and certification certificates" },
                  { icon: Mail, title: "Historical Notifications", desc: "Save Amazon performance notifications and warnings" },
                  { icon: MessageSquare, title: "Appeal Progress", desc: "Track appeal status and Amazon responses" },
                  { icon: Calendar, title: "Expiry Reminders", desc: "Set certification expiry reminders" },
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
