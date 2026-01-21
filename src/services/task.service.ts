import { PlannerTask, CreateTaskRequest, UpdateTaskRequest } from '../types';
import { query, queryOne, execute } from './database.service';

export class TaskService {
	async getAll(): Promise<PlannerTask[]> {
		return await query<PlannerTask>(
			'SELECT * FROM planner_tasks ORDER BY project_id ASC, displayorder ASC'
		);
	}

	async getById(id: number): Promise<PlannerTask | null> {
		return await queryOne<PlannerTask>(
			'SELECT * FROM planner_tasks WHERE id = ?',
			[id]
		);
	}

	async getByProject(projectId: number): Promise<PlannerTask[]> {
		return await query<PlannerTask>(
			'SELECT * FROM planner_tasks WHERE project_id = ? ORDER BY displayorder ASC',
			[projectId]
		);
	}

	async create(req: CreateTaskRequest, createdBy?: string): Promise<PlannerTask> {
		const result = await execute(
			`INSERT INTO planner_tasks 
			(project_id, name, description, displayorder, planned_start_date, planned_end_date, created_by, updated_by, created_at, updated_at) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
			[
				req.project_id,
				req.name || null,
				req.description || null,
				req.displayorder || 0,
				req.planned_start_date || null,
				req.planned_end_date || null,
				createdBy || null,
				createdBy || null,
			]
		);

		const created = await this.getById(result.insertId);
		if (!created) throw new Error('Failed to create task');
		return created;
	}

	async update(id: number, req: UpdateTaskRequest, updatedBy?: string): Promise<PlannerTask> {
		const existing = await this.getById(id);
		if (!existing) throw new Error('Task not found');

		const fields: string[] = [];
		const values: any[] = [];

		if (req.project_id !== undefined) {
			fields.push('project_id = ?');
			values.push(req.project_id);
		}
		if (req.name !== undefined) {
			fields.push('name = ?');
			values.push(req.name);
		}
		if (req.description !== undefined) {
			fields.push('description = ?');
			values.push(req.description);
		}
		if (req.displayorder !== undefined) {
			fields.push('displayorder = ?');
			values.push(req.displayorder);
		}
		if (req.planned_start_date !== undefined) {
			fields.push('planned_start_date = ?');
			values.push(req.planned_start_date);
		}
		if (req.planned_end_date !== undefined) {
			fields.push('planned_end_date = ?');
			values.push(req.planned_end_date);
		}
		if (req.actual_start_date !== undefined) {
			fields.push('actual_start_date = ?');
			values.push(req.actual_start_date);
		}
		if (req.actual_end_date !== undefined) {
			fields.push('actual_end_date = ?');
			values.push(req.actual_end_date);
		}
		if (req.isactive !== undefined) {
			fields.push('isactive = ?');
			values.push(req.isactive);
		}

		if (fields.length === 0) return existing;

		fields.push('updated_by = ?');
		fields.push('updated_at = NOW()');
		values.push(updatedBy || null);
		values.push(id);

		await execute(
			`UPDATE planner_tasks SET ${fields.join(', ')} WHERE id = ?`,
			values
		);

		const updated = await this.getById(id);
		if (!updated) throw new Error('Failed to update task');
		return updated;
	}

	async delete(id: number, deletedBy?: string): Promise<void> {
		const existing = await this.getById(id);
		if (!existing) throw new Error('Task not found');

		await execute(
			`UPDATE planner_tasks SET isactive = 0, updated_by = ?, updated_at = NOW() WHERE id = ?`,
			[deletedBy || null, id]
		);
	}

	async getActive(): Promise<PlannerTask[]> {
		return await query<PlannerTask>(
			'SELECT * FROM planner_tasks WHERE isactive = 1 ORDER BY project_id ASC, displayorder ASC'
		);
	}

	async getActiveByProject(projectId: number): Promise<PlannerTask[]> {
		return await query<PlannerTask>(
			'SELECT * FROM planner_tasks WHERE project_id = ? AND isactive = 1 ORDER BY displayorder ASC',
			[projectId]
		);
	}

	// ========== TASK-TAGS METHODS ==========

	async getTaskTags(taskId: number): Promise<any[]> {
		return await query(
			`SELECT ct.* 
			FROM common_tags ct
			INNER JOIN planner_task_tags ptt ON ct.id = ptt.tag_id
			WHERE ptt.task_id = ?
			ORDER BY ct.name ASC`,
			[taskId]
		);
	}

	async addTaskTag(taskId: number, tagId: number): Promise<void> {
		// Check if task exists
		const task = await this.getById(taskId);
		if (!task) throw new Error('Task not found');

		// Check if tag already exists for this task
		const existing = await query(
			'SELECT * FROM planner_task_tags WHERE task_id = ? AND tag_id = ?',
			[taskId, tagId]
		);

		if (existing.length > 0) {
			throw new Error('Tag already added to this task');
		}

		// Add the tag
		await execute(
			'INSERT INTO planner_task_tags (task_id, tag_id) VALUES (?, ?)',
			[taskId, tagId]
		);
	}

	async removeTaskTag(taskId: number, tagId: number): Promise<void> {
		await execute(
			'DELETE FROM planner_task_tags WHERE task_id = ? AND tag_id = ?',
			[taskId, tagId]
		);
	}
}
