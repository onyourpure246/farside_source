import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import categoryRouter from '../../src/routes/category.routes';

const { mockGetAllCategories, mockCreateCategory, mockUpdateCategory, mockDeleteCategory } = vi.hoisted(() => ({
  mockGetAllCategories: vi.fn(),
  mockCreateCategory: vi.fn(),
  mockUpdateCategory: vi.fn(),
  mockDeleteCategory: vi.fn(),
}));

vi.mock('../../src/services/category.service', () => {
  return {
    CategoryService: class {
      getAllCategories = mockGetAllCategories;
      createCategory = mockCreateCategory;
      updateCategory = mockUpdateCategory;
      deleteCategory = mockDeleteCategory;
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

// Mock the middleware to bypass auth
vi.mock('../../src/middleware/dual-auth.middleware', () => {
  return {
    dualAuthMiddleware: async (c: any, next: any) => {
      // Simulate an authenticated admin user for testing
      c.set('user', { id: 1, isadmin: 1 });
      c.set('authType', 'bearer');
      await next();
    }
  };
});

// Create a test app
const app = new Hono();
app.route('/category', categoryRouter);

describe('Category Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /category', () => {
    it('should return 200 and list of active categories', async () => {
      const mockCategories = [{ id: 1, name: 'Test Category' }];
      mockGetAllCategories.mockResolvedValueOnce(mockCategories);

      const res = await app.request('/category');
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCategories);
      expect(mockGetAllCategories).toHaveBeenCalledWith(false); // false = active only
    });

    it('should return 500 on service error', async () => {
      mockGetAllCategories.mockRejectedValueOnce(new Error('DB Error'));

      const res = await app.request('/category');
      
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });

  describe('GET /category/all', () => {
    it('should return 200 and list of all categories for admin', async () => {
      const mockCategories = [{ id: 1, name: 'Active' }, { id: 2, name: 'Inactive' }];
      mockGetAllCategories.mockResolvedValueOnce(mockCategories);

      const res = await app.request('/category/all');
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCategories);
      expect(mockGetAllCategories).toHaveBeenCalledWith(true); // true = all categories
    });
  });

  describe('POST /category', () => {
    it('should return 400 if name is missing', async () => {
      const res = await app.request('/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('should return 201 on successful creation', async () => {
      const newCategory = { id: 1, name: 'New Category' };
      mockCreateCategory.mockResolvedValueOnce(newCategory);

      const res = await app.request('/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Category' }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(newCategory);
    });
  });
});
