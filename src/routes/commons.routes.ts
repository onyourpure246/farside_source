import { Hono } from 'hono';
import authRouter from './auth.routes';

const router = new Hono();

// Mount sub-routers
router.route('/auth', authRouter);

export default router;
