/**
 * Keyword matcher for detecting compliance-related queries
 * 
 * Covers product categories, certification names, and marketplace terms
 */

export class KeywordMatcher {
  private readonly patterns: RegExp[];

  constructor() {
    this.patterns = [
      // Certification names
      ...this.compilePatterns([
        "CE", "FCC", "RoHS", "REACH", "UKCA", "PSE", "KC",
        "CPC", "CPSIA", "ASTM F963", "EN 71", "ISO 9001",
        "FDA", "FDA registration", "Prop 65",
        "SASO", "SABER", "SNI", "RCM", "EESS",
        "INMETRO", "ANVISA", "NOM", "COFEPRIS",
        "TELEC", "JIS", "BIS", "SRRC",
        "UN38.3", "MSDS", "IATA",
        "WEEE", "CB", "VDE", "GS",
      ]),
      // Product categories with compliance needs
      ...this.compilePatterns([
        "lithium battery", "power bank", "earbud", "bluetooth",
        "wireless charger", "USB-C", "power adapter",
        "baby bottle", "stroller", "car seat", "diaper",
        "toy", "plush", "building block",
        "skincare", "sunscreen", "cosmetic", "makeup",
        "food supplement", "vitamin", "protein powder",
        "electronic cigarette", "vape", "e-liquid",
        "magnet", "neodymium", "compass",
        "solar panel", "solar charger",
        "helmets", "bike helmet", "ski goggles",
        "matress", "crib", "baby monitor",
        "LED light", "strip light", "fairy light",
        "power tool", "drill", "saw",
        "hair dryer", "straightener", "curling iron",
        "electric toothbrush", "shaver", " epilator",
        "scale", "thermometer", "blood pressure",
        "glucose meter", "oximeter",
        "juicer", "blender", "air fryer", "toaster",
        "kettle", "coffee maker", "espresso",
        "watch", "smartwatch", "fitness tracker",
        "drone", "camera", "action camera",
        "flashlight", "headlamp", "torch",
        "earphone", "headphone", "speaker",
        "phone case", "screen protector", "cable",
        "charger", "adapter", "transformer",
        "extension cord", "power strip",
        "router", "modem", "WiFi",
        "printer", "scanner", "copier",
        "keyboard", "mouse", "webcam",
        "TV", "monitor", "display",
        "projector", "air conditioner", "heater",
        "fan", "purifier", "humidifier",
        "vacuum", "robot vacuum",
        "washing machine", "dryer",
        "refrigerator", "freezer",
        "microwave", "oven",
        "toys", "games", "board game",
        "clothing", "shoes", "jewelry",
        "sunglasses", "glasses",
        "belt", "bag", "backpack",
        "luggage", "suitcase",
        "pet food", "pet toy",
        "garden tool", "lawn mower",
        "car accessory", "dash cam",
      ]),
      // Action phrases
      ...this.compilePatterns([
        "compliance", "certification", "certificate",
        "regulated", "restrict", "ban",
        "amazon policy", "listing removed",
        "product safety", "standard",
        "import requirement", "customs",
        "legal requirement", "must have",
        "what do I need", "how to comply",
        "which certificate", "do I need",
        "required for selling", "allowed in",
        "prohibited in", "restricted in",
      ]),
    ];
  }

  private compilePatterns(words: string[]): RegExp[] {
    return words.map(w => new RegExp(`\\b${w}\\b`, 'i'));
  }

  /**
   * Match keywords in text, return matched patterns
   */
  match(text: string): string[] {
    if (!text) return [];
    const matches: string[] = [];
    for (const pattern of this.patterns) {
      if (pattern.test(text)) {
        matches.push(pattern.source.replace(/[\\b]/g, ''));
      }
    }
    return matches;
  }

  /**
   * Get the primary category from matched keywords
   */
  getCategory(matches: string[]): string {
    const categoryMap: Record<string, string> = {
      "lithium battery": "electronics",
      "power bank": "electronics",
      "baby bottle": "baby",
      "stroller": "baby",
      "car seat": "baby",
      "toy": "toys",
      "plush": "toys",
      "skincare": "beauty",
      "sunscreen": "beauty",
      "cosmetic": "beauty",
      "food supplement": "health_supplements",
      "vitamin": "health_supplements",
      "electronic cigarette": "electronics",
      "helmet": "sports",
      "watch": "jewelry",
      "smartwatch": "electronics",
      "drone": "electronics",
      "earphone": "electronics",
      "headphone": "electronics",
      "speaker": "electronics",
      "phone case": "electronics",
      "charger": "electronics",
      "adapter": "electronics",
      "LED light": "electronics",
      "power tool": "electronics",
      "hair dryer": "beauty",
      "thermometer": "health",
      "blood pressure": "health",
      "juicer": "home",
      "blender": "home",
      "air fryer": "home",
      "kettle": "home",
      "coffee maker": "home",
      "camera": "electronics",
      "flashlight": "electronics",
      "router": "electronics",
      "printer": "office",
      "keyboard": "electronics",
      "mouse": "electronics",
      "TV": "electronics",
      "projector": "electronics",
      "vacuum": "home",
      "washing machine": "home",
      "refrigerator": "home",
      "microwave": "home",
      "sunglasses": "clothing",
      "belt": "clothing",
      "bag": "luggage_travel",
      "backpack": "luggage_travel",
      "luggage": "luggage_travel",
      "suitcase": "luggage_travel",
      "pet food": "pet",
      "garden tool": "garden",
      "car accessory": "auto",
    };

    for (const match of matches) {
      if (categoryMap[match.toLowerCase()]) {
        return categoryMap[match.toLowerCase()];
      }
    }
    return "general";
  }
}

export const keywordMatcher = new KeywordMatcher();
