import { Context, Next } from 'hono';

export interface AuthContext {
	Variables: {
		authSecret?: string;
	};
}

/**
 * Authorization middleware that validates the authorization token for all requests
 * Expected header: Authorization: Bearer <token>
 * Token should match AUTH_SECRET environment variable
 */
export async function authMiddleware(c: Context<AuthContext>, next: Next) {
	// Get authorization header
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
	const expectedSecret = process.env.AUTH_SECRET || '';

	// Validate token
	if (token !== expectedSecret) {
		return c.json(
			{
				success: false,
				error: 'Invalid authorization token',
			},
			403
		);
	}

	// Token is valid, proceed to next middleware/handler
	return await next();
}

/**
 * Permissive auth middleware that only requires token for non-GET requests
 * GET requests are allowed without authentication
 * POST, PATCH, DELETE require valid Bearer token
 */
export async function authMiddlewarePermissive(c: Context<AuthContext>, next: Next) {
	const method = c.req.method;

	// Allow GET, HEAD, OPTIONS requests without authentication
	if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
		return await next();
	}

	// For other methods (POST, PATCH, DELETE), validate authentication
	const authHeader = c.req.header('Authorization');

	if (!authHeader) {
		return c.json(
			{
				success: false,
				error: 'Missing Authorization header for mutation operations',
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
	const expectedSecret = process.env.AUTH_SECRET || '';

	// Validate token - compare strings
	if (!expectedSecret || token !== expectedSecret) {
		return c.json(
			{
				success: false,
				error: 'Invalid authorization token',
			},
			403
		);
	}

	// Token is valid, proceed to next middleware/handler
	return await next();
}
