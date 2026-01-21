/**
 * Auth configuration and helper functions
 * This file can be extended in the future for more sophisticated auth mechanisms
 */

export interface AuthConfig {
	secretKey: string;
	authRequired: boolean;
	allowPublicRead: boolean; // If true, GET requests don't need auth
}

/**
 * Validate Bearer token
 * @param token The token to validate
 * @param secret The expected secret
 * @returns true if token matches secret
 */
export function validateBearerToken(token: string, secret: string): boolean {
	return token === secret;
}

/**
 * Extract token from Authorization header
 * @param authHeader Authorization header value
 * @returns The token or null if invalid format
 */
export function extractBearerToken(authHeader: string): string | null {
	const parts = authHeader.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') {
		return null;
	}
	return parts[1];
}

/**
 * Check if request method is safe (read-only)
 * @param method HTTP method
 * @returns true if method is GET, HEAD, or OPTIONS
 */
export function isSafeMethod(method: string): boolean {
	return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}
