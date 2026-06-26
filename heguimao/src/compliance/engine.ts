/**
 * Compliance Engine - Core logic for looking up and matching compliance data
 * 
 * This engine mirrors the data structure from the main Compliance Cat site
 * but is optimized for the Devvit environment (lightweight, no DOM).
 * 
 * Data source: Heavily inspired by site.ts from heguimao-deploy/frontend/src/data/site.ts
 */

export interface ComplianceItem {
  name: string;
  required: boolean;
  desc: string;
  severity: "high" | "medium" | "low";
  action: string;
  estimatedTime: string;
  needsThirdParty: boolean;
}

export interface ComplianceResult {
  category: string;
  market: string;
  items: ComplianceItem[];
  summary: string;
}

// ─── Lightweight Compliance Database ──────────────────────────────
// Subset of the full site.ts data, optimized for Reddit app queries
// Full data lives in heguimao-deploy/frontend/src/data/site.ts

const COMPLIANCE_DB: Record<string, Record<string, ComplianceItem[]>> = {
  // Electronics
  electronics: {
    us: [
      { name: "FCC Certification", required: true, desc: "Federal Communications Commission certification for electronic devices", severity: "high", action: "Submit product for FCC testing at accredited lab", estimatedTime: "2-4 weeks", needsThirdParty: true },
      { name: "UL Safety", required: false, desc: "Underwriters Laboratories safety certification (recommended)", severity: "medium", action: "Consider UL listing for consumer confidence", estimatedTime: "3-6 weeks", needsThirdParty: true },
      { name: "Proposition 65 Warning", required: false, desc: "California chemical exposure warning requirement", severity: "low", action: "Add Prop 65 warning if applicable", estimatedTime: "1 week", needsThirdParty: false },
    ],
    eu: [
      { name: "CE Marking", required: true, desc: "EU conformity marking for electronics", severity: "high", action: "Conduct EMC/LVD assessment and create Declaration of Conformity", estimatedTime: "2-4 weeks", needsThirdParty: true },
      { name: "RoHS Compliance", required: true, desc: "Restriction of Hazardous Substances directive", severity: "high", action: "Test materials for restricted substances", estimatedTime: "1-2 weeks", needsThirdParty: true },
      { name: "WEEE Registration", required: true, desc: "Waste Electrical and Electronic Equipment directive", severity: "medium", action: "Register with national WEEE authority", estimatedTime: "1-2 weeks", needsThirdParty: false },
      { name: "REACH Registration", required: false, desc: "Registration of Chemicals evaluation authorization restriction", severity: "medium", action: "Check if substances exceed 1 ton/year threshold", estimatedTime: "2-4 weeks", needsThirdParty: true },
    ],
    uk: [
      { name: "UKCA Marking", required: true, desc: "UK conformity assessment marking (replaces CE for GB)", severity: "high", action: "Obtain UKCA certification from approved body", estimatedTime: "2-4 weeks", needsThirdParty: true },
      { name: "UK RoHS", required: true, desc: "UK restriction of hazardous substances", severity: "high", action: "Test for restricted substances per UK regulations", estimatedTime: "1-2 weeks", needsThirdParty: true },
    ],
    jp: [
      { name: "PSE (Diamond)", required: true, desc: "Electrical Appliance and Material Control Act - regulated electronics", severity: "high", action: "Submit to Japan certified testing lab", estimatedTime: "2-4 weeks", needsThirdParty: true },
      { name: "PSE (Circle)", required: true, desc: "Non-regulated but recommended electronics safety", severity: "medium", action: "Voluntary PSE certification", estimatedTime: "1-2 weeks", needsThirdParty: true },
      { name: "TELEC Certification", required: true, desc: "Wireless equipment certification (for WiFi/Bluetooth)", severity: "high", action: "Submit wireless module for TELEC testing", estimatedTime: "2-4 weeks", needsThirdParty: true },
    ],
    ca: [
      { name: "IC (Industry Canada) Certification", required: true, desc: "Wireless device certification for Canada", severity: "high", action: "Apply through Innovation, Science and Economic Development Canada", estimatedTime: "2-4 weeks", needsThirdParty: true },
    ],
    au: [
      { name: "RCM (Regulatory Compliance Mark)", required: true, desc: "Australian/New Zealand compliance mark for electronics", severity: "high", action: "Obtain test report from NATA-accredited lab", estimatedTime: "2-4 weeks", needsThirdParty: true },
    ],
  },
  // Toys
  toys: {
    us: [
      { name: "CPSIA / CPC", required: true, desc: "Consumer Product Safety Improvement Act - Children's Product Certificate", severity: "high", action: "Send samples to CPSC-accepted lab for testing", estimatedTime: "3-6 weeks", needsThirdParty: true },
      { name: "ASTM F963", required: true, desc: "Standard toy safety specification", severity: "high", action: "Full physical, mechanical, flammability testing", estimatedTime: "3-6 weeks", needsThirdParty: true },
      { name: "Small Parts Warning", required: true, desc: "Choking hazard labeling for small parts", severity: "high", action: "Add permanent traceability label and warning", estimatedTime: "1 week", needsThirdParty: false },
    ],
    eu: [
      { name: "CE Marking (EN 71)", required: true, desc: "EU toy safety standard", severity: "high", action: "EN 71-1/2/3 testing at accredited lab", estimatedTime: "3-6 weeks", needsThirdParty: true },
      { name: "REACH SVHC Check", required: false, desc: "SVHC substance screening", severity: "medium", action: "Verify no SVHC above 0.1% w/w", estimatedTime: "1-2 weeks", needsThirdParty: true },
    ],
    uk: [
      { name: "UKCA Toy Safety", required: true, desc: "UK toy safety regulations", severity: "high", action: "EN 71 testing with UK approved body", estimatedTime: "3-6 weeks", needsThirdParty: true },
    ],
    jp: [
      { name: "JIS T 8101", required: true, desc: "Japanese toy safety standard", severity: "high", action: "Testing at Japanese domestic lab", estimatedTime: "3-6 weeks", needsThirdParty: true },
      { name: "Food Hygiene Law (Painted Toys)", required: false, desc: "For toys that may enter the mouth", severity: "medium", action: "Apply for hygiene law permit if applicable", estimatedTime: "2-4 weeks", needsThirdParty: true },
    ],
  },
  // Baby products
  baby: {
    us: [
      { name: "CPC (Children's Product Cert.)", required: true, desc: "Mandatory for products targeting children under 12", severity: "high", action: "CPSC-accepted lab testing for all applicable standards", estimatedTime: "3-6 weeks", needsThirdParty: true },
      { name: "ASTM F2057 (Strollers)", required: true, desc: "Stroller safety standard", severity: "high", action: "Stroller-specific crash testing", estimatedTime: "4-8 weeks", needsThirdParty: true },
      { name: "Flammability (16 CFR 1610)", required: true, desc: "Textile flammability standard", severity: "medium", action: "Fabric flammability testing", estimatedTime: "1-2 weeks", needsThirdParty: true },
    ],
    eu: [
      { name: "CE Marking (EN 71 + EN 1888)", required: true, desc: "EU toy and stroller safety", severity: "high", action: "EN 71 for toys, EN 1888 for strollers", estimatedTime: "4-8 weeks", needsThirdParty: true },
    ],
  },
  // Beauty / Personal Care
  beauty: {
    us: [
      { name: "FDA Cosmetic Registration", required: false, desc: "Voluntary facility registration under MoCRA", severity: "low", action: "Register manufacturing facility with FDA", estimatedTime: "1-2 weeks", needsThirdParty: false },
      { name: "Prop 65 Screening", required: false, desc: "California chemical exposure warning", severity: "medium", action: "Screen ingredients against Prop 65 list", estimatedTime: "1-2 weeks", needsThirdParty: true },
    ],
    eu: [
      { name: "CPNP Notification", required: true, desc: "Cosmetic Product Notification Portal", severity: "high", action: "Submit product info to CPNP before placing on EU market", estimatedTime: "1-2 weeks", needsThirdParty: false },
      { name: "Safety Assessment", required: true, desc: "Cosmetic product safety report by qualified assessor", severity: "high", action: "Engage qualified safety assessor", estimatedTime: "2-4 weeks", needsThirdParty: true },
      { name: "GMP ISO 22716", required: true, desc: "Good Manufacturing Practice", severity: "high", action: "Ensure manufacturing meets GMP standards", estimatedTime: "4-8 weeks", needsThirdParty: true },
    ],
  },
  // Health / Medical
  health: {
    us: [
      { name: "FDA Registration", required: true, desc: "Medical device or supplement facility registration", severity: "high", action: "Register with FDA as medical device facility", estimatedTime: "2-4 weeks", needsThirdParty: true },
      { name: "510(k) Clearance", required: false, desc: "For Class II medical devices", severity: "high", action: "Submit 510(k) premarket notification", estimatedTime: "3-6 months", needsThirdParty: true },
    ],
    eu: [
      { name: "EU MDR Compliance", required: true, desc: "Medical Device Regulation", severity: "high", action: "Obtain CE marking via Notified Body assessment", estimatedTime: "3-6 months", needsThirdParty: true },
    ],
  },
  // Food & Supplements
  food: {
    us: [
      { name: "FDA Facility Registration", required: true, desc: "Food facility registration", severity: "high", action: "Register facility with FDA", estimatedTime: "1-2 weeks", needsThirdParty: false },
      { name: "Nutrition Labeling (FD&C)", required: true, desc: "Supplement Facts panel per 21 CFR 101.36", severity: "high", action: "Create compliant Supplement Facts label", estimatedTime: "1-2 weeks", needsThirdParty: false },
    ],
    eu: [
      { name: "EFSA Novel Food Check", required: false, desc: "Novel food authorization if applicable", severity: "medium", action: "Verify ingredients against EFSA novel food list", estimatedTime: "2-4 weeks", needsThirdParty: true },
    ],
  },
  // General fallback
  general: {
    us: [
      { name: "General Product Safety", required: true, desc: "Basic product safety compliance", severity: "medium", action: "Ensure product meets general safety standards", estimatedTime: "TBD", needsThirdParty: false },
    ],
    eu: [
      { name: "General Product Safety Regulation", required: true, desc: "EU GPSR compliance", severity: "medium", action: "Ensure economic operator designation and traceability", estimatedTime: "TBD", needsThirdParty: false },
    ],
  },
};

