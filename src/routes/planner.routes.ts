/**
 * @deprecated THIS MODULE IS NOT USED IN THE NEW RESOURCE CENTER FRONTEND.
 * It has been disabled in src/index.ts to improve startup performance and security.
 * If you need to re-enable it, uncomment the route mount in src/index.ts.
 */
import { Hono } from 'hono';
import projectRouter from './project.routes';
import taskRouter from './task.routes';
import taskParticipantRouter from './task-participant.routes';
import ganttRouter from './gantt.routes';

const router = new Hono();

// Mount sub-routers
router.route('/project', projectRouter);
router.route('/task/participant', taskParticipantRouter);
router.route('/task', taskRouter);
router.route('/gantt', ganttRouter);

export default router;
