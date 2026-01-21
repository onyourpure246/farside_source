import { CommonParticipant, CreateParticipantRequest, UpdateParticipantRequest } from '../types';
import { query, queryOne, execute } from './database.service';

export class ParticipantService {
	async getAll(): Promise<CommonParticipant[]> {
		return await query<CommonParticipant>(
			'SELECT * FROM common_participants ORDER BY codename ASC'
		);
	}

	async getById(id: number): Promise<CommonParticipant | null> {
		return await queryOne<CommonParticipant>(
			'SELECT * FROM common_participants WHERE id = ?',
			[id]
		);
	}

	async getByCodename(codename: string): Promise<CommonParticipant | null> {
		return await queryOne<CommonParticipant>(
			'SELECT * FROM common_participants WHERE codename = ?',
			[codename]
		);
	}

	async create(req: CreateParticipantRequest, createdBy?: string): Promise<CommonParticipant> {
		const result = await execute(
			`INSERT INTO common_participants 
			(codename, name, user_id, created_by, updated_by, created_at, updated_at) 
			VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
			[req.codename, req.name || null, req.user_id || null, createdBy || null, createdBy || null]
		);

		const created = await this.getById(result.insertId);
		if (!created) throw new Error('Failed to create participant');
		return created;
	}

	async update(id: number, req: UpdateParticipantRequest, updatedBy?: string): Promise<CommonParticipant> {
		const existing = await this.getById(id);
		if (!existing) throw new Error('Participant not found');

		const fields: string[] = [];
		const values: any[] = [];

		if (req.codename !== undefined) {
			fields.push('codename = ?');
			values.push(req.codename);
		}
		if (req.name !== undefined) {
			fields.push('name = ?');
			values.push(req.name);
		}
		if (req.user_id !== undefined) {
			fields.push('user_id = ?');
			values.push(req.user_id);
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
			`UPDATE common_participants SET ${fields.join(', ')} WHERE id = ?`,
			values
		);

		const updated = await this.getById(id);
		if (!updated) throw new Error('Failed to update participant');
		return updated;
	}

	async delete(id: number, deletedBy?: string): Promise<void> {
		const existing = await this.getById(id);
		if (!existing) throw new Error('Participant not found');

		await execute(
			`UPDATE common_participants SET isactive = 0, updated_by = ?, updated_at = NOW() WHERE id = ?`,
			[deletedBy || null, id]
		);
	}

	async getActive(): Promise<CommonParticipant[]> {
		return await query<CommonParticipant>(
			'SELECT * FROM common_participants WHERE isactive = 1 ORDER BY codename ASC'
		);
	}
}
