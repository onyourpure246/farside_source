import { Hono } from 'hono';
import { NewsService } from '../services/news.service';
import { dualAuthMiddleware, AuthContext } from '../middleware/dual-auth.middleware';
import { randomUUID } from 'crypto';

const newsRouter = new Hono<AuthContext>();
const service = new NewsService();

// Apply dual authentication middleware to all routes
newsRouter.use('*', dualAuthMiddleware);

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

        // Hardcoded actor as per simplified requirement
        const actor = 'admin';

        const news = await service.createNews({
            title,
            content,
            category,
            status,
            publish_date,
            cover_image: cover_image_uuid || undefined
        }, actor);

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

        // Hardcoded actor as per simplified requirement
        const actor = 'admin';

        const news = await service.updateNews(id, updateData, actor);
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
        return c.json({ success: true, message: 'News item deleted successfully' });
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500);
    }
});

export default newsRouter;
