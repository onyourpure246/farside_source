import { Hono } from 'hono';
import { NewsService } from '../services/news.service';
import { dualAuthMiddleware, dualAuthMiddlewarePermissive, AuthContext } from '../middleware/dual-auth.middleware';
import { randomUUID } from 'crypto';
import { LogService } from '../services/log.service';
import { SafeUser } from '../types';

const newsRouter = new Hono<AuthContext>();
const service = new NewsService();

// Apply permissive dual authentication middleware to all routes
// GET methods will be public, others will require auth
newsRouter.use('*', dualAuthMiddlewarePermissive);

// GET / - List all news
newsRouter.get('/', async (c) => {
    try {
        const limit = Number(c.req.query('limit')) || 20;
        const offset = Number(c.req.query('offset')) || 0;
        const status = c.req.query('status') || 'published'; // 'published', 'draft', 'all'

        const news = await service.getAllNews(limit, offset, status);
        return c.json({ success: true, data: news });
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500);
    }
});

// GET /:id - Get news by ID
newsRouter.get('/:id', async (c) => {
    try {
        const id = Number(c.req.param('id'));
        const news = await service.getNewsById(id);
        if (!news) {
            return c.json({ success: false, error: 'News item not found' }, 404);
        }

        // Increment view count ONLY for non-admin users (Real user engagement)
        const user = c.get('user') as SafeUser | undefined;

        if (user && !user.isadmin) {
            await service.incrementViewCount(id);
            news.view_count = (news.view_count || 0) + 1; // Optimistic update
        }

        return c.json({ success: true, data: news });
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500);
    }
});

// POST / - Create news (Multipart for image upload support)
newsRouter.post('/', async (c) => {
    try {
        // Parse multipart form data
        const formData = await c.req.formData();

        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const category = formData.get('category') as string;
        const status = (formData.get('status') as 'draft' | 'published') || 'published';
        const publish_date = formData.get('publish_date') as string;

        let cover_image_uuid = null;

        // Handle cover image upload
        const file = formData.get('cover_image');
        if (file && file instanceof File) {
            cover_image_uuid = randomUUID();
            const arrayBuffer = await file.arrayBuffer();
            await service.uploadCoverImage(arrayBuffer, cover_image_uuid);
        }

        // Determine actor
        const user = c.get('user') as SafeUser | undefined;
        let actor = user?.username || 'system';
        if (user && user.firstname && user.lastname) {
            actor = `${user.firstname} ${user.lastname}`;
        }

        const news = await service.createNews({
            title,
            content,
            category,
            status,
            publish_date,
            cover_image: cover_image_uuid || undefined
        }, actor);

        // Log Create News
        try {
            const logService = new LogService();
            const user = c.get('user') as SafeUser | undefined;
            const userId = user?.id || null;
            const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
            const agent = c.req.header('user-agent');
            await logService.logActivity(
                userId,
                'CREATE_NEWS',
                'NEWS',
                news.id,
                { title: news.title },
                ip,
                agent
            );
        } catch (e) {
            console.error('Failed to log create news', e);
        }

        return c.json({ success: true, data: news });
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500);
    }
});

// PATCH /:id - Update news
newsRouter.patch('/:id', async (c) => {
    try {
        const id = Number(c.req.param('id'));
        const formData = await c.req.formData();

        const updateData: any = {};
        if (formData.has('title')) updateData.title = formData.get('title');
        if (formData.has('content')) updateData.content = formData.get('content');
        if (formData.has('category')) updateData.category = formData.get('category');
        if (formData.has('status')) updateData.status = formData.get('status');
        if (formData.has('publish_date')) updateData.publish_date = formData.get('publish_date');

        // Handle cover image update
        const file = formData.get('cover_image');
        if (file && file instanceof File) {
            const cover_image_uuid = randomUUID();
            const arrayBuffer = await file.arrayBuffer();
            await service.uploadCoverImage(arrayBuffer, cover_image_uuid);
            updateData.cover_image = cover_image_uuid;
        }

        // Determine actor
        const user = c.get('user') as SafeUser | undefined;
        let actor = user?.username || 'system';
        if (user && user.firstname && user.lastname) {
            actor = `${user.firstname} ${user.lastname}`;
        }

        const news = await service.updateNews(id, updateData, actor);

        // Log Update News
        try {
            const logService = new LogService();
            const user = c.get('user') as SafeUser | undefined;
            const userId = user?.id || null;
            const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
            const agent = c.req.header('user-agent');
            await logService.logActivity(
                userId,
                'UPDATE_NEWS',
                'NEWS',
                news.id,
                { updates: updateData },
                ip,
                agent
            );
        } catch (e) {
            console.error('Failed to log update news', e);
        }

        return c.json({ success: true, data: news });
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500);
    }
});

// DELETE /:id - Delete news
newsRouter.delete('/:id', async (c) => {
    try {
        const id = Number(c.req.param('id'));
        const success = await service.deleteNews(id);
        if (!success) {
            return c.json({ success: false, error: 'News item not found or could not be deleted' }, 404);
        }
        // Log Delete News
        try {
            const logService = new LogService();
            const user = c.get('user') as SafeUser | undefined;
            const userId = user?.id ?? null;
            const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
            const agent = c.req.header('user-agent');
            await logService.logWarning(
                userId,
                'DELETE_NEWS',
                `News ${id} deleted by Admin`,
                'NEWS',
                id,
                ip,
                agent
            );
        } catch (e) {
            console.error('Failed to log delete news', e);
        }

        return c.json({ success: true, message: 'News item deleted successfully' });
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500);
    }
});

export default newsRouter;
