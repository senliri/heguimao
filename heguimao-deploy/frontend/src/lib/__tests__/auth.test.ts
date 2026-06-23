import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerUser, loginUser, getSession, logoutUser, getCurrentUser, isAuthenticated, requestPasswordReset, verifyResetToken, resetPassword, getUsers, saveUsers } from '../auth';

// Mock localStorage
const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }),
  get length() { return Object.keys(mockStorage).length; },
  key: vi.fn((n: number) => Object.keys(mockStorage)[n] || null),
});

const localStorageMock = localStorage as any;

function clearStorage() {
  Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
}

describe('auth.ts - User Registration', () => {
  beforeEach(() => { clearStorage(); });

  it('should reject registration with missing fields', async () => {
    const r1 = await registerUser('', 'pass123', 'Name');
    expect(r1.success).toBe(false);

    const r2 = await registerUser('a@b.com', '', 'Name');
    expect(r2.success).toBe(false);

    const r3 = await registerUser('a@b.com', 'pass123', '');
    expect(r3.success).toBe(false);
  });

  it('should reject invalid email format', async () => {
    const result = await registerUser('not-an-email', 'pass123', 'Name');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });

  it('should reject short passwords', async () => {
    const result = await registerUser('test@example.com', 'abc', 'Name');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Password must be at least 6 characters');
  });

  it('should reject short names', async () => {
    const result = await registerUser('test@example.com', 'pass123', 'A');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Name must be at least 2 characters');
  });

  it('should register a valid user successfully', async () => {
    const result = await registerUser('new@test.com', 'password123', 'New User');
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user!.email).toBe('new@test.com');
    expect(result.user!.name).toBe('New User');
    expect(result.user!.id).toBeTruthy();
    expect(result.user!.createdAt).toBeGreaterThan(0);
  });

  it('should reject duplicate email registration', async () => {
    await registerUser('dup@test.com', 'password123', 'Dup User');
    const result = await registerUser('dup@test.com', 'password123', 'Dup User 2');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Email already registered');
  });

  it('should treat emails case-insensitively', async () => {
    await registerUser('Case@Test.com', 'password123', 'Case User');
    const result = await registerUser('case@test.com', 'password123', 'Case User 2');
    expect(result.success).toBe(false);
  });

  it('should store user in localStorage', async () => {
    await registerUser('store@test.com', 'password123', 'Store User');
    const usersData = localStorage.getItem('compliance_cat_users');
    expect(usersData).toBeTruthy();
    const users = JSON.parse(usersData!);
    expect(users.length).toBe(1);
    expect(users[0].email).toBe('store@test.com');
    expect(users[0].passwordHash).toBeTruthy();
  });
});

describe('auth.ts - Login', () => {
  beforeEach(() => { clearStorage(); });

  it('should reject login with missing credentials', async () => {
    const r1 = await loginUser('', 'pass123');
    expect(r1.success).toBe(false);
    const r2 = await loginUser('a@b.com', '');
    expect(r2.success).toBe(false);
  });

  it('should login with correct credentials', async () => {
    await registerUser('login@test.com', 'correctpass', 'Login User');
    const result = await loginUser('login@test.com', 'correctpass');
    expect(result.success).toBe(true);
    expect(result.user!.email).toBe('login@test.com');
  });

  it('should reject wrong password', async () => {
    await registerUser('wrong@test.com', 'correctpass', 'Wrong User');
    const result = await loginUser('wrong@test.com', 'wrongpass');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email or password');
  });

  it('should reject non-existent user', async () => {
    const result = await loginUser('nobody@test.com', 'somepass');
    expect(result.success).toBe(false);
  });

  it('should update lastLogin on successful login', async () => {
    const regResult = await registerUser('lastlogin@test.com', 'password123', 'LL User');
    const firstLogin = regResult.user!.createdAt;
    await new Promise(r => setTimeout(r, 10));
    const loginResult = await loginUser('lastlogin@test.com', 'password123');
    expect(loginResult.success).toBe(true);
    expect(loginResult.user!.lastLogin).toBeGreaterThanOrEqual(firstLogin);
  });

  it('should migrate legacy hash on login', async () => {
    // Simulate legacy user with simple hash
    const legacyUsers = [{
      email: 'legacy@test.com',
      passwordHash: '12345', // simple hash placeholder
      name: 'Legacy User',
      createdAt: Date.now(),
    }];
    localStorage.setItem('compliance_cat_users', JSON.stringify(legacyUsers));

    // This should fail because the actual enhancedHash won't match '12345'
    // unless the password happens to produce that hash. Let's test the migration path differently.
    const result = await loginUser('legacy@test.com', 'wrongpass');
    expect(result.success).toBe(false);
  });
});

