import { Hono } from 'hono';
import { ProjectService } from '../services/project.service';
import { CreateProjectRequest, UpdateProjectRequest, ApiResponse } from '../types';
import { dualAuthMiddleware } from '../middleware/dual-auth.middleware';
import type { AuthContext } from '../middleware/dual-auth.middleware';

const router = new Hono<AuthContext>();

// Apply dual authentication middleware (accepts both AUTH_SECRET and JWT tokens)
router.use('*', dualAuthMiddleware);

// GET /api/fy2569/planner/project - Get all projects
router.get('/', async (c) => {
	try {
		const service = new ProjectService();
		const data = await service.getAll();
		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: `Found ${data.length} project(s)`,
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

// GET /api/fy2569/planner/project/active - Get active projects only
router.get('/active', async (c) => {
	try {
		const service = new ProjectService();
		const data = await service.getActive();
		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: `Found ${data.length} active project(s)`,
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

// GET /api/fy2569/planner/project/:id - Get project by ID
router.get('/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'), 10);
		if (isNaN(id)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid ID' }, 400);
		}

		const service = new ProjectService();
		const data = await service.getById(id);

		if (!data) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Project not found' }, 404);
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

// POST /api/fy2569/planner/project - Create project
router.post('/', async (c) => {
	try {
		const body = await c.req.json<CreateProjectRequest>();

		// Validate required fields
		if (!body.shortname) {
			return c.json<ApiResponse<any>>({ success: false, error: 'shortname is required' }, 400);
		}

		const service = new ProjectService();
		const data = await service.create(body);

		return c.json<ApiResponse<any>>(
			{
				success: true,
				data,
				message: 'Project created successfully',
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

// PATCH /api/fy2569/planner/project/:id - Update project
router.patch('/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'), 10);
		if (isNaN(id)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid ID' }, 400);
		}

		const body = await c.req.json<UpdateProjectRequest>();
		const service = new ProjectService();
		const data = await service.update(id, body);

		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: 'Project updated successfully',
		});
	} catch (error) {
		return c.json<ApiResponse<any>>(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			error instanceof Error && error.message === 'Project not found' ? 404 : 500
		);
	}
});

// DELETE /api/fy2569/planner/project/:id - Soft delete project
router.delete('/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'), 10);
		if (isNaN(id)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid ID' }, 400);
		}

		const service = new ProjectService();
		await service.delete(id);

		return c.json<ApiResponse<any>>({
			success: true,
			message: 'Project deleted successfully',
		});
	} catch (error) {
		return c.json<ApiResponse<any>>(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			error instanceof Error && error.message === 'Project not found' ? 404 : 500
		);
	}
});

export default router;
