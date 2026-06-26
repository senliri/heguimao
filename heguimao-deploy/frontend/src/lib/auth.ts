// User management module — hybrid localStorage + backend API auth
import { translateError } from "./i18n.js";


export interface User {
  id?: string;
  email: string;
  name: string;
  createdAt: number;
  lastLogin?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const USERS_KEY = "compliance_cat_users";
const SESSION_KEY = "compliance_cat_session";
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || "https://heguimao-api.senliri028.workers.dev/auth";

/**
 * Generate a simple unique ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Legacy simple hash — used only for backward-compat migration check.
 * DO NOT use for new passwords.
 */
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Hash a password using PBKDF2-SHA256 via Web Crypto API.
 * Returns "pbkdf2_<base64salt>_<base64hash>" format.
 *
 * NOTE: localStorage-based auth is inherently less secure than server-side bcrypt.
 * This improves things but does not eliminate risk. Consider migrating to a
 * backend auth service for production.
 */
export async function enhancedHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  // 16-byte random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 100,000 iterations of PBKDF2-SHA256 (OWASP recommended minimum)
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256, // 32 bytes = 256 bits
  );

  const hashBytes = new Uint8Array(derivedBits);
  const b64Salt = btoa(String.fromCharCode(...salt)).replace(/=+$/, "");
  const b64Hash = btoa(String.fromCharCode(...hashBytes)).replace(/=+$/, "");
  return `pbkdf2_${b64Salt}_${b64Hash}`;
}

/**
 * Check if a stored hash was produced by the old simpleHash (for migration detection).
 */
function isLegacyHash(hash: string): boolean {
  // Old hashes are plain hex strings (e.g. "a3f2b1") — 4 to ~10 hex chars
  return /^[0-9a-f]{4,16}$/i.test(hash);
}

/**
 * Verify a password against a stored PBKDF2 hash.
 * Exported for use by Profile.tsx password change flow.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    if (!storedHash.startsWith("pbkdf2_")) {
      // Legacy hash — use simpleHash for comparison
      return simpleHash(password) === storedHash;
    }

    const parts = storedHash.split("_");
    if (parts.length !== 3) return false;

    const [, b64Salt, b64StoredHash] = parts;
    // Pad base64 if necessary (we stripped '=' during encoding)
    const padSalt = b64Salt + "=".repeat((4 - b64Salt.length % 4) % 4);
    const padHash = b64StoredHash + "=".repeat((4 - b64StoredHash.length % 4) % 4);
    const salt = Uint8Array.from(atob(padSalt), c => c.charCodeAt(0));
    const storedHashBytes = Uint8Array.from(atob(padHash), c => c.charCodeAt(0));

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
      keyMaterial, 256
    );
    const derivedHashBytes = new Uint8Array(derivedBits);

    // Constant-time comparison to prevent timing attacks
    if (derivedHashBytes.length !== storedHashBytes.length) return false;
    let match = 0;
    for (let i = 0; i < derivedHashBytes.length; i++) {
      match |= derivedHashBytes[i] ^ storedHashBytes[i];
    }
    return match === 0;
  } catch {
    // If verification fails for any reason (bad hash format, crypto error), return false
    return false;
  }
}

/**
 * Get all registered users
 */
export function getUsers(): Array<{ email: string; passwordHash?: string; name: string; createdAt: number }> {
  try {
    const data = localStorage.getItem(USERS_KEY);

    if (!data) return [];
    const users = JSON.parse(data);
    // Data migration: ensure all users have required fields
    return users.map(u => ({
      email: u.email || '',
      passwordHash: u.passwordHash || '',
      name: u.name || '',
      createdAt: u.createdAt || Date.now()
    }));
  } catch (e) {

    return [];
  }
}

/**
 * Save users array
 */
export function saveUsers(users: Array<{ email: string; passwordHash: string; name: string; createdAt: number }>): void {
  try {

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn("Failed to save users:", e);
  }
}

/**
 * Register a new user via backend API
 */
export async function registerUser(email: string, password: string, name: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        email,
        password,
        name
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store JWT token and user info
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        user: data.user,
        token: data.token,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
      }));
      return { success: true, user: data.user as User };
    } else {
      return { success: false, error: translateError(data.error) };
    }
  } catch (err) {
    // Fallback to localStorage if backend is unavailable
    console.warn('Backend auth unavailable, falling back to localStorage');
    return fallbackRegisterUser(email, password, name);
  }
}

/**
 * Login via backend API
 */
