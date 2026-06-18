import { type ComplianceItem } from "../data/site";

export interface RecommendationItem extends ComplianceItem {
  reason: string; // 为什么推荐这个
  confidence: "high" | "medium" | "low";
  estimatedCost: string; // 预估费用
  priorityLabel: string;
}

// 子品类关键词 → 合规特征映射
interface ProductProfile {
  hasBattery: boolean;
  hasWireless: boolean;
  isChildrenProduct: boolean;
  foodContact: boolean;
  wearable: boolean;
  medical: boolean;
  outdoor: boolean;
  containsChemicals: boolean;
  electrical: boolean;
  precision: boolean;
  importRate: "high" | "medium" | "low";
}

// 根据品类和子品类推断产品特征（增强版）
export function inferProductProfile(catId: string, subId: string): ProductProfile {
  // 电池特征
  const batterySubs = ["charger", "power", "battery", "headphone", "smart-home", "computer", "camera", "electronics-auto",
                       "remote-control", "fitness", "cycling", "electronics-auto"];
  const batteryCats = ["electronics", "sports", "auto", "office"];
  // 无线特征
  const wirelessSubs = ["headphone", "smart-home", "camera", "charger", "remote-control", "cycling", "camera"];
  // 儿童特征
  const childrenSubs = ["educational", "plush", "outdoor-play", "board-game", "remote-control", "feeding", "diaper",
                        "safety", "nursery", "feeding", "stroller", "safety"];
  const childrenCats = ["toys", "baby"];
  // 食品接触
  const foodContactSubs = ["cookware", "kitchen-tool", "feeding", "cookware", "supplement", "snack", "beverage",
                           "kitchen-tool", "cookware"];
  const foodContactCats = ["food", "baby"];
  // 穿戴
  const wearableSubs = ["apparel", "shoes", "accessories", "swimwear", "uniform", "protective",
                        "cosmetics", "skincare", "nail", "hair-care", "fragrance"];
  const wearableCats = ["clothing", "beauty"];
  // 医疗
  const medicalSubs = ["medical-device", "massager", "oral-care", "thermometer"];
  const medicalCats = ["health"];
  // 户外
  const outdoorSubs = ["camping", "cycling", "water-sports", "outdoor-play"];
  const outdoorCats = ["sports", "garden"];
  // 化学品
  const chemicalSubs = ["cosmetics", "skincare", "fragrance", "nail", "herbal", "supplement"];
  const chemicalCats = ["beauty", "food", "garden"];
  // 带电
  const electricalCats = ["electronics", "smart-home", "camera", "computer"];
  const electricalSubs = ["charger", "headphone", "smart-home", "computer", "camera", "electronics-auto",
                          "lighting", "lighting-garden", "electronics-auto"];
  // 磁铁
  const magnetSubs = ["headphone", "smart-home", "earring", "bracelet", "smart-home", "camera"];
  // 精密
  const precisionSubs = ["camera", "thermometer", "medical-device", "massager", "watch"];
  // 易燃
  const flammableSubs = ["cosmetics", "fragrance", "nail", "herbal", "pesticide"];
  const flammableCats = ["garden", "beauty"];

  const isBattery = batterySubs.includes(subId) || batteryCats.includes(catId);
  const isWireless = wirelessSubs.includes(subId);
  const isChildren = childrenSubs.includes(subId) || childrenCats.includes(catId);
  const isFoodContact = foodContactSubs.includes(subId) || foodContactCats.includes(catId);
  const isWearable = wearableSubs.includes(subId) || wearableCats.includes(catId);
  const isMedical = medicalSubs.includes(subId) || medicalCats.includes(catId);
  const isOutdoor = outdoorSubs.includes(subId) || outdoorCats.includes(catId);
  const isChemical = chemicalSubs.includes(subId) || chemicalCats.includes(catId);
  const isElectrical = electricalCats.includes(catId) || electricalSubs.includes(subId);
  const isMagnet = magnetSubs.includes(subId);
  const isPrecision = precisionSubs.includes(subId);
  const isFlammable = flammableSubs.includes(subId) || flammableCats.includes(catId);

  return {
    hasBattery: isBattery,
    hasWireless: isWireless,
    isChildrenProduct: isChildren,
    foodContact: isFoodContact,
    wearable: isWearable,
    medical: isMedical,
    outdoor: isOutdoor,
    containsChemicals: isChemical,
    electrical: isElectrical,
    precision: isPrecision,
    importRate: ["auto", "pet", "food", "health", "garden"].includes(catId) ? "high" : 
                ["electronics", "toys", "beauty", "home", "baby"].includes(catId) ? "high" : "medium",
  };
}

