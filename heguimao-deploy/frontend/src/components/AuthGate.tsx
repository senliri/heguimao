import { useState, useEffect, createContext, useContext, useRef } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getSession, logoutUser, getCurrentUser, ensureDemoUser, type User } from "../lib/auth";
import { logMonitor } from "../lib/monitor";

const AUTH_CONTEXT = "compliance-cat-auth-v2";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  logout: () => {},
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const prevSessionRef = useRef<string | null>(null);

  // Callback to reload auth state from localStorage
  const reloadAuth = () => {
    const session = getSession();
    if (session.isAuthenticated && session.user) {
      setUser(session.user);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Expose reloadAuth on window for auth page to call after login/register
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__reloadAuth__ = reloadAuth;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as unknown as Record<string, unknown>).__reloadAuth__;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    
    const initAuth = async () => {
      console.log('[Auth] initAuth: starting');
      // Ensure demo user exists on first load
      await ensureDemoUser();
      
      // Check session on mount
      const session = getSession();
      console.log('[Auth] initAuth: session=', session);
      console.log('[Auth] initAuth: localStorage session=', localStorage.getItem('compliance_cat_session'));
      if (session.isAuthenticated && session.user && !cancelled) {
        setUser(session.user);
        setIsAuthenticated(true);
      }
      if (!cancelled) {
        setIsLoading(false);
      }
    };
    
    logMonitor({ type: "info", category: "system", message: "App initialized", details: { directApi: import.meta.env.VITE_DIRECT_API === "1" } });
    initAuth();
    
    // Use polling to detect localStorage changes
    // storage event only fires in OTHER tabs, not same tab
    const interval = setInterval(() => {
      if (cancelled) return;
      const currentSession = localStorage.getItem('compliance_cat_session');
      if (currentSession !== prevSessionRef.current) {
        prevSessionRef.current = currentSession;
        const session = getSession();
        if (session.isAuthenticated && session.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          console.log('[Auth] Session changed, updated state');
        } else if (!session.isAuthenticated) {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    }, 1000);
    
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const logout = () => {
    logoutUser();
    setUser(null);
    setIsAuthenticated(false);
    logMonitor({ type: "info", category: "auth", message: "User logged out" });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * AuthGate — renders children if authenticated, otherwise renders the /auth route.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
