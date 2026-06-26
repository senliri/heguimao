/**
 * Comment handler - Responds to comments containing compliance keywords
 */

import { complianceEngine } from "../compliance/engine";
import { keywordMatcher } from "../utils/keyword-matcher";
import { renderComplianceSummary } from "../ui/render-utils";

export async function handleCommentTrigger(
  event: any,
  comment: any,
  keywords: string[]
): Promise<void> {
  const category = keywordMatcher.getCategory(keywords);
  const parentPost = await event.getParentPost();
  const body = parentPost ? parentPost.getBody() : comment.getBody();
  
  const market = detectMarketFromText(body);
  
  try {
    const result = await complianceEngine.lookup(category, market);
    
    if (result.items.length > 0) {
      const commentBody = renderComplianceSummary(result, category, true);
      
      await event.getCommentCreator().createComment({
        body: commentBody,
        onBehalfOf: event.getUser(),
      });
    }
  } catch (error) {
    console.error("Error processing comment:", error);
  }
}

function detectMarketFromText(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(eu|european union|eurozone|uk|united kingdom)\b/.test(lower)) return "eu";
  if (/\b(japan|jp)\b/.test(lower)) return "jp";
  if (/\b(australia|au)\b/.test(lower)) return "au";
  if (/\b(canada|ca)\b/.test(lower)) return "ca";
  if (/\b(ukca|british|gb)\b/.test(lower)) return "uk";
  return "us";
}
