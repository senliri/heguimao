import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
vi.stubGlobal("localStorage", localStorageMock);

describe("auth module", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.resetModules();
  });

  it("should register a user", async () => {
    const { registerUser } = await import("../../src/lib/auth");
    const result = await registerUser("test@example.com", "password123", "Test User");
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe("test@example.com");
    expect(result.user?.name).toBe("Test User");
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "compliance_cat_users",
      expect.stringContaining("test@example.com")
    );
  });

  it("should reject duplicate email registration", async () => {
    const { registerUser } = await import("../../src/lib/auth");
    await registerUser("test@example.com", "password123", "Test User");
    const result = await registerUser("test@example.com", "password456", "Test User 2");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Email already registered");
  });

  it("should validate email format", async () => {
    const { registerUser } = await import("../../src/lib/auth");
    const result = await registerUser("invalid-email", "password123", "Test User");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email format");
  });

  it("should reject short passwords", async () => {
    const { registerUser } = await import("../../src/lib/auth");
    const result = await registerUser("test@example.com", "short", "Test User");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Password must be at least 6 characters");
  });

  it("should login with correct credentials", async () => {
    const { registerUser, loginUser } = await import("../../src/lib/auth");
    await registerUser("test@example.com", "password123", "Test User");
    const result = await loginUser("test@example.com", "password123");
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe("test@example.com");
  });

  it("should reject wrong password", async () => {
    const { registerUser, loginUser } = await import("../../src/lib/auth");
    await registerUser("test@example.com", "password123", "Test User");
    const result = await loginUser("test@example.com", "wrongpassword");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password");
  });

  it("should get current session after login", async () => {
    const { registerUser, loginUser, getSession } = await import("../../src/lib/auth");
    await registerUser("test@example.com", "password123", "Test User");
    await loginUser("test@example.com", "password123");
    const session = getSession();
    expect(session.isAuthenticated).toBe(true);
    expect(session.user?.email).toBe("test@example.com");
  });

  it("should logout user", async () => {
    const { registerUser, loginUser, logoutUser, getSession } = await import("../../src/lib/auth");
    await registerUser("test@example.com", "password123", "Test User");
    await loginUser("test@example.com", "password123");
    logoutUser();
    const session = getSession();
    expect(session.isAuthenticated).toBe(false);
  });
});
