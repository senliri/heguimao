import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// 页面元数据配置
const PAGE_META: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Compliance Cat — AI Amazon Compliance Checker | CE FCC FDA PSE Report Generator",
    description: "Tell your product & target market, get instant compliance reports covering CE, FCC, FDA, PSE & more. Free AI-powered compliance assessment for Amazon sellers.",
  },
  "/report": {
    title: "Compliance Report — Detailed Certification Requirements | Compliance Cat",
    description: "View detailed compliance requirements for your product across multiple markets. Export structured reports with certification costs, timelines, and action items.",
  },
  "/appeal": {
    title: "Appeal Guide — Amazon Listing Recovery & POA Generator | Compliance Cat",
    description: "AI-powered appeal letter generator for Amazon listing removals. Get POA templates in English, Chinese, Japanese & German. Step-by-step recovery guide.",
  },
};

export function useDynamicMeta() {
  const location = useLocation();

  useEffect(() => {
    const meta = PAGE_META[location.pathname] || PAGE_META["/"];
    
    // Update document title
    document.title = meta.title;

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", meta.description);
  }, [location.pathname]);
}
