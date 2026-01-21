import { Hono } from 'hono';
import { dualAuthMiddleware } from '../middleware/dual-auth.middleware';
import type { AuthContext } from '../middleware/dual-auth.middleware';
import { ApiResponse } from '../types';
import { query } from '../services/database.service';

const router = new Hono<AuthContext>();

// Apply dual authentication middleware
router.use('*', dualAuthMiddleware);

interface GanttTask {
	id: number;
	project_id: number;
	project_name: string;
	project_shortname: string;
	task_name: string;
	task_description: string;
	planned_start_date: string | null;
	planned_end_date: string | null;
	actual_start_date: string | null;
	actual_end_date: string | null;
	displayorder: number;
	tags?: string; // JSON string of tag objects with name, icon, colour
}

interface GanttChartResponse {
	tasks: GanttTask[];
	fiscal_year: {
		start: string;
		end: string;
		label: string;
	};
}

/**
 * GET /api/fy2569/planner/gantt - Get all tasks with project info for Gantt Chart
 * 
 * Query parameters:
 * - fiscal_year_start: Start date of fiscal year (YYYY-MM-DD), defaults to current year's October 1
 * - fiscal_year_end: End date of fiscal year (YYYY-MM-DD), defaults to next year's September 30
 */
router.get('/', async (c) => {
	try {
		// Get fiscal year parameters from query or use defaults
		const currentYear = new Date().getFullYear();
		const currentMonth = new Date().getMonth(); // 0-11
		
		// If current month is Oct-Dec, use current year as start, else use previous year
		const defaultFiscalYearStart = currentMonth >= 9 
			? `${currentYear}-10-01` 
			: `${currentYear - 1}-10-01`;
		const defaultFiscalYearEnd = currentMonth >= 9 
			? `${currentYear + 1}-09-30` 
			: `${currentYear}-09-30`;
		
		const fiscalYearStart = c.req.query('fiscal_year_start') || defaultFiscalYearStart;
		const fiscalYearEnd = c.req.query('fiscal_year_end') || defaultFiscalYearEnd;
		const fiscalYearLabel = c.req.query('fiscal_year_label') || 'ปีงบประมาณ';
		
		// Query to get all tasks with their project information and tags
		// Note: MySQL uses JSON_ARRAYAGG instead of json_group_array
		const sqlQuery = `
			SELECT 
				t.id,
				t.project_id,
				p.name as project_name,
				p.shortname as project_shortname,
				t.name as task_name,
				t.description as task_description,
				t.planned_start_date,
				t.planned_end_date,
				t.actual_start_date,
				t.actual_end_date,
				t.displayorder,
				(
					SELECT JSON_ARRAYAGG(
						JSON_OBJECT(
							'name', ct.name,
							'icon', ct.icon,
							'colour', ct.colour
						)
					)
					FROM planner_task_tags ptt
					INNER JOIN common_tags ct ON ptt.tag_id = ct.id
					WHERE ptt.task_id = t.id
				) as tags
			FROM planner_tasks t
			INNER JOIN planner_projects p ON t.project_id = p.id
			WHERE t.isactive = 1 
				AND p.isactive = 1
				AND (
					(
						t.planned_start_date IS NULL
						AND t.planned_end_date IS NULL
					) OR (
						(t.planned_start_date >= ? AND t.planned_start_date <= ?)
						OR (t.planned_end_date >= ? AND t.planned_end_date <= ?)
						OR (t.planned_start_date <= ? AND t.planned_end_date >= ?)
					)
				)
			ORDER BY p.displayorder ASC, t.displayorder ASC
		`;
		
		const results = await query<GanttTask>(
			sqlQuery,
			[
				fiscalYearStart, fiscalYearEnd,
				fiscalYearStart, fiscalYearEnd,
				fiscalYearStart, fiscalYearEnd
			]
		);
		
		const response: GanttChartResponse = {
			tasks: results || [],
			fiscal_year: {
				start: fiscalYearStart,
				end: fiscalYearEnd,
				label: fiscalYearLabel,
			},
		};
		
		return c.json<ApiResponse<GanttChartResponse>>({
			success: true,
			data: response,
			message: `Found ${results?.length || 0} task(s) for Gantt Chart`,
		});
	} catch (error) {
		return c.json<ApiResponse<any>>(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			500
		);
	}
});

export default router;
