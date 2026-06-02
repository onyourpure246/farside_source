import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import dashboardRouter from '../../src/routes/dashboard.routes';
import * as databaseService from '../../src/services/database.service';

// Mock the middleware to bypass auth
vi.mock('../../src/middleware/dual-auth.middleware', () => {
  return {
    dualAuthMiddleware: async (c: any, next: any) => {
      c.set('user', { id: 1, isadmin: 1 });
      await next();
    }
  };
});

// Mock database service
vi.mock('../../src/services/database.service', () => ({
  query: vi.fn(),
  queryOne: vi.fn()
}));

const app = new Hono();
app.route('/dashboard', dashboardRouter);

describe('Dashboard Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /dashboard/stats', () => {
    it('should return 200 and stats', async () => {
      vi.mocked(databaseService.queryOne).mockResolvedValue({ count: 10 });

      const res = await app.request('/dashboard/stats');
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.total_logins).toBe(10);
      expect(databaseService.queryOne).toHaveBeenCalledTimes(5);
    });

    it('should return 500 on db error', async () => {
      vi.mocked(databaseService.queryOne).mockRejectedValue(new Error('DB Error'));

      const res = await app.request('/dashboard/stats');
      expect(res.status).toBe(500);
    });
  });

  describe('GET /dashboard/chart-data', () => {
    it('should return 200 and chart data', async () => {
      vi.mocked(databaseService.query).mockResolvedValue([]);

      const res = await app.request('/dashboard/chart-data');
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(databaseService.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('GET /dashboard/audit-logs', () => {
    it('should return 200 and audit logs', async () => {
      const mockLogs = [
        { id: 1, action: 'SYSTEM_CRASH', details: '{"message":"test error"}', user_id: 1, created_at: '2023-01-01' }
      ];
      vi.mocked(databaseService.query).mockResolvedValue(mockLogs);

      const res = await app.request('/dashboard/audit-logs');
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data[0].details).toBe('test error'); // parsed
    });
  });
});
