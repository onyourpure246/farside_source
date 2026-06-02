import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import authRoutes from '../../src/routes/auth.routes';
import { AuthService } from '../../src/services/auth.service';
import { LogService } from '../../src/services/log.service';

const mockLogin = vi.fn();
const mockUpsertThaIDUser = vi.fn();
const mockGenerateToken = vi.fn();

vi.mock('../../src/services/auth.service', () => {
  return {
    AuthService: class {
      login = mockLogin;
      getUserByUsername = vi.fn();
      verifyPassword = vi.fn();
      updatePassword = vi.fn();
      generateToken = mockGenerateToken;
      updateProfile = vi.fn();
      upsertThaIDUser = mockUpsertThaIDUser;
    }
  };
});

vi.mock('../../src/services/log.service', () => {
  return {
    LogService: class {
      logActivity = vi.fn();
      logWarning = vi.fn();
    }
  };
});

// Create a test app
const app = new Hono();
app.route('/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should return 400 if username or password is missing', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test' }), // Missing password
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Username and password are required');
    });

    it('should return 401 if login fails', async () => {
      mockLogin.mockResolvedValueOnce(null);

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: 'wrongpassword' }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid username or password');
    });

    it('should return 200 and token on successful login', async () => {
      const mockUser = { id: 1, username: 'test' };
      mockLogin.mockResolvedValueOnce({
        token: 'mock-jwt-token',
        user: mockUser,
      });

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: 'password123' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.token).toBe('mock-jwt-token');
      expect(data.user).toEqual(mockUser);
    });
  });

  describe('POST /auth/thaid-login', () => {
    it('should return 400 if code or cid is missing', async () => {
      const res = await app.request('/auth/thaid-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('should return token when successfully authenticated with CID', async () => {
      const mockUser = { id: 2, username: 'thaid_user' };
      mockUpsertThaIDUser.mockResolvedValueOnce(mockUser);
      mockGenerateToken.mockReturnValueOnce('thaid-token');

      const res = await app.request('/auth/thaid-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cid: '1234567890123' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.token).toBe('thaid-token');
    });
  });
});