export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email,
        password
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store JWT token and user info
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        user: data.user,
        token: data.token,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
      }));
      return { success: true, user: data.user as User };
    } else {
      return { success: false, error: translateError(data.error) };
    }
  } catch (err) {
    // Fallback to localStorage if backend is unavailable
    console.warn('Backend auth unavailable, falling back to localStorage');
    return fallbackLoginUser(email, password);
  }
}

/**
 * Fallback localStorage-based registration (when backend is unavailable)
 */
async function fallbackRegisterUser(email: string, password: string, name: string): Promise<{ success: boolean; user?: User; error?: string }> {
  // ... existing localStorage logic ...
  const users = getUsers();
  
  // Check if email already exists
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: "Email already registered" };
  }
  
  // Create user
  const user: User = {
    id: generateId(),
    email: email.toLowerCase(),
    name: name.trim(),
    createdAt: Date.now(),
    lastLogin: Date.now(),
  };
  
  // Save to users array with enhanced hash
  const passwordHash = await enhancedHash(password);
  users.push({
    email: user.email,
    passwordHash,
    name: user.name,
    createdAt: user.createdAt,
  });
  saveUsers(users);
  
  // Auto-login after registration
  const sessionToken = generateId() + "_" + btoa(user.email + Date.now().toString()).slice(0, 16);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token: sessionToken, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 }));
  
  return { success: true, user };
}

/**
 * Fallback localStorage-based login (when backend is unavailable)
 */
async function fallbackLoginUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  // ... existing localStorage logic ...
  const users = getUsers();
  const emailLower = email.toLowerCase();
  let userRecord = users.find(u => u.email.toLowerCase() === emailLower);

  if (userRecord) {
    // Verify password against stored hash (supports both PBKDF2 and legacy)
    const isValid = await verifyPassword(password, userRecord.passwordHash);
    if (!isValid) {
      userRecord = undefined;
    }
  }

  // Backward compat: migrate legacy hash users
  if (!userRecord) {
    const legacyMatch = users.find(u => u.email.toLowerCase() === emailLower && isLegacyHash(u.passwordHash));
    if (legacyMatch) {
      // Legacy user — upgrade their password to PBKDF2
      const newHash = await enhancedHash(password);
      const updatedUsers = users.map(u =>
        u.email === legacyMatch.email ? { ...u, passwordHash: newHash } : u
      );
      saveUsers(updatedUsers);
      userRecord = legacyMatch;
    }
  }

  if (!userRecord) {
    return { success: false, error: "Invalid email or password" };
  }
  
  // Update last login
  const updatedUsers = users.map(u => 
    u.email === userRecord.email ? { ...u, lastLogin: Date.now() } : u
  );
  saveUsers(updatedUsers);
  
  // Create user object (without password)
  const user: User = {
    id: generateId(),
    email: userRecord.email,
    name: userRecord.name,
    createdAt: userRecord.createdAt,
    lastLogin: Date.now(),
  };

  // Create session token
  const sessionToken = generateId() + "_" + btoa(user.email + Date.now().toString()).slice(0, 16);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token: sessionToken, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 }));
  
  return { success: true, user };
}

/**
 * Verify current session token with backend
 */
export async function verifySession(): Promise<{ success: boolean; user?: User; error?: string }> {
  const session = getSession();
  if (!session.token) {
    return { success: false, error: 'No token found' };
  }
  
  try {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify',
        token: session.token
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, user: data.user as User };
    } else {
      // Token invalid, clear session
      localStorage.removeItem(SESSION_KEY);
      return { success: false, error: translateError(data.error) };
    }
  } catch (err) {
    console.warn('Backend auth unavailable, using local session');
    return { success: session.isAuthenticated, user: session.user || undefined };
  }
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<void> {
  // Call backend logout API
  try {
    await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'logout'
      })
    });
  } catch (err) {
    console.warn('Backend logout failed, clearing local session');
  }
  
  // Clear local session
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Get current session
 */
export function getSession(): AuthState {
  try {
    const data = localStorage.getItem(SESSION_KEY);

    if (!data) return { user: null, token: null, isAuthenticated: false };
    
    const session = JSON.parse(data);

    
    // Check if session expired
    if (Date.now() > session.expiresAt) {

      localStorage.removeItem(SESSION_KEY);
      return { user: null, token: null, isAuthenticated: false };
    }
    
    // Auto-renew session if within 7 days of expiry
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (session.expiresAt - Date.now() < sevenDays) {
      session.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    }
    
    return {
      user: session.user,
      token: session.token,
      isAuthenticated: true,
    };
  } catch (e) {

    return { user: null, token: null, isAuthenticated: false };
  }
}