// ─── Search Index ─────────────────────────────────────────────────

const SEARCH_INDEX: Array<{ term: string; category: string; market: string }> = [];

for (const [category, markets] of Object.entries(COMPLIANCE_DB)) {
  for (const [market, items] of Object.entries(markets)) {
    for (const item of items) {
      SEARCH_INDEX.push({
        term: item.name.toLowerCase(),
        category,
        market,
      });
    }
  }
}

// ─── Engine ───────────────────────────────────────────────────────

export class ComplianceEngine {
  
  /**
   * Look up compliance items by category and market
   */
  async lookup(category: string, market: string): Promise<ComplianceResult> {
    const cat = category.toLowerCase();
    const mkt = market.toLowerCase();
    
    // Direct match
    if (COMPLIANCE_DB[cat]?.[mkt]) {
      return this.buildResult(cat, mkt, COMPLIANCE_DB[cat][mkt]);
    }
    
    // Try _care variants (e.g., electronics_care)
    const careCat = `${cat}_care`;
    if (COMPLIANCE_DB[careCat]?.[mkt]) {
      return this.buildResult(careCat, mkt, COMPLIANCE_DB[careCat][mkt]);
    }
    
    // Fallback: same category, US market
    if (COMPLIANCE_DB[cat]?.["us"]) {
      return this.buildResult(cat, "us", COMPLIANCE_DB[cat]["us"]);
    }
    
    // Fallback: general
    return this.buildResult("general", mkt, COMPLIANCE_DB.general[mkt] || COMPLIANCE_DB.general.us);
  }

