import { Hono } from 'hono';
import { TaskParticipantService } from '../services/task-participant.service';
import { CreateTaskParticipantRequest, UpdateTaskParticipantRequest, ApiResponse } from '../types';
import { dualAuthMiddleware } from '../middleware/dual-auth.middleware';
import type { AuthContext } from '../middleware/dual-auth.middleware';

const router = new Hono<AuthContext>();

// Apply dual authentication middleware (accepts both AUTH_SECRET and JWT tokens)
router.use('*', dualAuthMiddleware);

// GET /api/fy2569/planner/task/participant/by-task/:taskId - Get participants by task
router.get('/by-task/:taskId', async (c) => {
	try {
		const taskId = parseInt(c.req.param('taskId'), 10);
		if (isNaN(taskId)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid task ID' }, 400);
		}

		const service = new TaskParticipantService();
		const data = await service.getByTask(taskId);
		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: `Found ${data.length} participant(s) for task ${taskId}`,
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

// GET /api/fy2569/planner/task/participant/by-participant/:participantId - Get tasks by participant
router.get('/by-participant/:participantId', async (c) => {
	try {
		const participantId = parseInt(c.req.param('participantId'), 10);
		if (isNaN(participantId)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid participant ID' }, 400);
		}

		const service = new TaskParticipantService();
		const data = await service.getByParticipant(participantId);
		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: `Found ${data.length} task(s) for participant ${participantId}`,
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

// GET /api/fy2569/planner/task/participant - Get all task participants
router.get('/', async (c) => {
	try {
		const service = new TaskParticipantService();
		const data = await service.getAll();
		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: `Found ${data.length} task participant(s)`,
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

// GET /api/fy2569/planner/task/participant/:id - Get task participant by ID
router.get('/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'), 10);
		if (isNaN(id)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid ID' }, 400);
		}

		const service = new TaskParticipantService();
		const data = await service.getById(id);

		if (!data) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Task participant not found' }, 404);
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

// POST /api/fy2569/planner/task/participant - Add participant to task
router.post('/', async (c) => {
	try {
		const body = await c.req.json<CreateTaskParticipantRequest>();

		// Validate required fields
		if (!body.task_id || !body.participant_id) {
			return c.json<ApiResponse<any>>(
				{ success: false, error: 'task_id and participant_id are required' },
				400
			);
		}

		const service = new TaskParticipantService();
		const data = await service.create(body);

		return c.json<ApiResponse<any>>(
			{
				success: true,
				data,
				message: 'Participant added to task successfully',
			},
			201
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		const statusCode = message.includes('already assigned') ? 400 : 500;
		return c.json<ApiResponse<any>>(
			{
				success: false,
				error: message,
			},
			statusCode
		);
	}
});

// PATCH /api/fy2569/planner/task/participant/:id - Update task participant
router.patch('/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'), 10);
		if (isNaN(id)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid ID' }, 400);
		}

		const body = await c.req.json<UpdateTaskParticipantRequest>();
		const service = new TaskParticipantService();
		const data = await service.update(id, body);

		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: 'Task participant updated successfully',
		});
	} catch (error) {
		return c.json<ApiResponse<any>>(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			error instanceof Error && error.message === 'Task participant not found' ? 404 : 500
		);
	}
});

// DELETE /api/fy2569/planner/task/participant/:id - Remove participant from task
router.delete('/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'), 10);
		if (isNaN(id)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid ID' }, 400);
		}

		const service = new TaskParticipantService();
		await service.delete(id);

		return c.json<ApiResponse<any>>({
			success: true,
			message: 'Participant removed from task successfully',
		});
	} catch (error) {
		return c.json<ApiResponse<any>>(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			error instanceof Error && error.message === 'Task participant not found' ? 404 : 500
		);
	}
});

export default router;
