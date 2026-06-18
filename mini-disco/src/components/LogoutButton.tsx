import { LogOut } from "lucide-react";
import { useAuth } from "./AuthGate";

export function LogoutButton() {
  const { isAuthenticated, logout } = useAuth();
  if (!isAuthenticated) return null;
  return (
    <button
      onClick={logout}
      className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5"
      title="Lock application"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Lock</span>
    </button>
  );
}
