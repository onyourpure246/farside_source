import { Hono } from 'hono';
import { TagService } from '../services/tag.service';
import { CreateTagRequest, UpdateTagRequest, ApiResponse } from '../types';
import { dualAuthMiddleware } from '../middleware/dual-auth.middleware';
import type { AuthContext } from '../middleware/dual-auth.middleware';

const router = new Hono<AuthContext>();

// Apply dual authentication middleware (accepts both AUTH_SECRET and JWT tokens)
router.use('*', dualAuthMiddleware);

// GET /api/fy2569/commons/tag/active - Get active tags only
router.get('/active', async (c) => {
	try {
		const service = new TagService();
		const data = await service.getActive();
		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: `Found ${data.length} active tag(s)`,
		});
	} catch (error) {
		return c.json<ApiResponse<any>>(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			500
		);
	}
});

// GET /api/fy2569/commons/tag - Get all tags
router.get('/', async (c) => {
	try {
		const service = new TagService();
		const data = await service.getAll();
		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: `Found ${data.length} tag(s)`,
		});
	} catch (error) {
		return c.json<ApiResponse<any>>(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			500
		);
	}
});

// GET /api/fy2569/commons/tag/:id - Get tag by ID
router.get('/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'), 10);
		if (isNaN(id)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid ID' }, 400);
		}

		const service = new TagService();
		const data = await service.getById(id);

		if (!data) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Tag not found' }, 404);
		}

		return c.json<ApiResponse<any>>({
			success: true,
			data,
		});
	} catch (error) {
		return c.json<ApiResponse<any>>(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			500
		);
	}
});

// POST /api/fy2569/commons/tag - Create tag
router.post('/', async (c) => {
	try {
		const body = await c.req.json<CreateTagRequest>();

		// Validate required fields
		if (!body.name) {
			return c.json<ApiResponse<any>>({ success: false, error: 'name is required' }, 400);
		}
		if (!body.colour) {
			return c.json<ApiResponse<any>>({ success: false, error: 'colour is required' }, 400);
		}

		const service = new TagService();
		const data = await service.create(body);

		return c.json<ApiResponse<any>>(
			{
				success: true,
				data,
				message: 'Tag created successfully',
			},
			201
		);
	} catch (error) {
		return c.json<ApiResponse<any>>(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			500
		);
	}
});

// PATCH /api/fy2569/commons/tag/:id - Update tag
router.patch('/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'), 10);
		if (isNaN(id)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid ID' }, 400);
		}

		const body = await c.req.json<UpdateTagRequest>();
		const service = new TagService();
		const data = await service.update(id, body);

		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: 'Tag updated successfully',
		});
	} catch (error) {
		return c.json<ApiResponse<any>>(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			error instanceof Error && error.message === 'Tag not found' ? 404 : 500
		);
	}
});

// DELETE /api/fy2569/commons/tag/:id - Soft delete tag
router.delete('/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'), 10);
		if (isNaN(id)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid ID' }, 400);
		}

		const service = new TagService();
		await service.delete(id);

		return c.json<ApiResponse<any>>({
			success: true,
			message: 'Tag deleted successfully',
		});
	} catch (error) {
		return c.json<ApiResponse<any>>(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			error instanceof Error && error.message === 'Tag not found' ? 404 : 500
		);
	}
});

export default router;
