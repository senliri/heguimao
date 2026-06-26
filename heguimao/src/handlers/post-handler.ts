/**
 * Post handler - Responds to posts containing compliance keywords
 */

import { complianceEngine } from "../compliance/engine";
import { keywordMatcher } from "../utils/keyword-matcher";
import { renderComplianceSummary } from "../ui/render-utils";

export async function handlePostCreation(
  event: any,
  post: any,
  keywords: string[]
): Promise<void> {
  const category = keywordMatcher.getCategory(keywords);
  const body = post.getBody();
  
  // Determine market from post content (default to US)
  const market = detectMarketFromText(body);
  
  try {
    const result = await complianceEngine.lookup(category, market);
    
    if (result.items.length > 0) {
      const commentBody = renderComplianceSummary(result, category);
      
      await event.getCommentCreator().createComment({
        body: commentBody,
        onBehalfOf: event.getUser(),
      });
    }
  } catch (error) {
    console.error("Error processing post:", error);
  }
}

/**
 * Detect target market from post text
 */
function detectMarketFromText(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(eu|european union|eurozone|britain|uk|united kingdom|england|scotland|wales)\b/.test(lower)) return "eu";
  if (/\b(japan|jp|东京|大阪)\b/.test(lower)) return "jp";
  if (/\b(australia|au|悉尼|melbourne)\b/.test(lower)) return "au";
  if (/\b(canada|ca|toronto|vancouver|montreal)\b/.test(lower)) return "ca";
  if (/\b(ukca|british|gb)\b/.test(lower)) return "uk";
  if (/\b(singapore|sg)\b/.test(lower)) return "sg";
  if (/\b(korea|kr|首尔)\b/.test(lower)) return "kr";
  if (/\b(brazil|br|saopaulo|rj)\b/.test(lower)) return "br";
  if (/\b(india|in|孟买|delhi)\b/.test(lower)) return "in";
  if (/\b(saudi|sa|dubai|uae|ae)\b/.test(lower)) return "sa";
  // Default to US
  return "us";
}
