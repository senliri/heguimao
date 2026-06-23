import { describe, it, expect } from "vitest";
import { inferProductProfile, generateRecommendations } from "../../src/lib/recommend";
import type { ComplianceItem } from "../../src/data/site";

describe("inferProductProfile", () => {
  it("should detect battery for power bank", () => {
    const profile = inferProductProfile("electronics", "power-bank");
    expect(profile.hasBattery).toBe(true);
  });

  it("should detect wireless for bluetooth headphones", () => {
    const profile = inferProductProfile("electronics", "headphone");
    expect(profile.hasWireless).toBe(true);
  });

  it("should detect children product for toys", () => {
    const profile = inferProductProfile("toys", "plush");
    expect(profile.isChildrenProduct).toBe(true);
  });

  it("should detect food contact for kitchen tools", () => {
    const profile = inferProductProfile("home", "kitchen-tool");
    expect(profile.foodContact).toBe(true);
  });

  it("should detect medical for thermometers", () => {
    const profile = inferProductProfile("health", "thermometer");
    expect(profile.medical).toBe(true);
  });

  it("should detect electrical for chargers", () => {
    const profile = inferProductProfile("electronics", "charger");
    expect(profile.electrical).toBe(true);
  });

  it("should detect wearable for apparel", () => {
    const profile = inferProductProfile("clothing", "apparel");
    expect(profile.wearable).toBe(true);
  });

  it("should detect outdoor for camping gear", () => {
    const profile = inferProductProfile("sports", "camping");
    expect(profile.outdoor).toBe(true);
  });

  it("should detect chemicals for cosmetics", () => {
    const profile = inferProductProfile("beauty", "skincare");
    expect(profile.containsChemicals).toBe(true);
  });

  it("should handle unknown category gracefully", () => {
    const profile = inferProductProfile("unknown", "unknown");
    expect(profile).toBeDefined();
    expect(typeof profile.hasBattery).toBe("boolean");
  });
});

describe("generateRecommendations", () => {
  const sampleCompliance: ComplianceItem[] = [
    {
      name: "FCC Certification",
      required: true,
      desc: "Federal Communications Commission",
      severity: "high",
      action: "Apply for FCC ID",
      estimatedTime: "2-4 weeks",
      needsThirdParty: true,
    },
    {
      name: "CE Marking",
      required: false,
      desc: "Conformit\u00e9 Europ\u00e9enne",
      severity: "medium",
      action: "Self-declare conformity",
      estimatedTime: "1-2 weeks",
      needsThirdParty: false,
    },
  ];

  it("should return recommendations for electronic product in US", () => {
    const profile = inferProductProfile("electronics", "charger");
    const recs = generateRecommendations(sampleCompliance, "us", profile, "electronics");
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].confidence).toBeDefined();
    expect(recs[0].priorityLabel).toBeDefined();
  });

  it("should prioritize high-confidence recommendations", () => {
    const profile = inferProductProfile("toys", "plush");
    const recs = generateRecommendations(sampleCompliance, "us", profile, "toys");
    const highConf = recs.filter((r) => r.confidence === "high");
    const medConf = recs.filter((r) => r.confidence === "medium");
    if (highConf.length > 0 && medConf.length > 0) {
      const firstHighIdx = recs.indexOf(highConf[0]);
      const firstMedIdx = recs.indexOf(medConf[0]);
      expect(firstHighIdx).toBeLessThan(firstMedIdx);
    }
  });

  it("should return empty for empty input", () => {
    const profile = inferProductProfile("electronics", "charger");
    const recs = generateRecommendations([], "us", profile, "electronics");
    expect(recs).toEqual([]);
  });

  it("should include estimated cost in recommendations", () => {
    const profile = inferProductProfile("electronics", "charger");
    const recs = generateRecommendations(sampleCompliance, "us", profile, "electronics");
    for (const rec of recs) {
      expect(rec.estimatedCost).toBeDefined();
      expect(rec.estimatedCost).not.toBe("");
    }
  });
});
