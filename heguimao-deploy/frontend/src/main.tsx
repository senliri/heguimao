import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";

// ── Global Error Capture (for production debugging) ──
// Catches errors outside React's ErrorBoundary (async code, event handlers, etc.)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[GlobalError]', event.message, event.filename, event.lineno, event.colno, event.error);
    // Store for later retrieval
    (window as unknown as Record<string, unknown>).__GLOBAL_ERRORS__ = (window as unknown as Record<string, unknown>).__GLOBAL_ERRORS__ || [];
    ((window as unknown as Record<string, unknown>).__GLOBAL_ERRORS__ as Array<unknown>).push({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[UnhandledPromise]', event.reason);
    (window as unknown as Record<string, unknown>).__PROMISE_REJECTIONS__ = (window as unknown as Record<string, unknown>).__PROMISE_REJECTIONS__ || [];
    ((window as unknown as Record<string, unknown>).__PROMISE_REJECTIONS__ as Array<unknown>).push({
      reason: String(event.reason?.message || event.reason || 'unknown'),
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);