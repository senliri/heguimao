import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw,
  Clock, HardDrive, Server, Database, Trash2, ArrowLeft,
  Shield, Zap, Eye, EyeOff, Filter, Download,
} from "lucide-react";
import {
  logMonitor,
  getLog,
  clearLog,
  filterLogs,
  getLogStats,
  checkSystemHealth,
  type MonitorEntry,
} from "../lib/monitor";
import { isAuthenticated, getCurrentUser } from "../lib/auth";

type LogFilter = "all" | "info" | "warning" | "error" | "success";
type LogCategory = "all" | "api" | "cache" | "auth" | "operation" | "system";

export function Monitor() {
  const [logs, setLogs] = useState<MonitorEntry[]>([]);
  const [stats, setStats] = useState(getLogStats());
  const [health, setHealth] = useState<{
    apiConnected: boolean;
    cacheStatus: string;
    localStorageUsage: string;
    lastError: string | null;
    uptime: number;
  } | null>(null);
  const [filterType, setFilterType] = useState<LogFilter>("all");
  const [filterCategory, setFilterCategory] = useState<LogCategory>("all");
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Load logs on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [healthResult, logEntries] = await Promise.all([
        checkSystemHealth(),
        Promise.resolve(getLog()),
      ]);
      setHealth(healthResult);
      setLogs(logEntries);
      setStats(getLogStats());
      logMonitor({
        type: "info",
        category: "system",
        message: "Monitor panel refreshed",
        details: {
          totalLogs: logEntries.length,
          apiConnected: healthResult.apiConnected,
        },
      });
    } catch (err) {
      logMonitor({
        type: "error",
        category: "system",
        message: `Failed to refresh monitor data: ${(err as Error).message}`,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClearLogs = () => {
    if (confirm("Clear all monitoring logs?")) {
      clearLog();
      setLogs([]);
      setStats(getLogStats());
      logMonitor({
        type: "warning",
        category: "system",
        message: "All monitoring logs cleared",
      });
    }
  };

  const handleExportLogs = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      stats,
      health,
      logs: filteredLogs,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monitor-log-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logMonitor({
      type: "info",
      category: "system",
      message: "Logs exported to file",
      details: { totalLogs: filteredLogs.length, format: "json" },
    });
  };

  const handleHealthCheck = async () => {
    setLoading(true);
    try {
      const result = await checkSystemHealth();
      setHealth(result);
      logMonitor({
        type: result.apiConnected ? "success" : "warning",
        category: "api",
        message: result.apiConnected
          ? "API connection healthy"
          : "API connection failed",
        details: {
          apiConnected: result.apiConnected,
          localStorageUsage: result.localStorageUsage,
        },
      });
    } catch (err) {
      logMonitor({
        type: "error",
        category: "api",
        message: `Health check failed: ${(err as Error).message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterType !== "all" && log.type !== filterType) return false;
    if (filterCategory !== "all" && log.category !== filterCategory) return false;
    return true;
  });

  const typeColors: Record<string, string> = {
    info: "text-blue-400 bg-blue-500/10",
    warning: "text-yellow-400 bg-yellow-500/10",
    error: "text-red-400 bg-red-500/10",
    success: "text-green-400 bg-green-500/10",
  };

  const categoryIcons: Record<string, string> = {
    api: "🌐",
    cache: "💾",
    auth: "🔐",
    operation: "⚙️",
    system: "📊",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-400" />
            System Monitor
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time health check & operation logs
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleHealthCheck}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Check Health
          </button>
          <button
            onClick={handleExportLogs}
            className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 transition hover:bg-green-500/20"
          >
            <Download className="h-4 w-4" />
            Export Logs
          </button>
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Health Overview Cards */}
      {health && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-slate-400">API Status</span>
            </div>
            <div className="flex items-center gap-2">
              {health.apiConnected ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
              <span className={`text-sm font-medium ${health.apiConnected ? "text-green-400" : "text-red-400"}`}>
                {health.apiConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-slate-400">Cache</span>
            </div>
            <span className="text-sm font-medium text-slate-300 capitalize">
              {health.cacheStatus}
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-slate-400">Storage</span>
            </div>
            <span className="text-sm font-medium text-slate-300">
              {health.localStorageUsage}
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-slate-400">Errors</span>
            </div>
            <span className="text-sm font-medium text-red-400 truncate">
              {health.lastError || "None"}
            </span>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.info}</div>
          <div className="text-xs text-slate-400 mt-1">Info</div>
        </div>
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.warnings}</div>
          <div className="text-xs text-slate-400 mt-1">Warnings</div>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.errors}</div>
          <div className="text-xs text-slate-400 mt-1">Errors</div>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.successes}</div>
          <div className="text-xs text-slate-400 mt-1">Success</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <div className="text-2xl font-bold text-slate-300">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-1">Total</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as LogFilter)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 outline-none focus:border-blue-500/50"
          >
            <option value="all">All Types</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="success">Success</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as LogCategory)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 outline-none focus:border-blue-500/50"
          >
            <option value="all">All Categories</option>
            <option value="api">API</option>
            <option value="cache">Cache</option>
            <option value="auth">Auth</option>
            <option value="operation">Operation</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      {/* Log Entries */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <h3 className="text-sm font-semibold text-white">Recent Logs ({filteredLogs.length})</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <EyeOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No logs match the current filters</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredLogs.map((log) => (
                <div key={log.id} className="px-4 py-3 hover:bg-white/[0.02] transition">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[log.type]}`}>
                      {log.type.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">{log.message}</span>
                        <span className="text-xs text-slate-500">
                          {categoryIcons[log.category] || "📌"} {log.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span className="text-xs text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {log.details && (
                        <button
                          onClick={() => setShowDetails(prev => ({ ...prev, [log.id]: !prev[log.id] }))}
                          className="mt-1 text-xs text-blue-400 hover:text-blue-300 transition"
                        >
                          {showDetails[log.id] ? "Hide Details ▲" : "Show Details ▼"}
                        </button>
                      )}
                      {showDetails[log.id] && log.details && (
                        <pre className="mt-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg overflow-auto max-h-32">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-slate-600">
        <p>System Monitor v1.0 • Data stored in browser localStorage</p>
        <p className="mt-1">Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
