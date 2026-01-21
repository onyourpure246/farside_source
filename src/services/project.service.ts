import { PlannerProject, CreateProjectRequest, UpdateProjectRequest } from '../types';
import { query, queryOne, execute } from './database.service';

export class ProjectService {
	async getAll(): Promise<PlannerProject[]> {
		return await query<PlannerProject>(
			'SELECT * FROM planner_projects ORDER BY displayorder ASC, shortname ASC'
		);
	}

	async getById(id: number): Promise<PlannerProject | null> {
		return await queryOne<PlannerProject>(
			'SELECT * FROM planner_projects WHERE id = ?',
			[id]
		);
	}

	async getByShortname(shortname: string): Promise<PlannerProject | null> {
		return await queryOne<PlannerProject>(
			'SELECT * FROM planner_projects WHERE shortname = ?',
			[shortname]
		);
	}

	async create(req: CreateProjectRequest, createdBy?: string): Promise<PlannerProject> {
		const result = await execute(
			`INSERT INTO planner_projects 
			(shortname, name, description, displayorder, manager_participant_id, created_by, updated_by, created_at, updated_at) 
			VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
			[
				req.shortname,
				req.name || null,
				req.description || null,
				req.displayorder || 0,
				req.manager_participant_id || null,
				createdBy || null,
				createdBy || null,
			]
		);

		const created = await this.getById(result.insertId);
		if (!created) throw new Error('Failed to create project');
		return created;
	}

	async update(id: number, req: UpdateProjectRequest, updatedBy?: string): Promise<PlannerProject> {
		const existing = await this.getById(id);
		if (!existing) throw new Error('Project not found');

		const fields: string[] = [];
		const values: any[] = [];

		if (req.shortname !== undefined) {
			fields.push('shortname = ?');
			values.push(req.shortname);
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
		if (req.manager_participant_id !== undefined) {
			fields.push('manager_participant_id = ?');
			values.push(req.manager_participant_id);
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
			`UPDATE planner_projects SET ${fields.join(', ')} WHERE id = ?`,
			values
		);

		const updated = await this.getById(id);
		if (!updated) throw new Error('Failed to update project');
		return updated;
	}

	async delete(id: number, deletedBy?: string): Promise<void> {
		const existing = await this.getById(id);
		if (!existing) throw new Error('Project not found');

		await execute(
			`UPDATE planner_projects SET isactive = 0, updated_by = ?, updated_at = NOW() WHERE id = ?`,
			[deletedBy || null, id]
		);
	}

	async getActive(): Promise<PlannerProject[]> {
		return await query<PlannerProject>(
			'SELECT * FROM planner_projects WHERE isactive = 1 ORDER BY displayorder ASC, shortname ASC'
		);
	}
}
