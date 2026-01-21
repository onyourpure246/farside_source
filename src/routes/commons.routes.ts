/**
 * @deprecated THIS MODULE IS LEGACY (Local Auth/Participants).
 * The new system uses ThaID (Frontend) + AUTH_SECRET (Backend Access).
 * Disabled in src/index.ts.
 */
import { Hono } from 'hono';
import participantRouter from './participant.routes';
import authRouter from './auth.routes';
import tagRouter from './tag.routes';

const router = new Hono();

// Mount sub-routers
router.route('/auth', authRouter);
router.route('/participant', participantRouter);
router.route('/tag', tagRouter);

export default router;
