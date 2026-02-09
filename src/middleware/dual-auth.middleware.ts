import { Context, Next } from 'hono';
import { AuthService } from '../services/auth.service';
import { SafeUser } from '../types';

export interface AuthContext {
	Variables: {
		user?: SafeUser;
		authType?: 'bearer' | 'jwt';
	};
}

/**
 * Dual authentication middleware
 * Supports both:
 * 1. Authorization: Bearer <AUTH_SECRET> (for technical/system access)
 * 2. Authorization: Bearer <JWT_TOKEN> (for user authentication)
 */
export async function dualAuthMiddleware(c: Context<AuthContext>, next: Next) {
	const authHeader = c.req.header('Authorization');

	if (!authHeader) {
		return c.json(
			{
				success: false,
				error: 'Missing Authorization header',
			},
			401
		);
	}

	// Parse Bearer token
	const parts = authHeader.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') {
		return c.json(
			{
				success: false,
				error: 'Invalid Authorization format. Expected: Bearer <token>',
			},
			401
		);
	}

	const token = parts[1];
	const authSecret = process.env.AUTH_SECRET || '';
	const jwtSecret = process.env.JWT_SECRET || '';

	// Check if it's the technical auth secret
	if (token === authSecret) {
		// Mock a system user for context to ensure logging works
		const systemUser: SafeUser = {
			id: 0,
			username: 'system',
			displayname: 'System Administrator',
			firstname: 'System',
			lastname: 'Admin',
			jobtitle: 'System',
			isadmin: 1,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};
		c.set('user', systemUser);
		c.set('authType', 'bearer');
		return await next();
	}

	// Try to verify as JWT token
	try {
		const authService = new AuthService(jwtSecret);
		const user = await authService.verifyToken(token);

		if (user) {
			c.set('user', user);
			c.set('authType', 'jwt');
			return await next();
		}
	} catch (error) {
		// Token is not a valid JWT, continue to rejection
		console.error('Token verification error:', error);
	}

	// Token is neither valid AUTH_SECRET nor valid JWT
	return c.json(
		{
			success: false,
			error: 'Invalid authorization token',
		},
		403
	);
}

/**
 * Permissive dual auth middleware
 * GET requests are allowed without authentication
 * POST, PATCH, DELETE require valid Bearer token or JWT
 */
export async function dualAuthMiddlewarePermissive(c: Context<AuthContext>, next: Next) {
	const method = c.req.method;

	// Allow GET, HEAD, OPTIONS requests without authentication
	if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
		return await next();
	}

	// For other methods, use dual auth
	return await dualAuthMiddleware(c, next);
}

/**
 * User-only authentication middleware
 * Only accepts JWT tokens (user authentication)
 * Rejects technical bearer tokens
 */
export async function userAuthMiddleware(c: Context<AuthContext>, next: Next) {
	const authHeader = c.req.header('Authorization');

	if (!authHeader) {
		return c.json(
			{
				success: false,
				error: 'Missing Authorization header',
			},
			401
		);
	}

	// Parse Bearer token
	const parts = authHeader.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') {
		return c.json(
			{
				success: false,
				error: 'Invalid Authorization format. Expected: Bearer <token>',
			},
			401
		);
	}

	const token = parts[1];
	const jwtSecret = process.env.JWT_SECRET || '';

	// Verify JWT token
	try {
		const authService = new AuthService(jwtSecret);
		const user = await authService.verifyToken(token);

		if (!user) {
			return c.json(
				{
					success: false,
					error: 'Invalid or expired token',
				},
				403
			);
		}

		c.set('user', user);
		c.set('authType', 'jwt');
		return await next();
	} catch (error) {
		return c.json(
			{
				success: false,
				error: 'Invalid or expired token',
			},
			403
		);
	}
}

/**
 * Admin-only middleware
 * Requires user authentication AND admin privileges
 */
export async function adminAuthMiddleware(c: Context<AuthContext>, next: Next) {
	const authHeader = c.req.header('Authorization');

	if (!authHeader) {
		return c.json(
			{
				success: false,
				error: 'Missing Authorization header',
			},
			401
		);
	}

	// Parse Bearer token
	const parts = authHeader.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') {
		return c.json(
			{
				success: false,
				error: 'Invalid Authorization format. Expected: Bearer <token>',
			},
			401
		);
	}

	const token = parts[1];
	const jwtSecret = process.env.JWT_SECRET || '';
	const authSecret = process.env.AUTH_SECRET || '';

	// 1. System/Server-to-Server Admin Access (using AUTH_SECRET)
	if (token === authSecret) {
		// Mock a super-admin user for the context
		const systemAdmin = {
			id: 0,
			username: 'system',
			displayname: 'System Administrator',
			firstname: 'System',
			lastname: 'Admin',
			jobtitle: 'System',
			isadmin: 1, // Crucial
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};
		c.set('user', systemAdmin);
		c.set('authType', 'bearer');
		return await next();
	}

	// 2. User Access (Verify JWT token)
	try {
		const authService = new AuthService(jwtSecret);
		const user = await authService.verifyToken(token);

		if (!user) {
			return c.json(
				{
					success: false,
					error: 'Invalid or expired token',
				},
				403
			);
		}

		// Check if user is admin
		if (!user.isadmin) {
			return c.json(
				{
					success: false,
					error: 'Admin privileges required',
				},
				403
			);
		}

		c.set('user', user);
		c.set('authType', 'jwt');
		return await next();
	} catch (error) {
		return c.json(
			{
				success: false,
				error: 'Invalid or expired token',
			},
			403
		);
	}
}

/**
 * Optional authentication middleware
 * Attempts to extract user from token if present, but does not block request if missing or invalid.
 * Useful for public endpoints that can be enhanced with user context (e.g. search tracking).
 */
export async function optionalAuthMiddleware(c: Context<AuthContext>, next: Next) {
	const authHeader = c.req.header('Authorization');

	// If no auth header, proceed as anonymous
	if (!authHeader) {
		return await next();
	}

	// Parse Bearer token
	const parts = authHeader.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') {
		// Invalid format, just ignore and proceed as anonymous
		return await next();
	}

	const token = parts[1];
	const authSecret = process.env.AUTH_SECRET || '';
	const jwtSecret = process.env.JWT_SECRET || '';

	// 1. System/Technical Access
	if (token === authSecret) {
		const systemUser: SafeUser = {
			id: 0,
			username: 'system',
			displayname: 'System',
			firstname: 'System',
			lastname: 'User',
			jobtitle: 'System',
			isadmin: 1,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};
		c.set('user', systemUser);
		c.set('authType', 'bearer');
		return await next();
	}

	// 2. User Access (JWT)
	try {
		const authService = new AuthService(jwtSecret);
		const user = await authService.verifyToken(token);

		if (user) {
			c.set('user', user);
			c.set('authType', 'jwt');
		}
	} catch (error) {
		// Ignore token errors
	}

	return await next();
}
