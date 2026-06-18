// User management module — simple localStorage-based auth (can be extended to backend)

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  lastLogin: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const USERS_KEY = "compliance_cat_users";
const SESSION_KEY = "compliance_cat_session";

/**
 * Generate a simple unique ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Enhanced password hashing using multiple rounds of SHA-256
 * Much stronger than simpleHash, though still not as strong as bcrypt
 * Note: For production use, implement bcrypt on the server side
 */
async function enhancedHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  let data = encoder.encode(password);
  
  // Multiple rounds of hashing for increased security
  for (let i = 0; i < 1000; i++) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    data = encoder.encode(hashArray.join('') + password);
  }
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Legacy simple hash for backward compatibility
 * @deprecated Use enhancedHash instead
 */
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Get all registered users
 */
export function getUsers(): Array<{ email: string; passwordHash: string; name: string; createdAt: number }> {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save users array
 */
function saveUsers(users: Array<{ email: string; passwordHash: string; name: string; createdAt: number }>): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn("Failed to save users:", e);
  }
}

/**
 * Register a new user
 * Returns { success: true, user: User } or { success: false, error: string }
 */
export async function registerUser(email: string, password: string, name: string): Promise<{ success: boolean; user?: User; error?: string }> {
  // Validation
  if (!email || !password || !name) {
    return { success: false, error: "All fields are required" };
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Invalid email format" };
  }
  
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }
  
  if (name.length < 2) {
    return { success: false, error: "Name must be at least 2 characters" };
  }
  
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
  
  return { success: true, user };
}

/**
 * Login with email and password
 * Returns { success: true, user: User } or { success: false, error: string }
 */
export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }
  
  const users = getUsers();
  const passwordHash = await enhancedHash(password);
  const userRecord = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === passwordHash);
  
  if (!userRecord) {
    // Also try legacy hash for backward compatibility
    const legacyHash = simpleHash(password);
    const legacyUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === legacyHash);
    if (legacyUser) {
      // Update to new hash
      const updatedUsers = users.map(u => 
        u.email === legacyUser.email ? { ...u, passwordHash } : u
      );
      saveUsers(updatedUsers);
      const user: User = {
        id: generateId(),
        email: legacyUser.email,
        name: legacyUser.name,
        createdAt: legacyUser.createdAt,
        lastLogin: Date.now(),
      };
      const token = generateId() + "_" + (await enhancedHash(user.email + Date.now()));
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token, expiresAt: Date.now() + 24 * 60 * 60 * 1000 }));
      return { success: true, user };
    }
    return { success: false, error: "Invalid email or password" };
  }
  
  // Update last login
  const updatedUsers = users.map(u => 
    u.email === userRecord.email ? { ...u, createdAt: u.createdAt } : u
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
  

  
  // Create session
  const token = generateId() + "_" + (await enhancedHash(user.email + Date.now()));
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token, expiresAt: Date.now() + 24 * 60 * 60 * 1000 }));
  
  return { success: true, user };
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
    
    return {
      user: session.user,
      token: session.token,
      isAuthenticated: true,
    };
  } catch {
    return { user: null, token: null, isAuthenticated: false };
  }
}

/**
 * Logout current user
 */
export function logoutUser(): void {
  localStorage.removeItem(SESSION_KEY);
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
 * Ensure demo/test user exists in localStorage
 * Call this on app initialization
 */
export async function ensureDemoUser(): Promise<User | null> {
  // Demo user disabled by default — enable via VITE_DEMO_ENABLED=true env var
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
  
  // Send reset email via API
  const resetLink = `${window.location.origin}/#reset-password/${token}`;
  const subject = "Reset Your Compliance Cat Password";
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Compliance Cat</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${resetLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
      </p>
      <p style="color: #64748b; font-size: 14px;">This link expires in 30 minutes.</p>
      <p style="color: #64748b; font-size: 14px;">If you didn't request this, you can ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">Powered by Agnes AI • Compliance Cat</p>
    </div>
  `;
  
  try {
    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: userRecord.email, subject, html }),
    });
    // Don't fail if email send fails — token is still generated
  } catch (e) {
    console.warn("Failed to send reset email, but token was generated:", e);
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
  
  // Update password with enhanced hash
  users[userIndex].passwordHash = await enhancedHash(newPassword);
  saveUsers(users);
  
  // Invalidate token
  const tokens = getResetTokens();
  delete tokens[token];
  saveResetTokens(tokens);
  
  return { success: true };
}
