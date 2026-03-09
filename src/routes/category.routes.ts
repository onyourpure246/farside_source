import { Hono } from 'hono';
import { CategoryService } from '../services/category.service';
import { ApiResponse, CreateCategoryRequest, UpdateCategoryRequest } from '../types';
import { dualAuthMiddleware } from '../middleware/dual-auth.middleware';
import type { AuthContext } from '../middleware/dual-auth.middleware';
import { LogService } from '../services/log.service';

const categoryRouter = new Hono<AuthContext>();

// Apply dual authentication middleware
categoryRouter.use('*', dualAuthMiddleware);

// GET: List all categories
categoryRouter.get('/', async (c) => {
    try {
        const service = new CategoryService();
        // Fetch only active categories for standard listing
        const categories = await service.getAllCategories(false);

        return c.json<ApiResponse<any>>({ success: true, data: categories }, 200);
    } catch (error) {
        console.error('Error in GET /category:', error);
        return c.json<ApiResponse<null>>({ success: false, error: 'Internal Server Error' }, 500);
    }
});

// GET: List ALL categories (including inactive), for admin panel
categoryRouter.get('/all', async (c) => {
    try {
        // Verify admin status
        const user = c.get('user');
        const authType = c.get('authType');
        const isAdmin = (user?.isadmin === 1) || (authType === 'bearer');

        if (!isAdmin) {
            return c.json<ApiResponse<null>>({ success: false, error: 'Forbidden' }, 403);
        }

        const service = new CategoryService();
        const categories = await service.getAllCategories(true);

        return c.json<ApiResponse<any>>({ success: true, data: categories }, 200);
    } catch (error) {
        console.error('Error in GET /category/all:', error);
        return c.json<ApiResponse<null>>({ success: false, error: 'Internal Server Error' }, 500);
    }
});

// POST: Create category
categoryRouter.post('/', async (c) => {
    try {
        const data = await c.req.json<CreateCategoryRequest>();
        if (!data.name) {
            return c.json<ApiResponse<null>>({ success: false, error: 'Category name is required' }, 400);
        }

        const service = new CategoryService();
        const category = await service.createCategory(data);

        // Log Create Activity
        try {
            const logService = new LogService();
            const userId = c.get('user')?.id ?? null;
            const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
            await logService.logActivity(userId, 'CREATE_CATEGORY', 'CATEGORY', category.id, { name: category.name }, ip, c.req.header('user-agent'));
        } catch (e) {
            console.error('Failed to log category creation');
        }

        return c.json<ApiResponse<any>>({ success: true, data: category }, 201);
    } catch (error) {
        console.error('Error in POST /category:', error);
        return c.json<ApiResponse<null>>({ success: false, error: 'Internal Server Error' }, 500);
    }
});

// PATCH: Update category (e.g. rename or toggle active)
categoryRouter.patch('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        const data = await c.req.json<UpdateCategoryRequest>();
        const service = new CategoryService();

        const category = await service.updateCategory(id, data);

        // Log Update Activity
        try {
            const logService = new LogService();
            const userId = c.get('user')?.id ?? null;
            const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
            await logService.logActivity(userId, 'UPDATE_CATEGORY', 'CATEGORY', id, { updates: data }, ip, c.req.header('user-agent'));
        } catch (e) {
            console.error('Failed to log category update');
        }

        return c.json<ApiResponse<any>>({ success: true, data: category }, 200);
    } catch (error) {
        console.error('Error in PATCH /category/:id:', error);
        return c.json<ApiResponse<null>>({ success: false, error: 'Internal Server Error' }, 500);
    }
});

// DELETE: Soft delete category
categoryRouter.delete('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        const service = new CategoryService();

        await service.deleteCategory(id);

        // Log Delete Activity
        try {
            const logService = new LogService();
            const userId = c.get('user')?.id ?? null;
            const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
            await logService.logWarning(userId, 'DELETE_CATEGORY', `Category ${id} deleted`, 'CATEGORY', id, ip, c.req.header('user-agent'));
        } catch (e) {
            console.error('Failed to log category deletion');
        }

        return c.json<ApiResponse<null>>({ success: true, message: 'Category deleted successfully' }, 200);
    } catch (error) {
        console.error('Error in DELETE /category/:id:', error);
        return c.json<ApiResponse<null>>({ success: false, error: 'Internal Server Error' }, 500);
    }
});

export default categoryRouter;
