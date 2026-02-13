import { Hono } from 'hono';
import { AuthService } from '../services/auth.service';
import { userAuthMiddleware } from '../middleware/dual-auth.middleware';
import type { AuthContext } from '../middleware/dual-auth.middleware';
import type { LoginRequest, CreateUserRequest, UpdateUserRequest } from '../types';
import { LogService } from '../services/log.service';


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
			// Log failed login
			try {
				const logService = new LogService();
				const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
				const userAgent = c.req.header('user-agent');
				await logService.logWarning(
					null,
					'LOGIN_FAILED',
					'Invalid credentials',
					'AUTH',
					username,
					ip,
					userAgent
				);
			} catch (e) { console.error('Log failed', e); }

			return c.json(
				{
					success: false,
					error: 'Invalid username or password',
				},
				401
			);

		}

		// Log successful login
		try {
			const logService = new LogService();
			const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
			const userAgent = c.req.header('user-agent');
			await logService.logActivity(
				result.user.id,
				'LOGIN',
				'AUTH',
				null,
				{ username },
				ip,
				userAgent
			);
		} catch (e) { console.error('Log failed', e); }

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
	// Log logout
	try {
		const user = c.get('user');
		const logService = new LogService();
		const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
		const userAgent = c.req.header('user-agent');
		await logService.logActivity(
			user?.id || null,
			'LOGOUT',
			'AUTH',
			null,
			null,
			ip,
			userAgent
		);
	} catch (e) { console.error('Log failed', e); }

	return c.json({
		success: true,
		message: 'Logged out successfully',
	});

});

/**
 * POST /api/fy2569/commons/auth/thaid-login
 * Login with ThaID code or CID (for internal/testing)
 * Logic:
 * 1. Verify code/Get CID
 * 2. Check Employee DB
 * 3. Upsert User
 * 4. Return Token
 */
router.post('/thaid-login', async (c) => {
	try {
		const body = await c.req.json<{ code?: string; cid?: string }>();
		const { code, cid } = body;

		if (!code && !cid) {
			return c.json({ success: false, error: 'ThaID code or CID is required' }, 400);
		}

		let userCid = cid ? cid.trim() : undefined;

		// Mock ThaID Check if code is provided (In production, call ThaID API)
		if (code && !userCid) {
			// ============================================================
			// 🚀 PRODUCTION IMPLEMENTATION (TODO)
			// ============================================================
			// 1. Call ThaID Token Endpoint
			// const response = await axios.post('https://imauth.bora.dopa.go.th/api/v2/oauth2/token', {
			//     grant_type: 'authorization_code',
			//     code: code,
			//     client_id: process.env.THAID_CLIENT_ID,
			//     client_secret: process.env.THAID_CLIENT_SECRET,
			//     redirect_uri: process.env.THAID_REDIRECT_URI
			// });
			// 
			// 2. Get ID Token & Decode
			// const idToken = response.data.id_token;
			// const decoded = jwt.decode(idToken);
			// userCid = decoded.pid; // Real CID from ThaID
			// ============================================================

			console.log('Mocking ThaID Code Exchange for code:', code);

			// FOR TESTING: 
			// Check if code (trimmed) is a 13-digit number (Sandbox flow)
			const content = code.trim();

			if (/^\d{13}$/.test(content)) {
				userCid = content;
			} else if (content.startsWith('CID_')) {
				userCid = content.replace('CID_', '').trim();
			} else {
				// Only for "real" mock codes that are NOT CIDs, assume the default tester
				// But this is likely confusing, so let's log it clearly
				console.warn('Unknown Mock Code format. Using default Somchai (3101000046943). code:', code);
				userCid = '3101000046943';
			}
		}

		if (!userCid) {
			return c.json({ success: false, error: 'Could not retrieve CID' }, 400);
		}

		const jwtSecret = process.env.JWT_SECRET || '';
		const authService = new AuthService(jwtSecret);

		// Perform Upsert Logic
		try {
			const user = await authService.upsertThaIDUser(userCid);
			const token = authService.generateToken(user);

			// Log Activity
			try {
				const logService = new LogService();
				const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
				const userAgent = c.req.header('user-agent');
				await logService.logActivity(
					user.id,
					'LOGIN_THAID',
					'AUTH',
					null,
					{ cid: userCid },
					ip,
					userAgent
				);
			} catch (e) { console.error('Log failed', e); }

			return c.json({
				success: true,
				token,
				user,
			});

		} catch (error: any) {
			console.error('ThaID Login Logic Error:', error.message);
			// If checking employee failed
			if (error.message.includes('Unauthorized')) {
				return c.json({ success: false, error: 'User is not authorized (Employee check failed)' }, 401);
			}
			return c.json({ success: false, error: 'Login failed: ' + error.message }, 500);
		}

	} catch (error) {
		console.error('ThaID Login error:', error);
		return c.json({ success: false, error: 'Internal Server Error' }, 500);
	}
});

export default router;
