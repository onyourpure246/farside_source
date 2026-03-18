import { Hono } from 'hono';
import { AuthService } from '../services/auth.service';
import { dualAuthMiddleware } from '../middleware/dual-auth.middleware';
import type { AuthContext } from '../middleware/dual-auth.middleware';
import { ApiResponse, SafeUser } from '../types';
import { LogService } from '../services/log.service';
import { hashPID, maskPID } from '../utils/crypto.util';

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
        const { cadApiService } = await import('../services/cad-api.service');

        // 1. STRICT: Check CAD API (via cad-api.service)
        const cadEmployees = await cadApiService.executeEndpoint<any[]>('telephone_by_id', {
            card_id: pid
        });

        // If not found -> REJECT
        if (!cadEmployees || cadEmployees.length === 0) {
            return c.json<ApiResponse<null>>({
                success: false,
                error: 'Unauthorized: Employee not found in CAD database'
            }, 401);
        }

        const employee = cadEmployees[0];

        // 2. Employee Validated. Now handle Auto-Register / Sync
        const hashedPid = hashPID(pid);
        let user = await authService.getUserByUsername(hashedPid);
        const { execute } = await import('../services/database.service');

        const displayname = `${employee.t_front || ''}${employee.t_name} ${employee.t_surname}`;

        if (!user) {
            // CASE A: Auto-Register (New User)
            console.log(`[Auto-Register] Creating new user for CID: Hash(${hashedPid.substring(0, 8)}...)`);
            const randomPassword = Math.random().toString(36).slice(-8); // Placeholder pw
            
            const isSuperAdmin = pid === process.env.SUPER_ADMIN_PID;
            const role = isSuperAdmin ? 'admin' : 'user';
            const isadmin = isSuperAdmin ? 1 : 0;

            if (isSuperAdmin) {
                console.log(`[Auto-Register] Granting SUPER ADMIN rights to CID: ${pid}`);
            }

            const newUser = await authService.createUser(
                hashedPid, // Using DB Hash
                randomPassword,
                displayname,
                employee.t_name,
                employee.t_surname,
                `${maskPID(pid)}@cad.go.th`, // Masked PID Email
                employee.t_position,
                role,
                'active',
                isadmin
            );
            user = (await authService.getUserById(newUser.id)) as any; // Cast for now, ensure types match
        } else {
            // CASE B: User Exists -> Sync latest info from HR (Optional but good practice)
            if (employee) {
                await execute(
                    `UPDATE common_users 
                     SET firstname = ?, lastname = ?, displayname = ?, jobtitle = ?, updated_at = NOW() 
                     WHERE id = ?`,
                    [employee.t_name, employee.t_surname, displayname, employee.t_position, user.id]
                );
                // Refresh user object
                user = await authService.getUserById(user.id) as any;
            }
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