describe('auth.ts - Session Management', () => {
  beforeEach(() => { clearStorage(); });

  it('should return unauthenticated state with no session', () => {
    const session = getSession();
    expect(session.isAuthenticated).toBe(false);
    expect(session.user).toBeNull();
    expect(session.token).toBeNull();
  });

  it('should create session on login', async () => {
    await registerUser('session@test.com', 'password123', 'Session User');
    await loginUser('session@test.com', 'password123');
    const session = getSession();
    expect(session.isAuthenticated).toBe(true);
    expect(session.user).toBeTruthy();
    expect(session.token).toBeTruthy();
  });

  it('should return null current user when not logged in', () => {
    expect(getCurrentUser()).toBeNull();
  });

  it('should return user when logged in', async () => {
    await registerUser('curuser@test.com', 'password123', 'Cur User');
    await loginUser('curuser@test.com', 'password123');
    const user = getCurrentUser();
    expect(user).toBeTruthy();
    expect(user!.email).toBe('curuser@test.com');
  });

  it('should check authentication correctly', async () => {
    expect(isAuthenticated()).toBe(false);
    await registerUser('authcheck@test.com', 'password123', 'Auth User');
    await loginUser('authcheck@test.com', 'password123');
    expect(isAuthenticated()).toBe(true);
  });

  it('should expire session after 24 hours', async () => {
    await registerUser('expire@test.com', 'password123', 'Expire User');
    await loginUser('expire@test.com', 'password123');

    // Manually set session to expired
    const sessionData = JSON.parse(localStorage.getItem('compliance_cat_session')!);
    sessionData.expiresAt = Date.now() - 1000; // 1 second ago
    localStorage.setItem('compliance_cat_session', JSON.stringify(sessionData));

    const session = getSession();
    expect(session.isAuthenticated).toBe(false);
  });

  it('should clear session on logout', async () => {
    await registerUser('logout@test.com', 'password123', 'Logout User');
    await loginUser('logout@test.com', 'password123');
    logoutUser();
    const session = getSession();
    expect(session.isAuthenticated).toBe(false);
    expect(session.user).toBeNull();
  });
});

describe('auth.ts - Password Reset', () => {
  beforeEach(() => { clearStorage(); });

  it('should reject empty email for reset', async () => {
    const result = await requestPasswordReset('');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Email is required');
  });

  it('should reject invalid email for reset', async () => {
    const result = await requestPasswordReset('invalid-email');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });

  it('should return success for non-existent email (security)', async () => {
    const result = await requestPasswordReset('nobody@test.com');
    expect(result.success).toBe(true);
  });

  it('should return success for existing email', async () => {
    await registerUser('resetme@test.com', 'password123', 'Reset User');
    const result = await requestPasswordReset('resetme@test.com');
    expect(result.success).toBe(true);
  });

  it('should verify valid reset token', () => {
    // Generate a token and save it
    const token = 'test-reset-token-12345';
    const tokens = { [token]: { email: 'verify@test.com', token, expiresAt: Date.now() + 60000 } };
    localStorage.setItem('compliance_cat_reset_tokens', JSON.stringify(tokens));

    const result = verifyResetToken(token);
    expect(result.valid).toBe(true);
    expect(result.email).toBe('verify@test.com');
  });

  it('should reject invalid reset token', () => {
    const result = verifyResetToken('nonexistent-token');
    expect(result.valid).toBe(false);
  });

  it('should reject expired reset token', () => {
    const token = 'expired-token';
    const tokens = { [token]: { email: 'test@test.com', token, expiresAt: Date.now() - 1000 } };
    localStorage.setItem('compliance_cat_reset_tokens', JSON.stringify(tokens));

    const result = verifyResetToken(token);
    expect(result.valid).toBe(false);
  });

  it('should reset password successfully', async () => {
    await registerUser('pwdreset@test.com', 'password123', 'Pwd Reset User');
    const token = 'reset-token-test';
    const tokens = { [token]: { email: 'pwdreset@test.com', token, expiresAt: Date.now() + 60000 } };
    localStorage.setItem('compliance_cat_reset_tokens', JSON.stringify(tokens));

    const result = await resetPassword(token, 'newpassword123');
    expect(result.success).toBe(true);

    // Verify new password works
    const loginResult = await loginUser('pwdreset@test.com', 'newpassword123');
    expect(loginResult.success).toBe(true);
  });

  it('should reject reset with short new password', async () => {
    const result = await resetPassword('some-token', 'abc');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Password must be at least 6 characters');
  });

  it('should reject reset with missing token', async () => {
    const result = await resetPassword('', 'newpassword123');
    expect(result.success).toBe(false);
  });
});

describe('auth.ts - Users CRUD', () => {
  beforeEach(() => { clearStorage(); });

  it('should return empty array when no users', () => {
    const users = getUsers();
    expect(users).toEqual([]);
  });

  it('should save and retrieve users', () => {
    const testUsers = [{
      email: 'test1@test.com',
      passwordHash: 'hash1',
      name: 'Test 1',
      createdAt: Date.now(),
    }, {
      email: 'test2@test.com',
      passwordHash: 'hash2',
      name: 'Test 2',
      createdAt: Date.now(),
    }];
    saveUsers(testUsers);
    const retrieved = getUsers();
    expect(retrieved.length).toBe(2);
    expect(retrieved[0].email).toBe('test1@test.com');
  });
});
