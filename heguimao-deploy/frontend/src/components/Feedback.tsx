import { useState, useEffect } from "react";
import { X, Send, MessageSquare, AlertCircle, Lightbulb, TrendingUp, ThumbsDown, ThumbsUp } from "lucide-react";

const FEEDBACK_API_URL = import.meta.env.VITE_FEEDBACK_API_URL || "https://heguimao-api.senliri028.workers.dev/api/chat";

type FeedbackType = "experience" | "content" | "feature" | "high_frequency";
type FeedbackCategory = "bug" | "slow" | "inaccurate" | "missing_content" | "too_professional" | "ui_layout" | "new_feature" | "other";

const TYPE_CONFIG: Record<FeedbackType, { label: string; icon: string; desc: string }> = {
  experience: { label: "Experience Issue", icon: "🐛", desc: "Page lag, slow loading, layout issues" },
  content: { label: "Content Issue", icon: "📋", desc: "Inaccurate info, missing categories, too technical" },
  feature: { label: "Feature Request", icon: "💡", desc: "New features you'd like to see" },
  high_frequency: { label: "Frequent Question", icon: "🔥", desc: "Questions users ask often" },
};

const CATEGORY_OPTIONS: Record<FeedbackType, FeedbackCategory[]> = {
  experience: ["bug", "slow", "ui_layout", "other"],
  content: ["inaccurate", "missing_content", "too_professional", "other"],
  feature: ["new_feature", "other"],
  high_frequency: ["other"],
};

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: "🚨 Functional Bug",
  slow: "⏱️ Slow / Unresponsive",
  ui_layout: "🎨 Layout / Display Issue",
  inaccurate: "❌ Inaccurate Response",
  missing_content: "📭 Missing Knowledge",
  too_professional: "📖 Too Technical",
  new_feature: "✨ New Feature Idea",
  other: "📝 Other",
};

export function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<FeedbackType>("experience");
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory>("bug");
  const [detail, setDetail] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
      setStep(1);
      setSelectedType("experience");
      setSelectedCategory("bug");
      setDetail("");
      setEmail("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!detail.trim()) return;
    setIsSubmitting(true);
    try {
      await fetch(FEEDBACK_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          category: selectedCategory,
          detail: detail.trim(),
          email: email.trim(), // 新增：用户邮箱
          priority: selectedCategory === "bug" ? "high" : "medium",
          page: window.location.pathname,
          userAgent: navigator.userAgent.slice(0, 200),
        }),
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setStep(1);
        setSelectedType("experience");
        setSelectedCategory("bug");
        setDetail("");
        setEmail("");
      }, 2000);
    } catch {
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password reset handler
  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      setResetError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      setResetError("Please enter a valid email address.");
      return;
    }

    setIsSendingReset(true);
    setResetError("");
    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      setResetSent(true);
    } catch (err) {
      console.error("Password reset failed:", err);
      setResetError(err instanceof Error ? err.message : "Failed to send reset email. Please try again.");
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/95 backdrop-blur">
          <div>
            <h2 className="text-lg font-bold">Send Feedback</h2>
            <p className="text-xs text-slate-400">Help us improve Compliance Cat</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Password Reset Section */}
        <div className="p-4 border-b border-white/10">
          <button
            onClick={() => setShowPasswordReset(!showPasswordReset)}
            className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-white transition"
          >
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Forgot Password? Request Reset
            </span>
            <span className="text-xs">{showPasswordReset ? "▲" : "▼"}</span>
          </button>

          {showPasswordReset && (
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => { setResetEmail(e.target.value); setResetError(""); }}
                  placeholder="your@email.com"
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={handlePasswordReset}
                  disabled={isSendingReset || resetSent}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {isSendingReset ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : resetSent ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isSendingReset ? "Sending..." : resetSent ? "Sent!" : "Send"}
                </button>
              </div>
              {resetError && (
                <p className="text-xs text-red-400">{resetError}</p>
              )}
              {resetSent && (
                <p className="text-xs text-green-400">
                  Password reset email sent! Check your inbox.
                </p>
              )}
            </div>
          )}
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <ThumbsUp className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Thank you!</h3>
            <p className="mt-2 text-sm text-slate-400">Your feedback helps us build a better product.</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Step 1: Choose type */}
            {step === 1 && (
              <>
                <p className="text-sm text-slate-300">What kind of feedback is this?</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TYPE_CONFIG) as FeedbackType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => { setSelectedType(type); setSelectedCategory(CATEGORY_OPTIONS[type][0]); setStep(2); }}
                      className={`rounded-xl border p-3 text-left transition hover:border-blue-500/50 ${
                        selectedType === type ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div className="text-lg">{TYPE_CONFIG[type].icon}</div>
                      <div className="text-sm font-medium text-white">{TYPE_CONFIG[type].label}</div>
                      <div className="text-xs text-slate-400 mt-1">{TYPE_CONFIG[type].desc}</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 2: Choose category */}
            {step === 2 && (
              <>
                <button onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-white">← Back</button>
                <p className="text-sm text-slate-300">Which best describes the issue?</p>
                <div className="space-y-2">
                  {CATEGORY_OPTIONS[selectedType].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setStep(3); }}
                      className={`w-full rounded-xl border p-3 text-left transition hover:border-blue-500/50 ${
                        selectedCategory === cat ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5"
                      }`}
                    >
                      <span className="text-sm text-white">{CATEGORY_LABELS[cat]}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 3: Detail */}
            {step === 3 && (
              <>
                <button onClick={() => setStep(2)} className="text-xs text-slate-400 hover:text-white">← Back</button>
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">
                    Describe your feedback {selectedCategory === "bug" && "🚨"}
                  </label>
                  <textarea
                    rows={5}
                    placeholder={
                      selectedCategory === "bug"
                        ? "What went wrong? Include steps to reproduce..."
                        : selectedCategory === "new_feature"
                        ? "What feature would you like to see?"
                        : "Tell us more..."
                    }
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 resize-none"
                  />
                  <p className="mt-1 text-xs text-slate-500">Optional: email for follow-up</p>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 py-2 px-4 text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!detail.trim() || isSubmitting}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 反馈入口按钮（放在 Footer）
export function FeedbackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition"
    >
      <MessageSquare className="h-3 w-3" />
      Send Feedback
    </button>
  );
}
