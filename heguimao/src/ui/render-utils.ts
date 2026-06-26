/**
 * Render utilities for Devvit UI blocks
 * Converts compliance data into Devvit-compatible composite blocks
 */

import { ComplianceResult } from "../compliance/engine";

/**
 * Render a compliance result as an array of text blocks
 */
export function renderComplianceSummary(
  result: ComplianceResult,
  category: string,
  isCompact = false
): string[] {
  const blocks: string[] = [];
  
  // Header
  blocks.push(`🐱 **Compliance Check: ${capitalize(category)} → ${result.market.toUpperCase()}**`);
  
  // Summary line
  const highCount = result.items.filter(i => i.severity === "high").length;
  const requiredCount = result.items.filter(i => i.required).length;
  blocks.push(`${result.items.length} requirements · ${highCount} high severity · ${requiredCount} mandatory`);
  blocks.push("");
  
  // Top items (max 5 for readability)
  const displayItems = result.items.slice(0, isCompact ? 3 : 5);
  
  for (const item of displayItems) {
    const severityIcon = item.severity === "high" ? "🔴" : 
                         item.severity === "medium" ? "🟡" : "🟢";
    const requiredTag = item.required ? " *(Required)*" : "";
    
    blocks.push(`${severityIcon} **${item.name}**${requiredTag}`);
    
    if (!isCompact) {
      blocks.push(`  ${item.desc}`);
      blocks.push(`  Action: ${item.action} | Time: ${item.estimatedTime} | 3rd Party: ${item.needsThirdParty ? "Yes" : "No"}`);
    }
    
    blocks.push("");
  }
  
  // More items indicator
  if (result.items.length > displayItems.length) {
    blocks.push(`...and ${result.items.length - displayItems.length} more requirements`);
    blocks.push("");
  }
  
  // CTA
  blocks.push(`📄 [View Full AI Report →](https://heguimao.com/report?from=reddit&cat=${category}&market=${result.market})`);
  
  return blocks;
}

/**
 * Render a single compliance item as compact text
 */
export function renderComplianceItem(item: any): string[] {
  return [
    `${item.required ? "🔴" : "🟡"} **${item.name}** ${item.required ? "(Required)" : ""}`,
    item.desc,
    `Estimated: ${item.estimatedTime}`,
    ""
  ];
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
