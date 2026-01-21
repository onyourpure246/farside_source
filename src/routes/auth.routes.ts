import { Hono } from 'hono';
import { AuthService } from '../services/auth.service';
import { userAuthMiddleware } from '../middleware/dual-auth.middleware';
import type { AuthContext } from '../middleware/dual-auth.middleware';
import type { LoginRequest, CreateUserRequest, UpdateUserRequest } from '../types';

const router = new Hono<AuthContext>();

/**
 * POST /api/fy2569/commons/auth/login
 * Login with username and password
 * Returns JWT token and user info
 */
router.post('/login', async (c) => {
	try {
		const body = await c.req.json<LoginRequest>();
		const { username, password } = body;

		if (!username || !password) {
			return c.json(
				{
					success: false,
					error: 'Username and password are required',
				},
				400
			);
		}

		const jwtSecret = process.env.JWT_SECRET || '';
		const authService = new AuthService(jwtSecret);
		const result = await authService.login(username, password);

		if (!result) {
			return c.json(
				{
					success: false,
					error: 'Invalid username or password',
				},
				401
			);
		}

		return c.json({
			success: true,
			token: result.token,
			user: result.user,
		});
	} catch (error) {
		console.error('Login error:', error);
		return c.json(
			{
				success: false,
				error: 'Login failed',
			},
			500
		);
	}
});

/**
 * GET /api/fy2569/commons/auth/me
 * Get current user info from JWT token
 * Requires user authentication
 */
router.get('/me', userAuthMiddleware, async (c) => {
	const user = c.get('user');
	
	if (!user) {
		return c.json(
			{
				success: false,
				error: 'User not found',
			},
			404
		);
	}

	return c.json({
		success: true,
		data: user,
	});
});

/**
 * POST /api/fy2569/commons/auth/refresh
 * Refresh JWT token
 * Requires user authentication
 */
router.post('/refresh', userAuthMiddleware, async (c) => {
	const user = c.get('user');
	
	if (!user) {
		return c.json(
			{
				success: false,
				error: 'User not found',
			},
			404
		);
	}

	const jwtSecret = process.env.JWT_SECRET || '';
	const authService = new AuthService(jwtSecret);
	
	// Generate new token
	const token = authService.generateToken(user);

	return c.json({
		success: true,
		token,
		user,
	});
});

/**
 * PATCH /api/fy2569/commons/auth/password
 * Update current user's password
 * Requires user authentication
 */
router.patch('/password', userAuthMiddleware, async (c) => {
	try {
		const user = c.get('user');
		
		if (!user) {
			return c.json(
				{
					success: false,
					error: 'User not found',
				},
				404
			);
		}

		const body = await c.req.json<{ currentPassword: string; newPassword: string }>();
		const { currentPassword, newPassword } = body;

		if (!currentPassword || !newPassword) {
			return c.json(
				{
					success: false,
					error: 'Current password and new password are required',
				},
				400
			);
		}

		const jwtSecret = process.env.JWT_SECRET || '';
		const authService = new AuthService(jwtSecret);

		// Verify current password
		const fullUser = await authService.getUserByUsername(user.username);
		if (!fullUser) {
			return c.json(
				{
					success: false,
					error: 'User not found',
				},
				404
			);
		}

		const isValid = await authService.verifyPassword(currentPassword, fullUser.password);
		if (!isValid) {
			return c.json(
				{
					success: false,
					error: 'Current password is incorrect',
				},
				401
			);
		}

		// Update password
		const success = await authService.updatePassword(user.id, newPassword);

		if (!success) {
			return c.json(
				{
					success: false,
					error: 'Failed to update password',
				},
				500
			);
		}

		return c.json({
			success: true,
			message: 'Password updated successfully',
		});
	} catch (error) {
		console.error('Password update error:', error);
		return c.json(
			{
				success: false,
				error: 'Failed to update password',
			},
			500
		);
	}
});

/**
 * PATCH /api/fy2569/commons/auth/profile
 * Update current user's profile
 * Requires user authentication
 */
router.patch('/profile', userAuthMiddleware, async (c) => {
	try {
		const user = c.get('user');
		
		if (!user) {
			return c.json(
				{
					success: false,
					error: 'User not found',
				},
				404
			);
		}

		const body = await c.req.json<UpdateUserRequest>();
		const jwtSecret = process.env.JWT_SECRET || '';
		const authService = new AuthService(jwtSecret);

		const updatedUser = await authService.updateProfile(user.id, {
			displayname: body.displayname,
			firstname: body.firstname,
			lastname: body.lastname,
			jobtitle: body.jobtitle,
		});

		if (!updatedUser) {
			return c.json(
				{
					success: false,
					error: 'Failed to update profile',
				},
				500
			);
		}

		return c.json({
			success: true,
			data: updatedUser,
		});
	} catch (error) {
		console.error('Profile update error:', error);
		return c.json(
			{
				success: false,
				error: 'Failed to update profile',
			},
			500
		);
	}
});

/**
 * POST /api/fy2569/commons/auth/logout
 * Logout (client-side should delete token)
 * This is mainly for logging purposes
 */
router.post('/logout', userAuthMiddleware, async (c) => {
	return c.json({
		success: true,
		message: 'Logged out successfully',
	});
});

export default router;
