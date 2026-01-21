import { Hono } from 'hono';
import { ParticipantService } from '../services/participant.service';
import { CreateParticipantRequest, UpdateParticipantRequest, ApiResponse } from '../types';
import { dualAuthMiddleware } from '../middleware/dual-auth.middleware';
import type { AuthContext } from '../middleware/dual-auth.middleware';

const router = new Hono<AuthContext>();

// Apply dual authentication middleware (accepts both AUTH_SECRET and JWT tokens)
router.use('*', dualAuthMiddleware);

// GET /api/fy2569/commons/participant - Get all participants
router.get('/', async (c) => {
	try {
		const service = new ParticipantService();
		const data = await service.getAll();
		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: `Found ${data.length} participant(s)`,
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

// GET /api/fy2569/commons/participant/active - Get active participants only
router.get('/active', async (c) => {
	try {
		const service = new ParticipantService();
		const data = await service.getActive();
		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: `Found ${data.length} active participant(s)`,
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

// GET /api/fy2569/commons/participant/:id - Get participant by ID
router.get('/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'), 10);
		if (isNaN(id)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid ID' }, 400);
		}

		const service = new ParticipantService();
		const data = await service.getById(id);

		if (!data) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Participant not found' }, 404);
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

// POST /api/fy2569/commons/participant - Create participant
router.post('/', async (c) => {
	try {
		const body = await c.req.json<CreateParticipantRequest>();

		// Validate required fields
		if (!body.codename) {
			return c.json<ApiResponse<any>>({ success: false, error: 'codename is required' }, 400);
		}

		const service = new ParticipantService();
		const data = await service.create(body);

		return c.json<ApiResponse<any>>(
			{
				success: true,
				data,
				message: 'Participant created successfully',
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

// PATCH /api/fy2569/commons/participant/:id - Update participant
router.patch('/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'), 10);
		if (isNaN(id)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid ID' }, 400);
		}

		const body = await c.req.json<UpdateParticipantRequest>();
		const service = new ParticipantService();
		const data = await service.update(id, body);

		return c.json<ApiResponse<any>>({
			success: true,
			data,
			message: 'Participant updated successfully',
		});
	} catch (error) {
		return c.json<ApiResponse<any>>(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			error instanceof Error && error.message === 'Participant not found' ? 404 : 500
		);
	}
});

// DELETE /api/fy2569/commons/participant/:id - Soft delete participant
router.delete('/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'), 10);
		if (isNaN(id)) {
			return c.json<ApiResponse<any>>({ success: false, error: 'Invalid ID' }, 400);
		}

		const service = new ParticipantService();
		await service.delete(id);

		return c.json<ApiResponse<any>>({
			success: true,
			message: 'Participant deleted successfully',
		});
	} catch (error) {
		return c.json<ApiResponse<any>>(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			error instanceof Error && error.message === 'Participant not found' ? 404 : 500
		);
	}
});

export default router;
