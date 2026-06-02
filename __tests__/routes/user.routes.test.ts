import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import userRouter from '../../src/routes/user.routes';

const { mockListUsers, mockUpdateUser } = vi.hoisted(() => ({
  mockListUsers: vi.fn(),
  mockUpdateUser: vi.fn(),
}));

vi.mock('../../src/services/auth.service', () => ({
  AuthService: class {
    listUsers = mockListUsers;
    updateUser = mockUpdateUser;
  }
}));

vi.mock('../../src/services/log.service', () => ({
  LogService: class {
    logActivity = vi.fn();
    logWarning = vi.fn();
  }
}));

// Mock the middleware to bypass auth
vi.mock('../../src/middleware/dual-auth.middleware', () => {
  const dummyMiddleware = async (c: any, next: any) => {
    c.set('user', { id: 1, isadmin: 1 });
    await next();
  };
  return {
    dualAuthMiddleware: dummyMiddleware,
    adminAuthMiddleware: dummyMiddleware,
  };
});

const app = new Hono();
app.route('/', userRouter);

describe('User Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return 200 and list of users', async () => {
      mockListUsers.mockResolvedValueOnce([{ id: 1, username: 'test' }]);
      const res = await app.request('/');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data[0].username).toBe('test');
    });
  });

  describe('PATCH /:id', () => {
    it('should return 200 on successful update', async () => {
      mockUpdateUser.mockResolvedValueOnce(true);
      const res = await app.request('/2', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayname: 'New Name' }),
      });
      expect(res.status).toBe(200);
    });
  });
});
