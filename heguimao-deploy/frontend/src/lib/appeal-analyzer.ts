import { AI_REVIEW_NOTICE_PROMPT, AMAZON_REVIEWER_PROMPT } from "./appeal-prompts";

export interface NoticeAnalysisResult {
  complianceDimension: string;
  specificIssue: string;
  severity: "critical" | "high" | "medium" | "low";
  policyReferences: string[];
  reviewerType: "automated AI" | "human reviewer" | "customer complaint";
  requestedEvidence: string[];
  confidence: "high" | "medium" | "low";
  amazonPerspective: string;
  recommendedStrategy: string;
  followUpQuestions: string[];
  similarPastCases: string[];
}

export interface POAReviewResult {
  overallVerdict: "likely accepted" | "needs revision" | "likely rejected";
  score: number;
  rootCauseQuality: {
    score: number;
    isSpecific: boolean;
    isHonest: boolean;
    weakness: string;
  };
  correctiveActionsQuality: {
    score: number;
    areAlreadyImplemented: boolean;
    areVerifiable: boolean;
    weakness: string;
  };
  preventiveMeasuresQuality: {
    score: number;
    areSystematic: boolean;
    haveCheckpoints: boolean;
    weakness: string;
  };
  toneAndStructure: {
    score: number;
    isProfessional: boolean;
    hasLogicalFlow: boolean;
    weakness: string;
  };
  likelihoodOfAcceptance: "high" | "medium" | "low";
  mostLikelyRejectionReason: string;
  topWeaknesses: string[];
  suggestedImprovements: string[];
  redFlags: string[];
}

/**
 * Parse an Amazon compliance notice to extract structured compliance data
 */
export async function analyzeComplianceNotice(
  noticeText: string,
  productType?: string
): Promise<NoticeAnalysisResult> {
  const message = `Amazon Compliance Notice Analysis:\n\n${noticeText}${productType ? `\n\nProduct context: ${productType}` : ""}`;
  
  return callAgnesAI<NoticeAnalysisResult>(AI_REVIEW_NOTICE_PROMPT, message);
}

/**
 * Review a POA (Plan of Action) before submitting to Amazon
 */
export async function reviewPOA(
  productType: string,
  reason: string,
  rootCause: string,
  correctiveActions: string[],
  preventiveMeasures: string[],
  appealLetter: string
): Promise<POAReviewResult> {
  const prompt = AMAZON_REVIEWER_PROMPT
    .replace("{productType}", productType)
    .replace("{reason}", reason)
    .replace("{rootCause}", rootCause)
    .replace("{correctiveActions}", correctiveActions.join(", "))
    .replace("{preventiveMeasures}", preventiveMeasures.join(", "))
    .replace("{appealLetter}", appealLetter);
  
  return callAgnesAI<POAReviewResult>(prompt, "Review this POA from Amazon's perspective.");
}

async function callAgnesAI<T>(prompt: string, message: string): Promise<T> {
  const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const apiKey = import.meta.env.VITE_AGNES_API_KEY || "";
  
  const url = isDev 
    ? "https://apihub.agnes-ai.com/v1/chat/completions"
    : "/api/chat";
  
  if (isDev) {
    // Direct API call in dev mode
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "agnes-2.0-flash",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: message },
        ],
        temperature: 0.3,
      }),
    });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";
    const cleaned = reply.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI returned unexpected format");
    return JSON.parse(jsonMatch[0]);
  } else {
    // Production: use Vercel Serverless Function
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "appeal-analyze",
        prompt,
        message,
      }),
    });
    
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const data = await response.json();
    const reply = data.reply || data.content || "";
    const cleaned = reply.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI returned unexpected format");
    return JSON.parse(jsonMatch[0]);
  }
}