  /**
   * Search compliance items by keyword
   */
  async search(query: string): Promise<ComplianceResult[]> {
    const q = query.toLowerCase();
    const results: ComplianceResult[] = [];
    
    for (const entry of SEARCH_INDEX) {
      if (entry.term.includes(q) || q.includes(entry.term)) {
        const items = COMPLIANCE_DB[entry.category]?.[entry.market] || [];
        const filtered = items.filter(item => 
          item.name.toLowerCase().includes(q) || 
          item.desc.toLowerCase().includes(q)
        );
        if (filtered.length > 0) {
          results.push(this.buildResult(entry.category, entry.market, filtered));
        }
      }
    }
    
    return results;
  }

  /**
   * AI-enhanced compliance analysis
   * Calls Agnes API for smart inference
   */
  async analyze(category: string, market: string, productInfo?: string): Promise<ComplianceResult> {
    const base = await this.lookup(category, market);
    
    // If product info is provided, enhance with AI
    if (productInfo) {
      try {
        const aiEnhancement = await this.callAgnesAI(category, market, productInfo);
        if (aiEnhancement) {
          base.items = [...base.items, ...aiEnhancement];
        }
      } catch (e) {
        console.warn("AI enhancement failed, using static data:", e);
      }
    }
    
    return base;
  }

