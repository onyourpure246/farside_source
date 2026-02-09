
import { Hono } from 'hono';
import { query, execute } from '../services/database.service';
import { dualAuthMiddleware, AuthContext } from '../middleware/dual-auth.middleware';

const searchRouter = new Hono<AuthContext>();

// Allow Public GET /popular, but Enforce Auth for POST /track (No Guests)
searchRouter.use('*', dualAuthMiddleware);

/**
 * POST /api/fy2569/search/track
 * Track a search keyword
 */
searchRouter.post('/track', async (c) => {
    try {
        const body = await c.req.json();
        const { keyword, results_count } = body;

        if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
            return c.json({ success: false, error: 'Keyword is required' }, 400);
        }

        const cleanKeyword = keyword.trim();

        // Get user info if available
        const user = c.get('user');

        let userId: number | null = null;
        if (user && user.id !== undefined) {
            userId = user.id;
        }

        // Get IP and User Agent
        const ipAddress = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';

        await execute(`
            INSERT INTO search_logs (keyword, user_id, results_count, ip_address)
            VALUES (?, ?, ?, ?)
        `, [cleanKeyword, userId, results_count || 0, ipAddress]);

        return c.json({ success: true, message: 'Search tracked' }, 201);
    } catch (error: any) {
        console.error('Track Search Error:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

/**
 * GET /api/fy2569/search/popular
 * Get popular search tags
 */
searchRouter.get('/popular', async (c) => {
    try {
        let limit = parseInt(c.req.query('limit') || '10');
        if (isNaN(limit) || limit < 1) limit = 10;

        let days = parseInt(c.req.query('days') || '30');
        if (isNaN(days) || days < 1) days = 30;

        const popularTags = await query<{ keyword: string, count: number }>(`
            SELECT keyword, COUNT(*) as count
            FROM search_logs
            WHERE created_at >= NOW() - INTERVAL ? DAY
            GROUP BY keyword
            ORDER BY count DESC
            LIMIT ?
        `, [days, limit]);

        return c.json({
            success: true,
            data: popularTags
        });
    } catch (error: any) {
        console.error('Get Popular Tags Error:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

export default searchRouter;
