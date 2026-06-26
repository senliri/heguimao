/**
 * Compliance Cat - Reddit Devvit App Entry Point
 * 
 * This Devvit app automatically detects compliance-related questions
 * from Amazon sellers on Reddit and provides instant certification answers.
 */

import { handlePostCreation } from "./handlers/post-handler";
import { handleCommentTrigger } from "./handlers/comment-handler";
import { complianceQueryBlock } from "./ui/query-block";
import { keywordMatcher } from "./utils/keyword-matcher";
import { complianceEngine } from "./compliance/engine";

// Devvit app setup - actual API calls handled by Devvit framework
// This file registers the app structure

export { complianceQueryBlock };
export { keywordMatcher };
export { complianceEngine };

// ─── Event Handlers ───────────────────────────────────────────────

// These will be registered by Devvit framework
// OnPostCreate and OnCommentCreate handlers are defined in handlers/

// ─── HTTP API Endpoints ───────────────────────────────────────────

// /api/compliance/:category/:market - GET
// /api/compliance/search - GET  
// /api/compliance/analyze - POST

// ─── Sidebar Widget ──────────────────────────────────────────────

// Defined in query-block.tsx
