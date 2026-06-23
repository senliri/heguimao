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
  const isDev = import.meta.env.DEV;
  const apiKey = import.meta.env.VITE_AGNES_API_KEY || "";
  const workerUrl = import.meta.env.VITE_WORKER_URL || "https://heguimao-api.senliri028.workers.dev";
  
  const url = isDev 
    ? `${workerUrl}/api/chat`
    : `${workerUrl}/api/chat`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "appeal-analyze",
      prompt,
      message,
    }),
  });
}