/**
 * Get current user info (without password)
 */
export function getCurrentUser(): User | null {
  const session = getSession();
  return session.user;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getSession().isAuthenticated;
}

/**
 * Get the current auth token (JWT from backend session)
 */
export function getAuthToken(): string | null {
  return getSession().token;
}

/**
 * Ensure demo/test user exists in localStorage
 * Call this on app initialization
 */
export async function ensureDemoUser(): Promise<User | null> {
  // Demo user disabled by default �?enable via VITE_DEMO_ENABLED=true env var
  const demoEnabled = import.meta.env.VITE_DEMO_ENABLED === "true";
  if (!demoEnabled) {
    return null;
  }
  
  const users = getUsers();
  const demoEmail = import.meta.env.VITE_DEMO_EMAIL || "demo@compliance.cat";
  const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || "demo123";
  const demoName = import.meta.env.VITE_DEMO_NAME || "Demo User";
  
  if (users.some(u => u.email.toLowerCase() === demoEmail.toLowerCase())) {
    return null; // already exists
  }
  
  const result = await registerUser(demoEmail, demoPassword, demoName);
  return result.success ? result.user : null;
}

// Production note: Set VITE_DEMO_ENABLED=false or remove this function entirely
// for production deployments.

// ── Password Reset ──────────────────────────────────────────────

const RESET_TOKENS_KEY = "compliance_cat_reset_tokens";

/**
 * Get stored reset tokens
 */
function getResetTokens(): Record<string, { email: string; token: string; expiresAt: number }> {
  try {
    const data = localStorage.getItem(RESET_TOKENS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Save reset tokens
 */
function saveResetTokens(tokens: Record<string, { email: string; token: string; expiresAt: number }>): void {
  localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(tokens));
}

/**
 * Request a password reset email
 * Returns { success: true } or { success: false, error: string }
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email) {
    return { success: false, error: "Email is required" };
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Invalid email format" };
  }
  
  // Check if user exists
  const users = getUsers();
  const userRecord = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!userRecord) {
    // Security: don't reveal that email is not registered
    return { success: true };
  }
  
  // Generate reset token
  const token = generateId() + Math.random().toString(36).substr(2, 12);
  const tokens = getResetTokens();
  
  tokens[token] = {
    email: userRecord.email,
    token,
    expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
  };
  saveResetTokens(tokens);
  
  // Send reset email via mailto: link (MVP — no server-side email)
  const resetLink = `${window.location.origin}/#reset-password/${token}`;
  const subject = "Reset Your Compliance Cat Password";
  const mailtoBody = `Hello,\n\nWe received a request to reset your password for Compliance Cat.\n\nClick the link below to set a new password:\n${resetLink}\n\nThis link expires in 30 minutes.\n\nIf you didn't request this, you can ignore this email.`;
  const mailtoUri = `mailto:${encodeURIComponent(userRecord.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailtoBody)}`;

  // Open user's default mail client
  const mailWindow = window.open(mailtoUri, '_blank');
  if (!mailWindow) {
    // Popup blocked — fall back to showing the link
    console.warn("Password reset: popup blocked. User should manually open:", resetLink);
  }

  return { success: true };
}

/**
 * Verify a reset token
 */
export function verifyResetToken(token: string): { valid: boolean; email?: string } {
  const tokens = getResetTokens();
  const entry = tokens[token];
  
  if (!entry) return { valid: false };
  if (Date.now() > entry.expiresAt) {
    // Clean up expired token
    delete tokens[token];
    saveResetTokens(tokens);
    return { valid: false };
  }
  
  return { valid: true, email: entry.email };
}

/**
 * Reset password with token
 * Returns { success: true } or { success: false, error: string }
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!token || !newPassword) {
    return { success: false, error: "Token and password are required" };
  }
  
  if (newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }
  
  const verification = verifyResetToken(token);
  if (!verification.valid) {
    return { success: false, error: "Invalid or expired reset token" };
  }
  
  const users = getUsers();
  const userIndex = users.findIndex(u => u.email === verification.email);
  
  if (userIndex === -1) {
    return { success: false, error: "User not found" };
  }
  
  // Update password with enhanced hash (await since enhancedHash is now async)
  users[userIndex].passwordHash = await enhancedHash(newPassword);
  saveUsers(users);
  
  // Invalidate token
  const tokens = getResetTokens();
  delete tokens[token];
  saveResetTokens(tokens);
  
  return { success: true };
}
