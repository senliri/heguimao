import { useSearchParams, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  AlertTriangle, CheckCircle, FileText, Download, ArrowLeft, Info,
  Shield, ClipboardList, ArrowRight, Loader2, Clock, Sparkles,
  Zap, TrendingUp, Target, Share2, Copy, Send,
} from "lucide-react";
import {
  productCategories,
  subCategories,
  markets,
  categoryComplianceData,
  type ComplianceItem,
} from "../data/site";
import { inferProductProfile, generateRecommendations, type RecommendationItem } from "../lib/recommend";
import { generateDiagnosis, isProfileComplete, type ProductProfile, type ProductProfile as AgentProfile } from "../lib/agent";
import type { DiagnosisResult } from "../lib/agent";
import { t, store } from "../lib/store";

// ============================================
// Hybrid merge: AI reasoning + structured data fields
// ============================================
function mergeAiWithStructuredData(
  aiResult: DiagnosisResult,
  rawCompliance: ComplianceItem[],
  marketId: string,
  profile: Returnt("report.cert_type")<typeof inferProductProfile>,
  catId: string
): RecommendationItem[] {
  // Build a lookup of AI recommendations by certification name (case-insensitive)
  const aiMap = new Map<string, RecommendationItem>();
  const recs = Array.isArray(aiResult.recommendations) ? aiResult.recommendations : [];
  recs.forEach((r) => {
    aiMap.set(r.name.toLowerCase(), {
      name: r.name,
      required: r.required,
      desc: r.desc || r.reason || "",
      severity: r.severity,
      reason: r.reason || "",
      estimatedCost: r.estimatedCost || "TBD",
      estimatedTime: r.estimatedTime || "TBD",
      action: r.action || "",
      needsThirdParty: r.needsThirdParty ?? false,
      confidence: r.confidence || "medium",
      priorityLabel: r.priorityLabel || "🟡 Recommended — Improves compliance",
    });
  });

  // Generate structured recommendations
  const structured = generateRecommendations(rawCompliance, marketId, profile, catId);
  const structuredMap = new Map<string, RecommendationItem>();
  structured.forEach((r) => {
    structuredMap.set(r.name.toLowerCase(), r);
  });

  const merged: RecommendationItem[] = [];

  for (const structItem of structured) {
    const aiItem = aiMap.get(structItem.name.toLowerCase());

    if (aiItem) {
      // AI already provided this certification — use AI's reasoning, keep structured data fields
      merged.push({
        ...structItem,
        reason: aiItem.reason || structItem.reason,
        estimatedCost: aiItem.estimatedCost || structItem.estimatedCost || "TBD",
      });
    } else {
      // Structured data has it but AI didn't — use structured fully
      merged.push(structItem);
    }
  }

  // Add any AI recommendations not in structured data (e.g., niche AI-discovered ones)
  for (const aiItem of recs) {
    const key = aiItem.name.toLowerCase();
    if (!structuredMap.has(key)) {
      merged.push({
        name: aiItem.name,
        required: aiItem.required,
        desc: aiItem.desc || aiItem.reason || "",
        severity: aiItem.severity || "medium",
        reason: aiItem.reason || "",
        estimatedCost: aiItem.estimatedCost || "TBD",
        estimatedTime: aiItem.estimatedTime || "TBD",
        action: aiItem.action || "",
        needsThirdParty: aiItem.needsThirdParty ?? false,
        confidence: aiItem.confidence || "medium",
        priorityLabel: aiItem.priorityLabel || "🟡 Recommended — Improves compliance",
      });
    }
  }

  // Sort: high confidence first, then by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  const confidenceOrder = { high: 0, medium: 1, low: 2 };
  merged.sort((a, b) => {
    const confDiff = confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
    if (confDiff !== 0) return confDiff;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return merged;
}

export function Report() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const catId = searchParams.get("cat") || "";
  const subId = searchParams.get("sub") || "";
  const marketId = (searchParams.get("market") || "us").toLowerCase();
  const isAiMode = searchParams.get("ai") === "true";
  const aiProduct = searchParams.get("product") || "";
  const [activeTab, setActiveTab] = useState<"recommend" | "compliance" | "prerequisites" | "action">("recommend");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<DiagnosisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  // Email functionality states
  const [userEmail, setUserEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  const category = productCategories.find((c) => c.id === catId);
  const sub = subCategories[catId]?.find((s) => s.id === subId);
  const market = markets.find((m) => m.id === marketId);

  // Fetch compliance data by category x market
  // Fallback chain: category→market, then category→us, then _care variant,
  // then _care us, then electronics, then empty
  const rawCompliance =
    categoryComplianceData[catId]?.[marketId]
    || (categoryComplianceData[catId + "_care"]?.[marketId] ?? null) // only if _care exists for this cat
    || categoryComplianceData[catId]?.["us"]
    || (categoryComplianceData[catId + "_care"]?.["us"] ?? null)
    || categoryComplianceData["electronics"]?.[marketId]
    || categoryComplianceData["electronics"]?.["us"]
    || [];

  // Smart recommendations based on product features
  const profile = inferProductProfile(catId, subId);
  const recommendations = generateRecommendations(rawCompliance, marketId, profile, catId);

  // AI mode: generate diagnosis from chat conversation
  useEffect(() => {
    if (!isAiMode || !aiProduct) return;

    const stateProfile = location.state?.profile as ProductProfile | undefined;
    const marketMap: Record<string, string> = { US: "us", EU: "eu", UK: "uk", JP: "jp", CA: "ca", AU: "au" };
    const mappedMarket = marketMap[marketId.toUpperCase()] || marketId;

    const runDiagnosis = async () => {
      setAiLoading(true);
      try {
        const useProfile = stateProfile || {
          product_type: aiProduct,
          category: "electronics",
          has_battery: null,
          battery_capacity: null,
          has_wireless: null,
          is_children: null,
          food_contact: null,
          wearable: null,
          medical: null,
          electrical: null,
          contains_chemicals: null,
          contains_magnets: null,
          precision: null,
          has_flammable: null,
        } as ProductProfile;

        const aiResultData = await generateDiagnosis(useProfile, mappedMarket, aiProduct);

        // Hybrid merge: AI provides reasoning + summary, structured data provides cost/time/details
        const mergedRecommendations = mergeAiWithStructuredData(
          aiResultData,
          rawCompliance,
          marketId,
          profile,
          catId
        );

        setAiResult({
          ...aiResultData,
          recommendations: mergedRecommendations,
        });
        // Save to history
        store.saveReport({
          productt("report.cert_type"): aiProduct,
          market: marketId,
          profile: { ...(useProfile as Record<string, unknown>) },
          diagnosis: { ...aiResultData },
        });
      } catch (err) {
        console.error(t("report.ai_diag_failed"), err);
      } finally {
        setAiLoading(false);
      }
    };

    runDiagnosis();
  }, [isAiMode, aiProduct, marketId, location.state]);

  // In AI mode, fall back to structured recommendations if AI fails
  const displayRecommendations = isAiMode && aiResult
    ? aiResult.recommendations as RecommendationItem[]
    : isAiMode && !aiResult && !aiLoading
    ? recommendations
    : recommendations;
  const highCount = displayRecommendations.filter((i) => i.severity === "high" && i.required).length;
  const mediumCount = displayRecommendations.filter((i) => i.severity === "medium").length;
  const recommendCount = displayRecommendations.filter((r) => r.confidence === "high").length;

  // PDF Export
  const handleExportPDF = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      doc.text("Compliance Check Report", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `${market?.label || "US"} · ${category?.label || "General"}${sub ? ` · ${sub.label}` : ""}`,
        14,
        30
      );
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 37);

      const summary = isAiMode && aiResult ? aiResult.summary : "";
          // AI recommendation summary
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("AI Smart Recommendations", 14, 50);
      doc.setFontSize(9);
      doc.setTextColor(60);
      if (summary) {
        doc.text(summary, 14, 58, { maxWidth: 180 });
      } else {
        doc.text(`Recommended actions: ${recommendCount} (high priority)`, 14, 58);
      }
      doc.text(`High-risk mandatory items: ${highCount}`, 14, 65);

      // Table
      const tableData = displayRecommendations.map((item) => [
        item.name,
        item.required ? "Mandatory" : "Recommended",
        item.severity === "high" ? "High" : item.severity === "medium" ? "Medium" : "Low",
        item.reason,
        item.action,
      ]);

      autoTable(doc, {
        startY: 72,
        head: [["Certification", "Type", "Level", "AI Reason", "Action"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 7 },
      });

      // Disclaimer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        "Disclaimer: This report is for reference only and does not constitute legal advice. Compliance requirements may change. Please refer to the latest information from regulatory authorities.",
        14,
        doc.internal.pageSize.height - 10
      );

      doc.save(`compliance_cat_report_${marketId}_${catId}.pdf`);
    } catch (err) {
      console.error(t("report.pdf_export_failed"), err);
      alert(t("report.pdf_export_retry"));
    } finally {
      setIsGenerating(false);
    }
  };

  // Share functionality
  const handleShare = async () => {
    const shareText = `🐱 Compliance Cat Report\n\nProduct: ${aiProduct || category?.label || "General"}\nMarket: ${market?.label || "US"}\nTotal requirements: ${displayRecommendations.length}\nHigh priority: ${highCount}\n\nGenerated by Compliance Cat - AI Compliance Checker`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Compliance Report: ${category?.label || "General"} - ${market?.label}`,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n\n${window.location.href}`);
        alert(t("report.share_copy_ok"));
      } catch (err) {
        alert(t("report.share_fail"));
      }
    }
  };


  // Send report via email (mailto fallback — opens user's default email client)
  const handleSendEmail = () => {
    if (!userEmail || isSendingEmail || displayRecommendations.length === 0) return;
    
    setIsSendingEmail(true);
    setEmailError('');
    
    try {
      const productName = isAiMode && aiProduct ? aiProduct : category?.label || 'General Product';
      const marketName = market?.label || 'US';
      
      // Build a plain-text summary for the mailto body
      const recommendations = displayRecommendations.map((item, i) => {
        const req = item.required ? ' [REQUIRED]' : '';
        return `${i+1}. ${item.name}${req} — ${item.reason}\n   Severity: ${item.severity} | Time: ${item.estimatedTime} | Cost: ${item.estimatedCost}`;
      }).join('\n\n');
      
      const body = `t("report.title")\n` +
        `Product: ${productName}\n` +
        `Market: ${marketName}\n` +
        `Date: ${new Date().toLocaleDateString()}\n\n` +
        `Recommendations:\n${recommendations}\n\n` +
        `---\nThis report was generated by Compliance Cat (AI Amazon Compliance Checker).\nFor detailed analysis, visit the app.`;
      
      const subject = encodeURIComponent(`Compliance Report: ${productName} (${marketName})`);
      const mailtoBody = encodeURIComponent(body);
      
      // Open the user's default email client
      window.location.href = `mailto:${userEmail}?subject=${subject}&body=${mailtoBody}`;
      
      setEmailSent(true);
      setTimeout(() => {
        setEmailSent(false);
        setUserEmail('');
      }, 5000);
    } catch (err) {
      console.error(t("report.email_send_fail"), err);
      setEmailError(err instanceof Error ? err.message : 't("report.email_client_fail")');
    } finally {
      setIsSendingEmail(false);
    }
  };
  return (
    <div>
      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          {catId ? (
            <>
              <Link to={`/category?cat=${catId}`} className="hover:text-white">{category?.label || "Category"}</Link>
              <span>/</span>
              {subId && (
                <Link to={`/market?cat=${catId}&sub=${subId}`} className="hover:text-white">{market?.label || "Market"}</Link>
              )}
              <span className="text-slate-200">Report</span>
            </>
          ) : (
            <span className="text-slate-200">Report</span>
          )}
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold">t("report.title")</h1>
                <p className="text-sm text-slate-400">
                  {market?.flag} {market?.label || "US"}
                  {isAiMode && aiProduct && (
                    <span className="ml-1">
                      📦 {aiProduct}
                    </span>
                  )}
                  {category && !isAiMode && (
                    <> · {category.icon} {category.label}</>
                  )}
                  {sub && !isAiMode && (
                    <> · {sub.label}</>
                  )}
                  {!category && !isAiMode && <span className="text-amber-400">⚠ t("report.no_cat_warn")</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setActiveTab("recommend")} className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm transition ${activeTab === "recommend" ? "bg-blue-600 text-white" : "border border-white/10 text-slate-400 hover:text-white"}`}>
                <Sparkles className="h-3.5 w-3.5" />
                t("report.ai_recs_tab")
              </button>
              <button onClick={() => setActiveTab("compliance")} className={`rounded-xl px-4 py-2 text-sm transition ${activeTab === "compliance" ? "bg-blue-600 text-white" : "border border-white/10 text-slate-400 hover:text-white"}`}>
                t("report.checklist")
              </button>
              <button onClick={() => setActiveTab("prerequisites")} className={`rounded-xl px-4 py-2 text-sm transition ${activeTab === "prerequisites" ? "bg-blue-600 text-white" : "border border-white/10 text-slate-400 hover:text-white"}`}>
                <Shield className="h-3.5 w-3.5" />
                t("report.market_prereq")
              </button>
              <button onClick={() => setActiveTab("action")} className={`rounded-xl px-4 py-2 text-sm transition ${activeTab === "action" ? "bg-blue-600 text-white" : "border border-white/10 text-slate-400 hover:text-white"}`}>
                t("report.action_plan")
              </button>
            </div>
          </div>

          {/* t("report.ai_smart") Panel */}
          <div className="mt-5 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-blue-500/5 p-4">
            {isAiMode && aiLoading && (
              <div className="flex items-center gap-2 text-sm text-purple-300 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                t("report.analyzing")
              </div>
            )}
            {isAiMode && aiResult && (
              <>
                <p className="text-sm text-purple-300 mb-2">
                  {aiResult.summary}
                </p>
                {aiResult.warnings && aiResult.warnings.length > 0 && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5">
                    {aiResult.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-red-300">
                        <span className="shrink-0">⚠</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-300">t("report.ai_smart")</span>
              <span className="text-xs text-purple-400/70 ml-auto">t("report.auto_match")</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg bg-white/5 px-3 py-2 text-center">
                <p className="text-lg font-bold text-purple-300">{recommendCount}</p>
                <p className="text-xs text-purple-400/70">t("report.priority")</p>
              </div>
              <div className="rounded-lg bg-white/5 px-3 py-2 text-center">
                <p className="text-lg font-bold text-red-400">{highCount}</p>
                <p className="text-xs text-red-400/70">t("report.high_risk")</p>
              </div>
              <div className="rounded-lg bg-white/5 px-3 py-2 text-center">
                <p className="text-lg font-bold text-amber-400">{mediumCount}</p>
                <p className="text-xs text-amber-400/70">t("report.med_risk")</p>
              </div>
              <div className="rounded-lg bg-white/5 px-3 py-2 text-center">
                <p className="text-lg font-bold text-blue-400">{rawCompliance.length}</p>
                <p className="text-xs text-blue-400/70">t("report.total_items")</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* t("report.ai_recs_tab") Tab */}
      {activeTab === "recommend" && (
        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-semibold">t("report.ai_recs")</h2>
              <span className="ml-auto text-xs text-slate-500">{isAiMode ? `AI Diagnosis · ${aiProduct}` : `Based on ${category?.label}${sub ? ` + ${sub.label}` : ""} in ${market?.label}`}</span>
            </div>

            {isAiMode && aiLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-400" />
                <p className="mt-3 text-slate-400">t("report.generating")</p>
              </div>
            ) : displayRecommendations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
                <Info className="mx-auto h-10 w-10 text-slate-500" />
                <p className="mt-3 text-slate-400">t("report.no_data")</p>
                <Link to="/" className="mt-4 inline-flex items-center gap-1 rounded-xl bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700">
                  t("report.return_home")
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {displayRecommendations.filter(r => r.confidence === "high").length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-semibold text-yellow-300">🔴 t("report.priority") — These items have the biggest impact</span>
                    </div>
                    <div className="space-y-2">
                      {displayRecommendations.filter(r => r.confidence === "high").map((item, i) => (
                        <RecommendationCard key={`high-${i}`} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {displayRecommendations.filter(r => r.confidence === "medium").length > 0 && (
                  <div className="mt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-semibold text-amber-300">🟡 t("report.recommended") — Improve compliance completeness</span>
                    </div>
                    <div className="space-y-2">
                      {displayRecommendations.filter(r => r.confidence === "medium").map((item, i) => (
                        <RecommendationCard key={`med-${i}`} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {displayRecommendations.filter(r => r.confidence === "low").length > 0 && (
                  <div className="mt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-semibold text-green-300">t("report.optional")</span>
                    </div>
                    <div className="space-y-2">
                      {displayRecommendations.filter(r => r.confidence === "low").map((item, i) => (
                        <RecommendationCard key={`low-${i}`} item={item} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleExportPDF}
                disabled={isGenerating || displayRecommendations.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isGenerating ? t("report.generating") : t("report.export_pdf")}
              </button>
              <button
                onClick={handleShare}
                disabled={displayRecommendations.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                <Share2 className="h-4 w-4" />
                t("report.share")
              </button>
              <Link to="/appeal" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700">
                <ClipboardList className="h-4 w-4" />
                t("report.appeal_guide")
              </Link>
            </div>

            {/* Email Notification Section */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-2 mb-3">
                <Send className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">t("report.send_email")</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                t("report.send_email_desc")
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => { setUserEmail(e.target.value); setEmailError(''); }}
                  placeholder="your@email.com"
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  disabled={displayRecommendations.length === 0}
                />
                <button
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || displayRecommendations.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : emailSent ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      t("report.sent")
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      t("report.open_email")
                    </>
                  )}
                </button>
              </div>
              {emailError && (
                <p className="mt-2 text-xs text-red-400">{emailError}</p>
              )}
              {emailSent && (
                <p className="mt-2 text-xs text-green-400">
                  t("report.email_opened")
                </p>
              )}
            </div>

          </div>
        </section>
      )}

      {/* t("report.checklist") Tab */}
      {activeTab === "compliance" && (
        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
          <h2 className="text-lg font-semibold">Detailed t("report.checklist")</h2>
          {rawCompliance.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <Info className="mx-auto h-10 w-10 text-slate-500" />
              <p className="mt-3 text-slate-400">t("report.no_detail")</p>
              <Link to="/" className="mt-4 inline-flex items-center gap-1 rounded-xl bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700">
                t("report.return_home")
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {rawCompliance.map((item, i) => (
                <div key={i} className={`rounded-2xl border p-4 transition hover:brightness-110 ${
                  item.severity === "high" ? "border-red-500/30 bg-red-500/10" :
                  item.severity === "medium" ? "border-amber-500/30 bg-amber-500/10" :
                  "border-green-500/30 bg-green-500/10"
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {item.required ? (
                        <Shield className={`mt-0.5 h-5 w-5 shrink-0 ${item.severity === "high" ? "text-red-400" : item.severity === "medium" ? "text-amber-400" : "text-green-400"}`} />
                      ) : (
                        <Info className={`mt-0.5 h-5 w-5 shrink-0 ${item.severity === "high" ? "text-red-400" : item.severity === "medium" ? "text-amber-400" : "text-green-400"}`} />
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-white">{item.name}</h3>
                          {item.required ? (
                            <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-xs text-red-300">t("report.mandatory")</span>
                          ) : (
                            <span className="rounded-md bg-slate-500/20 px-2 py-0.5 text-xs text-slate-400">t("report.recommended")</span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* t("report.action_plan") Tab */}
      {activeTab === "prerequisites" && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mt-6">
                <h2 className="text-lg font-semibold mb-4">t("report.market_risks")</h2>
                <div className="space-y-6">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <h3 className="text-sm font-semibold text-amber-300 mb-3">t("report.market_prereq")</h3>
                    <div className="space-y-2 text-sm text-slate-300">
                      {marketId === 'eu' && (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&#x2022;</span><div><span className="font-medium text-white">t("report.eori")</span> t("report.eori_d")</div></div>
                          <div className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&#x2022;</span><div><span className="font-medium text-white">t("report.vat")</span> t("report.vat_d") (DE: Umsatzsteuer-ID, FR: N&#x00b0; TVA).</div></div>
                          <div className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&#x2022;</span><div><span className="font-medium text-white">t("report.epr")</span> t("report.epr_d")<div className="mt-1 ml-4 text-xs text-slate-400 space-y-0.5"><div>📦 Packaging: LUCID (DE), &#x00e9;co-EMballages (FR)</div><div>♻️ WEEE: Register per country for electrical</div><div>🧑 Battery: LUCID/BaterReg (DE), InfoBat (FR)</div></div></div></div>
                          <div className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&#x2022;</span><div><span className="font-medium text-white">t("report.eu_rep")</span> t("report.eu_rep_d")</div></div>
                        </div>
                      )}
                      {marketId === 'uk' && (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&#x2022;</span><div><span className="font-medium text-white">t("report.uk_vat")</span> Required if turnover exceeds &#x00a3;90,000 or via marketplaces.</div></div>
                          <div className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&#x2022;</span><div><span className="font-medium text-white">t("report.uk_rp")</span> t("report.uk_rp_d")</div></div>
                          <div className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&#x2022;</span><div><span className="font-medium text-white">t("report.uk_epr")</span> t("report.uk_epr_d")</div></div>
                        </div>
                      )}
                      {marketId === 'us' && (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&#x2022;</span><div><span className="font-medium text-white">t("report.us_reg")</span> t("report.us_reg_d")</div></div>
                          <div className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&#x2022;</span><div><span className="font-medium text-white">t("report.us_addr")</span> t("report.us_addr_d")</div></div>
                          <div className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&#x2022;</span><div><span className="font-medium text-white">t("report.sales_tax")</span> t("report.sales_tax_d")</div></div>
                        </div>
                      )}
                      {marketId === 'jp' && (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&#x2022;</span><div><span className="font-medium text-white">t("report.jp_tax")</span> t("report.jp_tax_d")</div></div>
                          <div className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&#x2022;</span><div><span className="font-medium text-white">t("report.consumers")</span> t("report.consumers_d")</div></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <h3 className="text-sm font-semibold text-red-300 mb-3">t("report.corp_risks")</h3>
                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex items-start gap-2"><span className="text-red-400 mt-0.5">&#x26A0;</span><div><span className="font-medium text-white">t("report.shell")</span> t("report.shell_d")</div></div>
                      <div className="flex items-start gap-2"><span className="text-red-400 mt-0.5">&#x26A0;</span><div><span className="font-medium text-white">t("report.name_match")</span> t("report.name_d")</div></div>
                      <div className="flex items-start gap-2"><span className="text-red-400 mt-0.5">&#x26A0;</span><div><span className="font-medium text-white">t("report.doc_verify")</span> t("report.doc_d")</div></div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                    <h3 className="text-sm font-semibold text-green-300 mb-3">Recommended Testing Laboratories</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-300">
                      {[{ name: 'SGS', site: 'sgs.com', desc: 't("report.lab_global")', price: 'Med-High' }, { name: '&#x00DC;V Rheinland', site: 'tuv.com', desc: 'Strong in EU/CE', price: 'Med-High' }, { name: 'Intertek', site: 'intertek.com', desc: 'Wide coverage', price: 'Medium' }, { name: 'CTI', site: 'cti-group.com', desc: 'China-based, competitive', price: 'Low-Med' }, { name: 'Bureau Veritas', site: 'bureauveritas.com', desc: 'Food/contact specialist', price: 'Med-High' }, { name: 'Eurofins', site: 'eurofins.com', desc: 'Food/cosmetics', price: 'High' }].map((lab, idx) => (
                        <div key={idx} className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                          <div className="flex items-center justify-between"><span className="font-medium text-white">{lab.name}</span><span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-slate-400">{lab.price}</span></div>
                          <div className="text-xs text-slate-400 mt-0.5">{lab.desc}</div>
                          <a href={`https://${lab.site}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block">{lab.site} &#x2192;</a>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">t("report.lab_advice")</p>
                  </div>
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                    <h3 className="text-sm font-semibold text-blue-300 mb-3">t("report.cert_verify")</h3>
                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#x2022;</span><div><span className="font-medium text-white">FCC ID:</span> Verify at <a href="https://www.fcc.gov/oet/ea" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">fcc.gov/oet/ea</a></div></div>
                      <div className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#x2022;</span><div><span className="font-medium text-white">CE DoC:</span> t("report.ce_v")</div></div>
                      <div className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#x2022;</span><div><span className="font-medium text-white">CPC:</span> Verify CPSC-accepted lab at <a href="https://www.cpsc.gov/CPCTestingLabs" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">cpsc.gov</a></div></div>
                      <div className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#x2022;</span><div><span className="font-medium text-white">PSE (Japan):</span> Verify at <a href="https://www.nite.go.jp/en/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">nite.go.jp/en/</a></div></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "action" && (
        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
          {isAiMode && aiResult && aiResult.warnings && aiResult.warnings.length > 0 && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 mb-4">
              <h3 className="text-sm font-semibold text-red-300 mb-2">⚠ t("report.key_warn")</h3>
              {aiResult.warnings.map((w, i) => (
                <p key={i} className="text-sm text-red-200/80 mb-1">• {w}</p>
              ))}
            </div>
          )}
          <h2 className="text-lg font-semibold mb-3">t("report.action_plan")</h2>
          {displayRecommendations.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <p className="text-slate-400">t("report.no_actions")</p>
            </div>
          ) : (
            <div className="space-y-4">
              {["high", "medium", "low"].map((sev) => {
                const items = displayRecommendations.filter(r => r.severity === sev);
                if (items.length === 0) return null;
                const borderColor = sev === "high" ? "border-red-500/20 bg-red-500/5" : 
                                    sev === "medium" ? "border-amber-500/20 bg-amber-500/5" : 
                                    "border-green-500/20 bg-green-500/5";
                const titleColor = sev === "high" ? "text-red-300" : 
                                   sev === "medium" ? "text-amber-300" : "text-green-300";
                const icon = sev === "high" ? <AlertTriangle className="h-4 w-4 text-red-400" /> :
                             sev === "medium" ? <TrendingUp className="h-4 w-4 text-amber-400" /> :
                             <CheckCircle className="h-4 w-4 text-green-400" />;
                return (
                  <div key={sev}>
                    <div className="flex items-center gap-2 mb-3">
                      {icon}
                      <span className={`text-sm font-semibold ${titleColor}`}>
                        {sev === "high" ? "🔴 t("report.pri_high")" : 
                         sev === "medium" ? "🟡 t("report.pri_med")" : 
                         "🟢 t("report.optional")"}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {items.map((item, i) => (
                        <div key={`${sev}-${i}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                          <div className="flex items-start gap-3">
                            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-white">{item.name}</h3>
                                {item.required && (
                                  <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-xs text-red-300">t("report.mandatory")</span>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-slate-400">{item.action}</p>
                              <div className="mt-2 rounded-lg bg-purple-500/10 p-2.5 text-xs text-purple-300">
                                <Sparkles className="h-3 w-3 inline mr-1" />
                                AI Recommendation: {item.reason}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-md bg-blue-600/20 px-2.5 py-1 text-xs text-blue-300">
                                  {item.priorityLabel}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-600/20 px-2.5 py-1 text-xs text-slate-400">
                                  <Clock className="h-3 w-3" />Est. time: {item.estimatedTime}
                                </span>
                                <span className="rounded-md bg-slate-600/20 px-2.5 py-1 text-xs text-slate-400">
                                  Est. cost: {item.estimatedCost}
                                </span>
                                <span className="rounded-md bg-slate-600/20 px-2.5 py-1 text-xs text-slate-400">
                                  Third-party test: {item.needsThirdParty ? "Yes" : "No"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="mx-auto mt-10 max-w-7xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
            <div>
              <h3 className="font-semibold text-blue-300">Disclaimer</h3>
              <p className="mt-1 text-sm text-slate-400">
                t("report.disclaimer_full")
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Recommendation card component
function RecommendationCard({ item }: { item: RecommendationItem }) {
  const confColor = item.confidence === "high" ? "border-purple-500/30 bg-purple-500/10" :
                    item.confidence === "medium" ? "border-amber-500/30 bg-amber-500/10" :
                    "border-green-500/30 bg-green-500/10";
  const badgeColor = item.confidence === "high" ? "bg-purple-500/20 text-purple-300" :
                     item.confidence === "medium" ? "bg-amber-500/20 text-amber-300" :
                     "bg-green-500/20 text-green-300";

  return (
    <div className={`rounded-xl border p-4 ${confColor}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Shield className={`mt-0.5 h-5 w-5 shrink-0 ${item.severity === "high" ? "text-red-400" : item.severity === "medium" ? "text-amber-400" : "text-green-400"}`} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-white">{item.name}</h3>
              {item.required && <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-xs text-red-300">t("report.mandatory")</span>}
              <span className={`rounded-md px-2 py-0.5 text-xs ${badgeColor}`}>{item.priorityLabel}</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-1 text-purple-300">
          <Sparkles className="h-3 w-3" />{item.reason}
        </span>
        <span className="rounded-md bg-slate-600/20 px-2 py-1 text-slate-400">
          Est. time: {item.estimatedTime}
        </span>
        <span className="rounded-md bg-slate-600/20 px-2 py-1 text-slate-400">
          Est. cost: {item.estimatedCost}
        </span>
      </div>
    </div>
  );
}