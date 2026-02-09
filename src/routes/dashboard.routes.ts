import { Hono } from 'hono';
import { query, queryOne } from '../services/database.service';
import { dualAuthMiddleware, AuthContext } from '../middleware/dual-auth.middleware';
import { RowDataPacket } from 'mysql2';

const dashboardRouter = new Hono<AuthContext>();

// Secure all dashboard routes
dashboardRouter.use('*', dualAuthMiddleware);

/**
 * GET /api/fy2569/dashboard/stats
 * Overview statistics for dashboard cards
 */
dashboardRouter.get('/stats', async (c) => {
    try {
        // 1. Total Logins (VERIFY_EMPLOYEE actions)
        const loginResult = await queryOne<{ count: number }>(`
            SELECT COUNT(*) as count FROM common_activity_logs WHERE action = 'VERIFY_EMPLOYEE'
        `);

        // 2. Active Users (Unique User IDs in logs)
        const userResult = await queryOne<{ count: number }>(`
            SELECT COUNT(DISTINCT user_id) as count FROM common_activity_logs
        `);

        // 3. Total Files (Active files in system)
        const fileResult = await queryOne<{ count: number }>(`
            SELECT COUNT(*) as count FROM dl_files WHERE isactive = 1
        `);

        // 4. System Health (Crashes in last 24h)
        const crashResult = await queryOne<{ count: number }>(`
            SELECT COUNT(*) as count 
            FROM common_activity_logs 
            WHERE action = 'SYSTEM_CRASH' 
            AND created_at >= NOW() - INTERVAL 1 DAY
        `);

        return c.json({
            success: true,
            data: {
                total_logins: loginResult?.count || 0,
                active_users: userResult?.count || 0,
                total_files: fileResult?.count || 0,
                system_crashes: crashResult?.count || 0
            }
        });
    } catch (error: any) {
        console.error('Dashboard Stats Error:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

/**
 * GET /api/fy2569/dashboard/chart-data
 * Data for graphs and tables
 */
dashboardRouter.get('/chart-data', async (c) => {
    try {
        // 1. Login Trends (Last 7 Days)
        const loginTrends = await query<{ date: string, count: number }>(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM common_activity_logs 
            WHERE action = 'VERIFY_EMPLOYEE' 
            AND created_at >= DATE(NOW()) - INTERVAL 7 DAY
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        // 2. Top Downloads (Top 5)
        // Linking resource_id (sysname) to dl_files.sysname
        const topDownloads = await query<{ file_id: number, filename: string, download_count: number }>(`
            SELECT 
                f.id as file_id,
                f.name as filename,
                COUNT(l.id) as download_count
            FROM common_activity_logs l
            JOIN dl_files f ON l.resource_id = f.sysname
            WHERE l.action IN ('DOWNLOAD', 'DOWNLOAD_UUID') 
            GROUP BY f.id, f.name
            ORDER BY download_count DESC
            LIMIT 5
        `);

        return c.json({
            success: true,
            data: {
                login_trends: loginTrends,
                top_downloads: topDownloads
            }
        });
    } catch (error: any) {
        console.error('Dashboard Chart Data Error:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

/**
 * GET /api/fy2569/dashboard/audit-logs
 * Recent critical actions (Deletions, Crashes)
 */
dashboardRouter.get('/audit-logs', async (c) => {
    try {
        const auditLogs = await query<{
            id: number,
            action: string,
            details: any,
            user_id: number | null,
            created_at: string
        }>(`
            SELECT id, action, details, user_id, created_at 
            FROM common_activity_logs 
            WHERE action IN ('DELETE_USER', 'DELETE_FILE', 'DELETE_FOLDER', 'DELETE_NEWS', 'SYSTEM_CRASH') 
            ORDER BY created_at DESC 
            LIMIT 10
        `);

        // Parse details JSON if string
        const parsedLogs = auditLogs.map(log => {
            let details = log.details;
            try {
                if (typeof log.details === 'string') {
                    details = JSON.parse(log.details);
                }
            } catch (e) {
                // If parsing fails, keep original string
            }

            // For SYSTEM_CRASH, extracting only the message for better readability
            if (log.action === 'SYSTEM_CRASH' && details?.message) {
                return { ...log, details: details.message };
            }

            return { ...log, details };
        });

        return c.json({
            success: true,
            data: parsedLogs
        });
    } catch (error: any) {
        console.error('Dashboard Audit Logs Error:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

export default dashboardRouter;
