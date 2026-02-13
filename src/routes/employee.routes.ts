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

        // 1. STRICT: Check Employee Table (HR Source of Truth)
        // We MUST verify against the employees table first. Use database service directly.
        const { queryOne, execute } = await import('../services/database.service');

        const employee = await queryOne<{
            id: number;
            cid: string;
            firstname: string;
            lastname: string;
            email: string;
            position: string;
            isactive: number;
        }>('SELECT * FROM employees WHERE cid = ?', [pid]);

        // If not found or inactive -> REJECT
        if (!employee || employee.isactive !== 1) {
            return c.json<ApiResponse<null>>({
                success: false,
                error: 'Unauthorized: Employee not found or inactive'
            }, 401);
        }

        // 2. Employee Validated. Now handle Auto-Register / Sync
        let user = await authService.getUserByUsername(pid);

        if (!user) {
            // CASE A: Auto-Register (New User)
            console.log(`[Auto-Register] Creating new user for CID: ${pid}`);
            const randomPassword = Math.random().toString(36).slice(-8); // Placeholder pw
            const newUser = await authService.createUser(
                pid,
                randomPassword,
                `${employee.firstname} ${employee.lastname}`,
                employee.firstname,
                employee.lastname,
                employee.email,
                employee.position,
                'user',
                'active',
                0
            );
            user = (await authService.getUserById(newUser.id)) as any; // Cast for now, ensure types match
        } else {
            // CASE B: User Exists -> Sync latest info from HR (Optional but good practice)
            await execute(
                `UPDATE common_users 
                 SET firstname = ?, lastname = ?, email = ?, jobtitle = ?, updated_at = NOW() 
                 WHERE id = ?`,
                [employee.firstname, employee.lastname, employee.email, employee.position, user.id]
            );
            // Refresh user object
            user = await authService.getUserById(user.id) as any;
        }

        if (!user) {
            return c.json<ApiResponse<null>>({
                success: false,
                error: 'Failed to retrieve or create user'
            }, 500);
        }

        // Return SafeUser (without password)
        const safeUser: SafeUser = {
            id: user.id,
            username: user.username,
            displayname: user.displayname,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            jobtitle: user.jobtitle,
            role: user.role,
            status: user.status,
            isadmin: user.isadmin,
            created_at: new Date(user.created_at).toISOString(),
            updated_at: new Date(user.updated_at).toISOString()
        };

        // Log Verification Success
        try {
            const logService = new LogService();
            const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
            const userAgent = c.req.header('user-agent');
            await logService.logActivity(
                safeUser.id,
                'VERIFY_EMPLOYEE',
                'AUTH',
                safeUser.id,
                { displayname: safeUser.displayname },
                ip,
                userAgent
            );
        } catch (e) {
            console.error('Failed to log verification:', e);
        }

        // Generate JWT Token
        const token = authService.generateToken(safeUser);

        return c.json<ApiResponse<{ user: SafeUser, token: string }>>({
            success: true,
            data: {
                user: safeUser,
                token: token
            }
        }, 200);

    } catch (error: any) {
        console.error('Verify error:', error);
        return c.json<ApiResponse<null>>({
            success: false,
            error: 'Internal verification error: ' + error.message
        }, 500);
    }
});

export default router;
