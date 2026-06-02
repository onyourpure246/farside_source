import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import searchRouter from '../../src/routes/search.routes';
import * as databaseService from '../../src/services/database.service';

// Mock database service
vi.mock('../../src/services/database.service', () => ({
  query: vi.fn(),
  execute: vi.fn()
}));

// Mock the middleware to bypass auth
vi.mock('../../src/middleware/dual-auth.middleware', () => {
  return {
    dualAuthMiddleware: async (c: any, next: any) => {
      c.set('user', { id: 1, isadmin: 1 });
      await next();
    }
  };
});

const app = new Hono();
app.route('/search', searchRouter);

describe('Search Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /search/track', () => {
    it('should return 400 if keyword is missing', async () => {
      const res = await app.request('/search/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it('should return 201 on success', async () => {
      vi.mocked(databaseService.execute).mockResolvedValueOnce({ insertId: 1 } as any);
      const res = await app.request('/search/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: 'test' }),
      });
      expect(res.status).toBe(201);
    });
  });

  describe('GET /search/popular', () => {
    it('should return 200 and list of popular keywords', async () => {
      vi.mocked(databaseService.query).mockResolvedValueOnce([{ keyword: 'test', count: 5 }]);
      const res = await app.request('/search/popular');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data[0].keyword).toBe('test');
    });
  });
});
