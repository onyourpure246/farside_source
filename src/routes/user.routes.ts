import { Hono } from 'hono';
import { AuthService } from '../services/auth.service';
import { adminAuthMiddleware } from '../middleware/dual-auth.middleware';
import type { AuthContext } from '../middleware/dual-auth.middleware';
import { ApiResponse, SafeUser } from '../types';

const router = new Hono<AuthContext>();

// All routes here require ADMIN privileges
// Expecting: Authorization: Bearer <JWT_TOKEN>
router.use('*', adminAuthMiddleware);

/**
 * GET /api/fy2569/users
 * List all users in the system
 */
router.get('/', async (c) => {
    try {
        const jwtSecret = process.env.JWT_SECRET || 'temp-secret';
        const authService = new AuthService(jwtSecret);

        const users = await authService.listUsers();

        return c.json<ApiResponse<SafeUser[]>>({
            success: true,
            data: users
        }, 200);

    } catch (error) {
        console.error('List users error:', error);
        return c.json<ApiResponse<null>>({
            success: false,
            error: 'Failed to retrieve users'
        }, 500);
    }
});

/**
 * DELETE /api/fy2569/users/:id
 * Delete a user by ID
 */
router.delete('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        const jwtSecret = process.env.JWT_SECRET || 'temp-secret';
        const authService = new AuthService(jwtSecret);

        const success = await authService.deleteUser(id);

        if (!success) {
            return c.json<ApiResponse<null>>({
                success: false,
                error: 'User not found or could not be deleted'
            }, 404);
        }

        return c.json<ApiResponse<null>>({
            success: true,
            message: 'User deleted successfully'
        }, 200);

    } catch (error) {
        console.error('Delete user error:', error);
        return c.json<ApiResponse<null>>({
            success: false,
            error: 'Failed to delete user'
        }, 500);
    }
});

export default router;
