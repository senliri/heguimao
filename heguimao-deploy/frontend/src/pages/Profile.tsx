import { t, useState} from "react";
import { useAuth } from "../components/AuthGate";
import { logoutUser, getCurrentUser, getUsers, saveUsers, verifyPassword, enhancedHash } from "../lib/auth";
import { User, Mail, Calendar, Clock, Shield, LogOut, Key, Edit2, Crown, Zap, Star } from "lucide-react";
import { gett("profile.subscription"), PLAN_CONFIG, type PlanType } from "../lib/subscription";

export function Profile() {
  const { user, logout } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleLogout = () => {
    logout();
    logoutUser();
    window.location.href = "/auth";
  };

  const handleChangePassword = async () => {
    setError("");
    setMsg("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(t("profile.all_required"));
      return;
    }
    if (newPassword.length < 6) {
      setError(t("profile.password_min"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("profile.password_mismatch"));
      return;
    }
    
    const users = getUsers();
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const idx = users.findIndex(u => u.email === currentUser.email);
    if (idx === -1) {
      setError(t("profile.user_not_found"));
      return;
    }
    
    // Verify old password using the same PBKDF2 verifier as auth.ts
    const isValid = await verifyPassword(oldPassword, users[idx].passwordHash);
    if (!isValid) {
      setError(t("profile.password_wrong"));
      return;
    }
    
    // Update password with PBKDF2 hash (must match auth.ts enhancedHash)
    users[idx].passwordHash = await enhancedHash(newPassword);
    saveUsers(users);
    setMsg(t("profile.password_changed"));
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowChangePassword(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center">
          <User className="h-8 w-8 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{user.name}</h1>
          <p className="text-slate-400 text-sm">{user.email}</p>
        </div>
      </div>

      {/* Profile Info */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Edit2 className="h-4 w-4" />
          t("profile.account_info")
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <Mail className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-500">t("profile.email")</div>
              <div className="text-sm text-white">{user.email}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <Calendar className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-500">t("profile.member_since")</div>
              <div className="text-sm text-white">{new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <Clock className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-500">t("profile.last_login")</div>
              <div className="text-sm text-white">{new Date(user.lastLogin).toLocaleString()}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <Shield className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-500">t("profile.user_id")</div>
              <div className="text-sm text-white font-mono">{user.id}</div>
            </div>
          </div>
        </div>
      </div>

      {/* t("profile.subscription") Info */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="text-lg font-semibold text-white mb-4">t("profile.subscription")</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Crown className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">t("profile.current_plan")</div>
              <div className="text-white font-medium capitalize">{gett("profile.subscription")().plan}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Zap className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">t("profile.api_used")</div>
              <div className="text-white font-medium">{gett("profile.subscription")().apiCallsUsed} / {gett("profile.subscription")().apiCallsLimit}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Star className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">t("profile.reports_generated")</div>
              <div className="text-white font-medium">{gett("profile.subscription")().reportsGenerated} / {gett("profile.subscription")().maxt("profile.reports")}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Calendar className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">t("profile.expires")</div>
              <div className="text-white font-medium">{gett("profile.subscription")().expiresAt ? new Date(gett("profile.subscription")().expiresAt).toLocaleDateString() : 't("profile.never")'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* t("profile.change_password") */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <button
          onClick={() => setShowChangePassword(!showChangePassword)}
          className="flex items-center gap-2 text-lg font-semibold text-white w-full"
        >
          <Key className="h-4 w-4" />
          t("profile.change_password")
          <span className="ml-auto text-slate-400">{showChangePassword ? "▲" : "▼"}</span>
        </button>
        
        {showChangePassword && (
          <div className="mt-4 space-y-3">
            {msg && (
              <div className="text-sm text-green-400 bg-green-500/10 px-4 py-2 rounded-xl">{msg}</div>
            )}
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 px-4 py-2 rounded-xl">{error}</div>
            )}
            <input
              type="password"
              placeholder=t("profile.current_pw")
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 transition"
            />
            <input
              type="password"
              placeholder=t("profile.new_pw")
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 transition"
            />
            <input
              type="password"
              placeholder=t("profile.confirm_pw")
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 transition"
            />
            <button
              onClick={handleChangePassword}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              t("profile.update_pw")
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">t("profile.statistics")</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-blue-400">-</div>
            <div className="text-xs text-slate-500 mt-1">t("profile.diagnoses")</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-amber-400">-</div>
            <div className="text-xs text-slate-500 mt-1">t("profile.appeals")</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-green-400">-</div>
            <div className="text-xs text-slate-500 mt-1">t("profile.reports")</div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/20 flex items-center justify-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        t("profile.sign_out")
      </button>
    </div>
  );
}
