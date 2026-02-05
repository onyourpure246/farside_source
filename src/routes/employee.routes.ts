import { Hono } from 'hono';
import { AuthService } from '../services/auth.service';
import { dualAuthMiddleware } from '../middleware/dual-auth.middleware';
import type { AuthContext } from '../middleware/dual-auth.middleware';
import { ApiResponse, SafeUser } from '../types';
import { LogService } from '../services/log.service';


const router = new Hono<AuthContext>();

// Secure this route with Dual Auth (expecting Bearer AUTH_SECRET from Frontend)
router.use('*', dualAuthMiddleware);

/**
 * POST /api/fy2569/employee/verify
 * Verify if a PID exists in the system and return user details.
 * Used by Frontend (NextAuth) during ThaID login flow.
 */
router.post('/verify', async (c) => {
    try {
        const body = await c.req.json<{ pid: string }>();
        const { pid } = body;

        if (!pid) {
            return c.json<ApiResponse<null>>({
                success: false,
                error: 'PID is required'
            }, 400);
        }

        // Initialize AuthService (JWT secret is not strictly needed for this lookup but required by constructor)
        const jwtSecret = process.env.JWT_SECRET || 'temp-secret';
        const authService = new AuthService(jwtSecret);

        // In our system, username = PID
        const user = await authService.getUserByUsername(pid);

        if (!user) {
            return c.json<ApiResponse<null>>({
                success: false,
                error: 'Employee not found'
            }, 404);
        }

        // Return SafeUser (without password)
        const safeUser: SafeUser = {
            id: user.id,
            username: user.username,
            displayname: user.displayname,
            firstname: user.firstname,
            lastname: user.lastname,
            jobtitle: user.jobtitle,
            isadmin: user.isadmin,
            created_at: user.created_at,
            updated_at: user.updated_at
        };

        // Log Verification Success (Important for Audit)
        try {
            const logService = new LogService();
            const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
            const userAgent = c.req.header('user-agent');
            await logService.logActivity(
                safeUser.id,
                'VERIFY_EMPLOYEE',
                'USER', // Corrected from AUTH
                safeUser.id, // Corrected from PID to User ID
                { displayname: safeUser.displayname }, // Removed PID for security
                ip,
                userAgent
            );
        } catch (e) {
            console.error('Failed to log verification:', e);
        }


        // Generate JWT Token for specific user
        const token = authService.generateToken(safeUser);

        return c.json<ApiResponse<{ user: SafeUser, token: string }>>({
            success: true,
            data: {
                user: safeUser,
                token: token
            }
        }, 200);

    } catch (error) {
        console.error('Verify error:', error);
        return c.json<ApiResponse<null>>({
            success: false,
            error: 'Internal verification error'
        }, 500);
    }
});

export default router;
