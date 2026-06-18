import { useState, useEffect, createContext, useContext } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getSession, logoutUser, getCurrentUser, ensureDemoUser, type User } from "../lib/auth";

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

  useEffect(() => {
    let cancelled = false;
    
    const initAuth = async () => {
      // Ensure demo user exists on first load
      await ensureDemoUser();
      
      // Check session on mount
      const session = getSession();
      if (session.isAuthenticated && session.user && !cancelled) {
        setUser(session.user);
        setIsAuthenticated(true);
      }
      if (!cancelled) {
        setIsLoading(false);
      }
    };
    
    initAuth();
    
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = () => {
    logoutUser();
    setUser(null);
    setIsAuthenticated(false);
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
