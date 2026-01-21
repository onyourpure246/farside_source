import { PlannerTaskParticipant, CreateTaskParticipantRequest, UpdateTaskParticipantRequest } from '../types';
import { query, queryOne, execute } from './database.service';

export class TaskParticipantService {
	async getAll(): Promise<PlannerTaskParticipant[]> {
		return await query<PlannerTaskParticipant>(
			'SELECT * FROM planner_task_participants ORDER BY task_id ASC, participant_id ASC'
		);
	}

	async getById(id: number): Promise<PlannerTaskParticipant | null> {
		return await queryOne<PlannerTaskParticipant>(
			'SELECT * FROM planner_task_participants WHERE id = ?',
			[id]
		);
	}

	async getByTask(taskId: number): Promise<PlannerTaskParticipant[]> {
		return await query<PlannerTaskParticipant>(
			'SELECT * FROM planner_task_participants WHERE task_id = ? ORDER BY participant_id ASC',
			[taskId]
		);
	}

	async getByParticipant(participantId: number): Promise<PlannerTaskParticipant[]> {
		return await query<PlannerTaskParticipant>(
			'SELECT * FROM planner_task_participants WHERE participant_id = ? ORDER BY task_id ASC',
			[participantId]
		);
	}

	async getByTaskAndParticipant(taskId: number, participantId: number): Promise<PlannerTaskParticipant | null> {
		return await queryOne<PlannerTaskParticipant>(
			'SELECT * FROM planner_task_participants WHERE task_id = ? AND participant_id = ?',
			[taskId, participantId]
		);
	}

	async create(req: CreateTaskParticipantRequest, createdBy?: string): Promise<PlannerTaskParticipant> {
		// Check for duplicate
		const existing = await this.getByTaskAndParticipant(req.task_id, req.participant_id);
		if (existing && existing.isactive === 1) {
			throw new Error('This participant is already assigned to this task');
		}

		// If soft-deleted entry exists, reactivate it
		if (existing && existing.isactive === 0) {
			await execute(
				`UPDATE planner_task_participants SET isactive = 1, updated_by = ?, updated_at = NOW() WHERE id = ?`,
				[createdBy || null, existing.id]
			);
			const updated = await this.getById(existing.id);
			if (!updated) throw new Error('Failed to reactivate task participant');
			return updated;
		}

		const result = await execute(
			`INSERT INTO planner_task_participants (task_id, participant_id, created_by, updated_by, created_at, updated_at) 
			 VALUES (?, ?, ?, ?, NOW(), NOW())`,
			[req.task_id, req.participant_id, createdBy || null, createdBy || null]
		);

		const created = await this.getById(result.insertId);
		if (!created) throw new Error('Failed to create task participant');
		return created;
	}

	async update(id: number, req: UpdateTaskParticipantRequest, updatedBy?: string): Promise<PlannerTaskParticipant> {
		const existing = await this.getById(id);
		if (!existing) throw new Error('Task participant not found');

		const fields: string[] = [];
		const values: any[] = [];

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
			`UPDATE planner_task_participants SET ${fields.join(', ')} WHERE id = ?`,
			values
		);

		const updated = await this.getById(id);
		if (!updated) throw new Error('Failed to update task participant');
		return updated;
	}

	async delete(id: number, deletedBy?: string): Promise<void> {
		const existing = await this.getById(id);
		if (!existing) throw new Error('Task participant not found');

		await execute(
			`UPDATE planner_task_participants SET isactive = 0, updated_by = ?, updated_at = NOW() WHERE id = ?`,
			[deletedBy || null, id]
		);
	}

	async getActiveByTask(taskId: number): Promise<PlannerTaskParticipant[]> {
		return await query<PlannerTaskParticipant>(
			'SELECT * FROM planner_task_participants WHERE task_id = ? AND isactive = 1 ORDER BY participant_id ASC',
			[taskId]
		);
	}

	async getActiveByParticipant(participantId: number): Promise<PlannerTaskParticipant[]> {
		return await query<PlannerTaskParticipant>(
			'SELECT * FROM planner_task_participants WHERE participant_id = ? AND isactive = 1 ORDER BY task_id ASC',
			[participantId]
		);
	}
}
