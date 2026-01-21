import { Context, Next } from 'hono';

/**
 * CORS Middleware
 * Handles CORS headers and OPTIONS preflight requests
 */
export const corsMiddleware = async (c: Context, next: Next) => {
	// Set CORS headers for all requests
	c.header('Access-Control-Allow-Origin', '*');
	c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
	c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Secret');
	c.header('Access-Control-Max-Age', '86400'); // 24 hours

	// Handle OPTIONS preflight request
	if (c.req.method === 'OPTIONS') {
		return c.body(null, 204);
	}

	// Continue to next middleware/handler
	await next();
};