  /**
   * Call Agnes LLM API for intelligent compliance inference
   */
  private async callAgnesAI(category: string, market: string, productInfo: string): Promise<ComplianceItem[]> {
    const apiKey = (typeof process !== 'undefined' ? process.env.AGNES_API_KEY : null);
    if (!apiKey) return [];
    
    const systemPrompt = `You are a compliance expert for Amazon sellers. Given a product category, target market, and product description, identify any additional compliance requirements that might not be in the standard database.`;
    
    const userMessage = `Category: ${category}\nMarket: ${market}\nProduct: ${productInfo}\n\nList any additional certifications, registrations, or compliance requirements needed.`;

    const response = await fetch("https://apihub.agnes-ai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "agnes-2.0-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) return [];
    
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";
    
    // Parse AI response into ComplianceItem format
    // This is a simplified parser - production would use more robust extraction
    const items: ComplianceItem[] = [];
    const lines = reply.split('\n').filter((l: string) => l.trim().startsWith('-') || l.trim().match(/^\d+\./));
    
    for (const line of lines) {
      const text = line.replace(/^[-•\d.]+\s*/, '').trim();
      if (text.length > 10) {
        items.push({
          name: text.split(':')[0].trim(),
          required: false,
          desc: text,
          severity: "medium" as const,
          action: "Consult with compliance specialist",
          estimatedTime: "TBD",
          needsThirdParty: false,
        });
      }
    }
    
    return items;
  }

  private buildResult(category: string, market: string, items: ComplianceItem[]): ComplianceResult {
    const highCount = items.filter(i => i.severity === "high").length;
    const requiredCount = items.filter(i => i.required).length;
    
    const marketNames: Record<string, string> = {
      us: "United States", eu: "European Union", uk: "United Kingdom",
      jp: "Japan", ca: "Canada", au: "Australia", br: "Brazil",
      kr: "South Korea", in: "India", sg: "Singapore",
    };
    
    return {
      category,
      market,
      items,
      summary: `${items.length} compliance requirements for ${category} in ${marketNames[market] || market}. ${highCount} high severity, ${requiredCount} mandatory.`,
    };
  }
}

export const complianceEngine = new ComplianceEngine();