// 智能推荐算法
export function generateRecommendations(
  complianceData: ComplianceItem[],
  marketId: string,
  profile: ProductProfile,
  catId?: string
): RecommendationItem[] {
  if (complianceData.length === 0) return [];

  const recommendations: RecommendationItem[] = [];

  for (const item of complianceData) {
    let reasons: string[] = [];
    let confidence: "high" | "medium" | "low" = "medium";
    let estimatedCost = "$100 - $500";

    // 根据产品特征补充推荐理由
    if (item.name.includes("FCC") && (profile.electrical || profile.hasBattery)) {
      reasons.push("Electronic products with wireless/battery features require FCC electromagnetic compatibility certification");
      confidence = "high";
      estimatedCost = "$300 - $2,000";
    } else if (item.name.includes("CE") && profile.electrical) {
      reasons.push("Electronic products entering the EU market must pass CE certification");
      confidence = "high";
      estimatedCost = "$500 - $3,000";
    } else if (item.name.includes("CE") && profile.outdoor) {
      reasons.push("Sports/outdoor products sold in the EU require CE safety certification");
      confidence = "medium";
      estimatedCost = "$200 - $1,500";
    } else if (item.name.includes("CPSIA") && profile.isChildrenProduct) {
      reasons.push("Children's products must pass CPSIA testing — this is a mandatory Amazon requirement");
      confidence = "high";
      estimatedCost = "$500 - $3,000";
    } else if (item.name.includes("PSE") && (profile.electrical || profile.hasBattery)) {
      reasons.push("Japan mandates PSE certification for electronic products; lithium battery products require diamond PSE");
      confidence = "high";
      estimatedCost = "$500 - $4,000";
    } else if (item.name.includes("FDA") && (profile.foodContact || profile.containsChemicals || profile.medical)) {
      reasons.push(profile.foodContact ? "Food-contact materials require FDA food-grade certification" : 
                   profile.medical ? "Medical devices/health products require FDA registration" : 
                   "Products containing chemicals may require FDA compliance");
      confidence = profile.foodContact || profile.medical ? "high" : "medium";
      estimatedCost = "$200 - $3,000";
    } else if (item.name.includes("RoHS") && profile.electrical) {
      reasons.push("EU RoHS restricts hazardous substances in electronic equipment");
      confidence = "high";
      estimatedCost = "$200 - $1,500";
    } else if (item.name.includes("REACH") && (profile.containsChemicals || profile.foodContact)) {
      reasons.push("Products with chemical components sold in the EU must comply with REACH regulation");
      confidence = profile.containsChemicals ? "high" : "medium";
      estimatedCost = "$150 - $2,000";
    } else if (item.name.includes("UKCA") && (profile.electrical || profile.isChildrenProduct)) {
      reasons.push("Post-Brexit UK requires UKCA certification for electronic and children's products");
      confidence = "high";
      estimatedCost = "$500 - $3,000";
    } else if (item.name.includes("RCM") && profile.electrical) {
      reasons.push("Australia requires RCM certification as a prerequisite for selling electrical products");
      confidence = "high";
      estimatedCost = "$300 - $2,500";
    } else if (item.name.includes("ASTM") && profile.isChildrenProduct) {
      reasons.push("Children's products require ASTM F963 physical safety testing — mandatory for Amazon");
      confidence = "high";
      estimatedCost = "$300 - $1,500";
    } else if (item.name.includes("EN 71") && profile.isChildrenProduct) {
      reasons.push("EU children's products must meet EN 71 toy safety standard");
      confidence = "high";
      estimatedCost = "$500 - $3,000";
    } else if (item.name.includes("TELEC") && profile.hasWireless) {
      reasons.push("Japan requires TELEC certification for Bluetooth/WiFi wireless devices");
      confidence = "high";
      estimatedCost = "$300 - $2,500";
    } else if (item.name.includes("WEEE") && profile.electrical) {
      reasons.push("EU WEEE registration is a prerequisite for selling electronic products");
      confidence = "medium";
      estimatedCost = "$100 - $500";
    } else if (item.name.includes("Prop 65") && profile.importRate === "high") {
      reasons.push("California Prop 65 applies to imported products; confirm whether restricted substances are present");
      confidence = "medium";
      estimatedCost = "$100 - $500";
    } else if (item.name.includes("UL 2743") && profile.hasBattery) {
      reasons.push("Lithium battery products benefit from UL 2743 safety certification to reduce accident risk");
      confidence = "medium";
      estimatedCost = "$300 - $2,500";
    } else if (item.name.includes("IC") && (profile.hasBattery || profile.hasWireless)) {
      reasons.push("Canada requires IC certification for wireless/battery products");
      confidence = "high";
      estimatedCost = "$300 - $1,500";
    } else if (item.name.includes("EESS") && profile.electrical) {
      reasons.push("Australia EESS energy efficiency registration is required before selling electrical products");
      confidence = "medium";
      estimatedCost = "$100 - $500";
    } else if (item.name.includes("MDR") && profile.medical) {
      reasons.push("EU MDR certification is mandatory for medical device products");
      confidence = "high";
      estimatedCost = "$3,000 - $15,000";
    } else if (item.name.includes("FDA") && profile.foodContact && !profile.medical) {
      reasons.push("Imported food/dietary supplements require FDA facility registration");
      confidence = "high";
      estimatedCost = "$200 - $1,500";
    } else if (item.name.includes("AAFCO") && (catId === "pet" || catId === "food" || catId === "food")) {
      reasons.push("Pet food must comply with AAFCO nutritional standards");
      confidence = "high";
      estimatedCost = "$300 - $1,500";
    }

    // Generic recommendation logic
    if (reasons.length === 0) {
      if (item.required) {
        const mid = marketId.toLowerCase();
        const marketName = mid === "us" ? "US" : mid === "eu" ? "EU" : mid === "uk" ? "UK" : mid === "jp" ? "Japan" : mid === "ca" ? "Canada" : mid === "au" ? "Australia" : mid === "sg" ? "Singapore" : mid === "my" ? "Malaysia" : mid === "th" ? "Thailand" : mid === "vn" ? "Vietnam" : mid === "id" ? "Indonesia" : mid === "ph" ? "Philippines" : mid === "sa" ? "Saudi Arabia" : mid === "ae" ? "UAE" : mid === "kr" ? "South Korea" : mid === "in" ? "India" : mid === "br" ? "Brazil" : mid === "mx" ? "Mexico" : mid === "tr" ? "Turkey" : mid === "nz" ? "New Zealand" : mid === "za" ? "South Africa" : "Unknown";
        reasons.push(`${item.name} is a baseline compliance requirement for the ${marketName} market`);
        confidence = "medium";
      } else {
        reasons.push(`${item.name} should be evaluated based on your product specifics`);
        confidence = "low";
      }
    }

    recommendations.push({
      ...item,
      reason: reasons.join("; "),
      confidence,
      estimatedCost,
      priorityLabel: confidence === "high" ? "🔴 Priority — Act now" : confidence === "medium" ? "🟡 Recommended — Improves compliance" : "🟢 Optional — Depends on product",
    });
  }

  // 按优先级排序：高优先级在前，同优先级按 severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  const confidenceOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => {
    const confDiff = confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
    if (confDiff !== 0) return confDiff;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return recommendations;
}
