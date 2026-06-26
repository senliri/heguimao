/**
 * Interactive compliance query card component
 */

import { complianceEngine } from "../compliance/engine";

export const complianceQueryBlock = {
  title: "Compliance Query Card",
  subtitle: "Look up compliance requirements by category and market",
  
  // This would be rendered by Devvit framework
  // For now, we define the structure
  
  categories: [
    { id: "electronics", label: "🔌 Electronics" },
    { id: "toys", label: "🧸 Toys" },
    { id: "baby", label: "🍼 Baby Products" },
    { id: "beauty", label: "💄 Beauty & Personal Care" },
    { id: "health", label: "💊 Health & Medical" },
    { id: "food", label: "🍎 Food & Supplements" },
    { id: "general", label: "📦 General Products" },
  ],
  
  getComplianceData: async (category: string, market: string) => {
    return complianceEngine.lookup(category, market);
  }
};
