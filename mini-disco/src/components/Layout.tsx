import { Link, useLocation } from "react-router-dom";
import { siteConfig } from "../data/site";
import { useState, useEffect } from "react";
import { FeedbackModal, FeedbackButton } from "./Feedback";
import { useDynamicMeta } from "../hooks/useDynamicMeta";
import { useAuth } from "./AuthGate";
import { LogOut, User } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  useDynamicMeta();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);
  const navItems = [
    { label: "AI Diagnosis", href: "/" },
    { label: "Compliance Report", href: "/report" },
    { label: "Appeal Assistant", href: "/appeal" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Dashboard", href: "/dashboard" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🐱</span>
            <span className="text-lg font-bold tracking-tight">{siteConfig.name}</span>
            <span className="hidden text-sm text-slate-400 sm:inline">{siteConfig.tagline}</span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto text-sm sm:gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {!isAuthenticated ? (
              <Link
                to="/auth"
                className="ml-2 rounded-lg px-3 py-1.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
              >
                Sign In
              </Link>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 text-xs">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-slate-300">{user.name.split(" ")[0]}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 px-2 py-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5 text-xs"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-slate-500">
        <p>© 2026 Compliance Cat — Amazon Compliance Assistant</p>
        <p className="mt-1">For reference only, not legal advice</p>
        <div className="mt-3 flex justify-center gap-4 text-xs text-slate-600">
          <Link to="/" className="hover:text-slate-400">Home</Link>
          <Link to="/report" className="hover:text-slate-400">Compliance Report</Link>
          <Link to="/appeal" className="hover:text-slate-400">Appeal Guide</Link>
        </div>
        <FeedbackButton onClick={() => setShowFeedback(true)} />
      </footer>

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  );
}