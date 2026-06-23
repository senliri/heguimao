// System Monitor — runtime health check & logging
// This is for the developer (AutoClaw) to diagnose issues

export interface MonitorEntry {
  id: string;
  timestamp: number;
  type: "info" | "warning" | "error" | "success";
  category: "api" | "cache" | "auth" | "operation" | "system" | "route" | "render";
  message: string;
  details?: Record<string, unknown>;
}

// Global error handler — catches unhandled errors
function setupGlobalErrorHandler() {
  if (typeof window === "undefined") return;
  
  // Catch uncaught JS errors
  window.addEventListener("error", (event) => {
    logMonitor({
      type: "error",
      category: "system",
      message: `Unhandled error: ${event.message || "Unknown"}`,
      details: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: (event.error as Error)?.stack || null,
      },
    });
  });

  // Catch unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    logMonitor({
      type: "error",
      category: "system",
      message: `Unhandled promise rejection: ${event.reason?.message || event.reason?.toString() || "Unknown"}`,
      details: {
        reason: String(event.reason),
      },
    });
  });
}

// Run on module load
setupGlobalErrorHandler();

const LOG_KEY = "compliance_cat_monitor_log";
const MAX_LOG_ENTRIES = 500; // Keep more history for debugging

/**
 * Append a monitoring entry to localStorage
 */
export function logMonitor(entry: Omit<MonitorEntry, "id" | "timestamp">): MonitorEntry {
  const log = getLog();
  const newEntry: MonitorEntry = {
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
  };
  log.unshift(newEntry);
  // Keep only the last MAX_LOG_ENTRIES
  while (log.length > MAX_LOG_ENTRIES) {
    log.pop();
  }
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  } catch {
    // localStorage full — clear oldest entries
    const trimmed = log.slice(0, MAX_LOG_ENTRIES / 2);
    localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
  }
  return newEntry;
}

/**
 * Get all log entries
 */
export function getLog(): MonitorEntry[] {
  try {
    const data = localStorage.getItem(LOG_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Clear all log entries
 */
export function clearLog(): void {
  try {
    localStorage.removeItem(LOG_KEY);
  } catch {
    // silent
  }
}

/**
 * Filter logs by type
 */
export function filterLogs(type: MonitorEntry["type"]): MonitorEntry[] {
  return getLog().filter(l => l.type === type);
}

/**
 * Filter logs by category
 */
export function filterLogsByCategory(category: MonitorEntry["category"]): MonitorEntry[] {
  return getLog().filter(l => l.category === category);
}

/**
 * Get summary statistics
 */
export function getLogStats() {
  const logs = getLog();
  const info = logs.filter(l => l.type === "info").length;
  const warnings = logs.filter(l => l.type === "warning").length;
  const errors = logs.filter(l => l.type === "error").length;
  const successes = logs.filter(l => l.type === "success").length;

  return {
    total: logs.length,
    info,
    warnings,
    errors,
    successes,
    lastEntry: logs[0] || null,
  };
}

/**
 * Check system health — API connectivity, cache status, localStorage usage
 */
export async function checkSystemHealth(): Promise<{
  apiConnected: boolean;
  cacheStatus: string;
  localStorageUsage: string;
  lastError: string | null;
  uptime: number;
}> {
  const startTime = performance.now();

  // Check API connectivity
  let apiConnected = false;
  try {
    const response = await fetch("/v1/models", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    apiConnected = response.ok;
  } catch {
    apiConnected = false;
  }

  // Check localStorage usage
  let localStorageUsage = "0 KB";
  try {
    let totalBytes = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalBytes += localStorage[key].length + key.length;
      }
    }
    localStorageUsage = `${(totalBytes / 1024).toFixed(1)} KB`;
  } catch {
    localStorageUsage = "unknown";
  }

  // Check cache status
  const cacheEntries = localStorage.getItem("compliance_cat_diagnosis_cache");
  const cacheStatus = cacheEntries ? "active" : "empty";

  // Get last error from localStorage
  let lastError: string | null = null;
  try {
    const errorLog = localStorage.getItem("compliance_cat_error_log");
    if (errorLog) {
      const errors = JSON.parse(errorLog);
      if (errors.length > 0) {
        lastError = errors[0].message || "Unknown error";
      }
    }
  } catch {
    // silent
  }

  const uptime = Math.round(performance.now() - startTime);

  return {
    apiConnected,
    cacheStatus,
    localStorageUsage,
    lastError,
    uptime,
  };
}
