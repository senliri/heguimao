import { useState } from "react";
import { useAuth } from "../components/AuthGate";
import { logoutUser, getCurrentUser, getUsers, saveUsers, verifyPassword, enhancedHash } from "../lib/auth";
import { User, Mail, Calendar, Clock, Shield, LogOut, Key, Edit2, Crown, Zap, Star } from "lucide-react";
import { getSubscription, PLAN_CONFIG, type PlanType } from "../lib/subscription";

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
      setError("All password fields are required");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    const users = getUsers();
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const idx = users.findIndex(u => u.email === currentUser.email);
    if (idx === -1) {
      setError("User not found");
      return;
    }
    
    // Verify old password using the same PBKDF2 verifier as auth.ts
    const isValid = await verifyPassword(oldPassword, users[idx].passwordHash);
    if (!isValid) {
      setError("Current password is incorrect");
      return;
    }
    
    // Update password with PBKDF2 hash (must match auth.ts enhancedHash)
    users[idx].passwordHash = await enhancedHash(newPassword);
    saveUsers(users);
    setMsg("Password changed successfully");
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
          Account Information
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <Mail className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Email</div>
              <div className="text-sm text-white">{user.email}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <Calendar className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Member Since</div>
              <div className="text-sm text-white">{new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <Clock className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Last Login</div>
              <div className="text-sm text-white">{new Date(user.lastLogin).toLocaleString()}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <Shield className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-500">User ID</div>
              <div className="text-sm text-white font-mono">{user.id}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Subscription</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Crown className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Current Plan</div>
              <div className="text-white font-medium capitalize">{getSubscription().plan}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Zap className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">API Calls Used</div>
              <div className="text-white font-medium">{getSubscription().apiCallsUsed} / {getSubscription().apiCallsLimit}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Star className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Reports Generated</div>
              <div className="text-white font-medium">{getSubscription().reportsGenerated} / {getSubscription().maxReports}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Calendar className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Expires</div>
              <div className="text-white font-medium">{getSubscription().expiresAt ? new Date(getSubscription().expiresAt).toLocaleDateString() : 'Never'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <button
          onClick={() => setShowChangePassword(!showChangePassword)}
          className="flex items-center gap-2 text-lg font-semibold text-white w-full"
        >
          <Key className="h-4 w-4" />
          Change Password
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
              placeholder="Current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 transition"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 transition"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 transition"
            />
            <button
              onClick={handleChangePassword}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Update Password
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Statistics</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-blue-400">-</div>
            <div className="text-xs text-slate-500 mt-1">Diagnoses</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-amber-400">-</div>
            <div className="text-xs text-slate-500 mt-1">Appeals</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-green-400">-</div>
            <div className="text-xs text-slate-500 mt-1">Reports</div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/20 flex items-center justify-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
}
