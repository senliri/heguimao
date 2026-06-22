import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle, XCircle, User as UserIcon, ArrowLeft } from "lucide-react";
import { registerUser, loginUser, requestPasswordReset, verifyResetToken, resetPassword, type User, getSession } from "../lib/auth";

type Mode = "login" | "register" | "reset-request" | "reset-password";

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already logged in, redirect if so
  useEffect(() => {
    const session = getSession();
    if (session.isAuthenticated && session.user) {
      navigate("/", { replace: true });
      return;
    }
    setCheckingAuth(false);
  }, [navigate]);

  // Check URL query params (not hash) for reset password token on mount
  useEffect(() => {
    if (checkingAuth) return; // Wait for auth check
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setResetToken(token);
      setMode("reset-password");
      const verification = verifyResetToken(token);
      if (!verification.valid) {
        setError("This reset link has expired or is invalid. Please request a new one.");
      }
    }
  }, [checkingAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      let result;
      
      if (mode === "register") {
        result = await registerUser(email, password, name);
        if (result.success) {
          // Auto-login after registration
          result = await loginUser(email, password);
        }
      } else if (mode === "reset-request") {
        result = await requestPasswordReset(email);
        if (result.success) {
          setSuccess("We've sent a password reset link to your email. Please check your inbox.");
          setLoading(false);
          return;
        }
      } else if (mode === "reset-password") {
        if (!resetToken) {
          setError("No reset token found. Please request a new password reset link.");
          setLoading(false);
          return;
        }
        result = await resetPassword(resetToken, password);
        if (result.success) {
          setSuccess("Password reset successful! You can now sign in with your new password.");
          setTimeout(() => {
            setMode("login");
          }, 2000);
          setLoading(false);
          return;
        }
      } else {
        result = await loginUser(email, password);
      }

      if (result.success && result.user) {
        setSuccess(mode === "register" ? "Registration successful! Logging you in..." : "Login successful!");
        
        // Show success message briefly, then navigate to home
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 800);
      } else {
        setError(result.error || "Authentication failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {checkingAuth ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          Checking authentication...
        </div>
      ) : (
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/20 mb-4">
            <span className="text-3xl">🐱</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Compliance Cat</h1>
          <p className="text-slate-400 mt-2">
            {mode === "login" ? "Sign in to your account" : 
             mode === "register" ? "Create your account" :
             mode === "reset-request" ? "Reset your password" :
             mode === "reset-password" ? "Set new password" :
             "Compliance Cat"}
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
          {/* Mode Toggle (only show for login/register modes) */}
          {(mode === "login" || mode === "register") && (
          <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
            <button
              onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                mode === "login" 
                  ? "bg-blue-600 text-white shadow-lg" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                mode === "register" 
                  ? "bg-blue-600 text-white shadow-lg" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>
          )}
          
          {/* Back button for reset modes */}
          {(mode === "reset-request" || mode === "reset-password") && (
          <button
            onClick={() => { setMode("login"); setError(""); setSuccess(""); setResetToken(null); }}
            className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </button>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field (register only) */}
            {mode === "register" && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="Full name"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 transition"
                required
              />
            </div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="Email address"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 transition"
                required
              />
            </div>

            {/* Password */}
            {mode !== "reset-request" && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Password"
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 transition"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            )}

          {/* Error/Success Messages */}
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 px-4 py-3 rounded-xl" hidden={!error}>
            <XCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-4 py-3 rounded-xl" hidden={!success}>
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "login" ? "Signing in..." : 
                   mode === "register" ? "Creating account..." :
                   mode === "reset-request" ? "Sending..." :
                   "Resetting..."}
                </>
              ) : (
                mode === "login" ? "Sign In" :
                mode === "register" ? "Create Account" :
                mode === "reset-request" ? "Send Reset Link" :
                "Reset Password"
              )}
            </button>
          </form>

          {/* Forgot password link (login mode only) */}
          <div className="mt-4 text-right" hidden={mode !== "login"}>
            <button
              type="button"
              onClick={() => { setMode("reset-request"); setError(""); setSuccess(""); setEmail(""); }}
              className="text-sm text-blue-400 hover:text-blue-300 transition"
            >
              Forgot password?
            </button>
          </div>

          {/* Password hint (register and reset-password only) */}
          <p className="text-xs text-slate-500 mt-4" hidden={!(mode === "register" || mode === "reset-password")}>
            Password must be at least 6 characters long
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-8">
          Powered by Agnes AI • Compliance Cat
        </p>
      </div>
      )}
    </div>
  );
}
