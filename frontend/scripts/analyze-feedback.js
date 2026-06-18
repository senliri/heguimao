/**
 * Feedback Analyzer - Quick CLI tool to analyze collected feedback
 * Usage: node scripts/analyze-feedback.js
 */

const fs = require("fs");
const path = require("path");

const FEEDBACK_PATH = path.join(__dirname, "..", "..", "functions", "feedback.json");

// 读取反馈数据
let feedbacks = [];
try {
  if (fs.existsSync(FEEDBACK_PATH)) {
    feedbacks = JSON.parse(fs.readFileSync(FEEDBACK_PATH, "utf8"));
  }
} catch {
  console.log("No feedback data found yet.");
  process.exit(0);
}

if (feedbacks.length === 0) {
  console.log("No feedback submitted yet.\n");
  process.exit(0);
}

// 统计
const total = feedbacks.length;
const byType = {};
const byCategory = {};
const byPriority = {};
const byStatus = {};
const byPage = {};

feedbacks.forEach((f) => {
  byType[f.type] = (byType[f.type] || 0) + 1;
  byCategory[f.category] = (byCategory[f.category] || 0) + 1;
  byPriority[f.priority] = (byPriority[f.priority] || 0) + 1;
  byStatus[f.status] = (byStatus[f.status] || 0) + 1;
  byPage[f.page] = (byPage[f.page] || 0) + 1;
});

console.log("=".repeat(50));
console.log("  COMPLIANCE CAT — FEEDBACK ANALYSIS");
console.log("=".repeat(50));
console.log(`\nTotal Feedback: ${total}`);

console.log("\n📊 By Type:");
Object.entries(byType).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

console.log("\n🏷️  By Category:");
Object.entries(byCategory).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

console.log("\n🚨 By Priority:");
Object.entries(byPriority).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

console.log("\n📄 By Page:");
Object.entries(byPage).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

// 紧急 Bug 列表
const criticalBugs = feedbacks.filter(
  (f) => f.priority === "critical" || (f.category === "bug" && f.priority === "high")
);

if (criticalBugs.length > 0) {
  console.log("\n🚨 URGENT BUGS:");
  criticalBugs.forEach((b) => {
    console.log(`  [${b.id}] ${b.detail.slice(0, 80)}...`);
    console.log(`    Page: ${b.page} | Date: ${b.timestamp}`);
  });
}

// 最近 5 条
console.log("\n📝 Recent Feedback:");
feedbacks.slice(-5).reverse().forEach((f) => {
  console.log(`  [${f.type}] ${f.detail.slice(0, 60)}... (${f.timestamp})`);
});
