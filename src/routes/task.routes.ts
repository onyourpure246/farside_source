import { Hono } from 'hono';
import { TaskService } from '../services/task.service';
import { CreateTaskRequest, UpdateTaskRequest, ApiResponse, CreateTaskTagRequest } from '../types';
import { dualAuthMiddleware } from '../middleware/dual-auth.middleware';
import type { AuthContext } from '../middleware/dual-auth.middleware';

const router = new Hono<AuthContext>();

// Apply dual authentication middleware (accepts both AUTH_SECRET and JWT tokens)
router.use('*', dualAuthMiddleware);

// GET /api/fy2569/planner/task/active - Get active tasks only
router.get('/active', async (c) => {
	try {
		const service = new TaskService();
		const data = await service.getActive();
		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: `Found ${data.length} active task(s)`,
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

// GET /api/fy2569/planner/task/by-project/:projectId - Get tasks by project
router.get('/by-project/:projectId', async (c) => {
	try {
		const projectId = parseInt(c.req.param('projectId'), 10);
		if (isNaN(projectId)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid project ID' }, 400);
		}

		const service = new TaskService();
		const data = await service.getByProject(projectId);
		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: `Found ${data.length} task(s) for project ${projectId}`,
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

// GET /api/fy2569/planner/task - Get all tasks
router.get('/', async (c) => {
	try {
		const service = new TaskService();
		const data = await service.getAll();
		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: `Found ${data.length} task(s)`,
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

// GET /api/fy2569/planner/task/:id - Get task by ID
router.get('/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'), 10);
		if (isNaN(id)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid ID' }, 400);
		}

		const service = new TaskService();
		const data = await service.getById(id);

		if (!data) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Task not found' }, 404);
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

// POST /api/fy2569/planner/task - Create task
router.post('/', async (c) => {
	try {
		const body = await c.req.json<CreateTaskRequest>();

		// Validate required fields
		if (!body.project_id) {
			return c.json<ApiResponse<any>>({ success: false, error: 'project_id is required' }, 400);
		}

		const service = new TaskService();
		const data = await service.create(body);

		return c.json<ApiResponse<any>>(
			{
				success: true,
				data,
				message: 'Task created successfully',
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

// PATCH /api/fy2569/planner/task/:id - Update task
router.patch('/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'), 10);
		if (isNaN(id)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid ID' }, 400);
		}

		const body = await c.req.json<UpdateTaskRequest>();
		const service = new TaskService();
		const data = await service.update(id, body);

		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: 'Task updated successfully',
		});
	} catch (error) {
		return c.json<ApiResponse<any>>(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			error instanceof Error && error.message === 'Task not found' ? 404 : 500
		);
	}
});

// DELETE /api/fy2569/planner/task/:id - Soft delete task
router.delete('/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'), 10);
		if (isNaN(id)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid ID' }, 400);
		}

		const service = new TaskService();
		await service.delete(id);

		return c.json<ApiResponse<any>>({
			success: true,
			message: 'Task deleted successfully',
		});
	} catch (error) {
		return c.json<ApiResponse<any>>(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			error instanceof Error && error.message === 'Task not found' ? 404 : 500
		);
	}
});

// ========== TASK-TAGS ROUTES ==========

// GET /api/fy2569/planner/task/:id/tags - Get tags for a specific task
router.get('/:id/tags', async (c) => {
	try {
		const id = parseInt(c.req.param('id'), 10);
		if (isNaN(id)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid task ID' }, 400);
		}

		const service = new TaskService();
		const data = await service.getTaskTags(id);

		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: `Found ${data.length} tag(s) for task ${id}`,
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

// POST /api/fy2569/planner/task/:id/tags - Add tag to task
router.post('/:id/tags', async (c) => {
	try {
		const taskId = parseInt(c.req.param('id'), 10);
		if (isNaN(taskId)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid task ID' }, 400);
		}

		const body = await c.req.json<{ tag_id: number }>();
		if (!body.tag_id) {
			return c.json<ApiResponse<any>>({ success: false, error: 'tag_id is required' }, 400);
		}

		const service = new TaskService();
		await service.addTaskTag(taskId, body.tag_id);

		return c.json<ApiResponse<any>>(
			{
				success: true,
				message: 'Tag added to task successfully',
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

// DELETE /api/fy2569/planner/task/:id/tags/:tagId - Remove tag from task
router.delete('/:id/tags/:tagId', async (c) => {
	try {
		const taskId = parseInt(c.req.param('id'), 10);
		const tagId = parseInt(c.req.param('tagId'), 10);
		
		if (isNaN(taskId) || isNaN(tagId)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid task ID or tag ID' }, 400);
		}

		const service = new TaskService();
		await service.removeTaskTag(taskId, tagId);

		return c.json<ApiResponse<any>>({
			success: true,
			message: 'Tag removed from task successfully',
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

export default router;
