import React, { Suspense, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { Layout } from "./components/Layout";
import { AuthProvider, AuthGate, useAuth } from "./components/AuthGate";
// import { I18nProvider } from "./lib/i18n-context";
import { Home } from "./pages/Home";
import { Appeal } from "./pages/Appeal";
import { Report } from "./pages/Report";
import { AuthPage } from "./pages/AuthPage";
import { Monitor } from "./pages/Monitor";
import { Pricing } from "./pages/Pricing";

// Lazy-loaded routes — reduces initial bundle size
const Portfolio = React.lazy(() => import("./pages/Portfolio"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));

// Loading fallback for Suspense boundaries
function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
    </div>
  );
}

// Error boundary fallback — prevents black screen
// Shows detailed error info in production for debugging
function ErrorFallback({ error, resetErrorBoundary }: { error: Error | null; resetErrorBoundary?: () => void }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-lg w-full">
        <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">出了点问题</h2>
        <p className="text-slate-400 mb-4">页面加载时发生了错误，请刷新重试。</p>

        {error && (
          <>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mb-3 px-4 py-1.5 text-xs bg-red-900/40 text-red-300 rounded hover:bg-red-900/60 transition"
            >
              {showDetails ? '隐藏' : '显示'} 错误详情
            </button>
            {showDetails && (
              <div className="text-left">
                <div className="text-xs font-semibold text-red-400 mb-1">错误信息：</div>
                <pre className="text-xs text-red-300 bg-red-950/50 p-3 rounded-lg overflow-auto max-h-48 mb-3 whitespace-pre-wrap break-all">
                  {error.message}
                </pre>
                {error.stack && (
                  <>
                    <div className="text-xs font-semibold text-red-400 mb-1">堆栈跟踪：</div>
                    <pre className="text-xs text-red-400 bg-red-950/30 p-3 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap break-all font-mono leading-relaxed">
                      {error.stack}
                    </pre>
                  </>
                )}
                <div className="text-xs text-slate-500 mt-2">
                  User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}
                </div>
                <div className="text-xs text-slate-500">
                  URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
                </div>
                <div className="text-xs text-slate-500">
                  Time: {new Date().toISOString()}
                </div>
              </div>
            )}
          </>
        )}

        <button
          onClick={() => {
            // Try clearing potentially corrupted localStorage
            try { localStorage.clear(); } catch {}
            window.location.reload();
          }}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mr-2"
        >
          刷新页面
        </button>
        <button
          onClick={() => {
            try { localStorage.clear(); } catch {}
            window.location.reload();
          }}
          className="mt-4 px-6 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition text-sm"
        >
          清除缓存并刷新
        </button>
      </div>
    </div>
  );
}

// Protected layout wrapper — just passes through children.
// Auth loading is handled centrally by AuthProvider, not here.
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


export function App() {
  const [initError, setInitError] = useState<Error | null>(null);
  
  // Catch any initialization errors
  useEffect(() => {
    try {
      // Test if crypto.subtle is available (needed for auth)
      if (typeof crypto?.subtle?.digest !== 'function') {
        throw new Error('Web Crypto API not available. Please use a modern browser.');
      }
    } catch (e) {
      setInitError(e instanceof Error ? e : new Error(String(e)));
    }
  }, []);
  
  if (initError) {
    return <ErrorFallback error={initError} />;
  }

  return (
    <BrowserRouter>
      {/* <I18nProvider> */}
        <ErrorBoundary>
          <AuthProvider>
            <Routes>
              <Route path="/" element={
                <ProtectedLayout>
                  <Layout><Home /></Layout>
                </ProtectedLayout>
              } />
              <Route path="/report" element={
                <ProtectedLayout>
                  <Layout><Report /></Layout>
                </ProtectedLayout>
              } />
              <Route path="/appeal" element={
                <ProtectedLayout>
                  <Layout><Appeal /></Layout>
                </ProtectedLayout>
              } />
              <Route path="/monitor" element={
                <ProtectedLayout>
                  <Layout><Monitor /></Layout>
                </ProtectedLayout>
              } />
              <Route path="/pricing" element={
                <ProtectedLayout>
                  <Layout><Pricing /></Layout>
                </ProtectedLayout>
              } />
              <Route path="/portfolio" element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedLayout>
                    <AuthGate>
                      <Layout><Portfolio /></Layout>
                    </AuthGate>
                  </ProtectedLayout>
                </Suspense>
              } />
              <Route path="/dashboard" element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedLayout>
                    <AuthGate>
                      <Layout><Dashboard /></Layout>
                    </AuthGate>
                  </ProtectedLayout>
                </Suspense>
              } />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </ErrorBoundary>
      {/* </I18nProvider> */}
    </BrowserRouter>
  );
}

// Simple error boundary class component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log all errors including DOM manipulation errors for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // Also expose on window for manual inspection
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__LAST_ERROR__ = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      };
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}