import { CommonTag, CreateTagRequest, UpdateTagRequest } from '../types';
import { query, queryOne, execute } from './database.service';

export class TagService {
	async getAll(): Promise<CommonTag[]> {
		return await query<CommonTag>(
			'SELECT * FROM common_tags ORDER BY name ASC'
		);
	}

	async getActive(): Promise<CommonTag[]> {
		return await query<CommonTag>(
			'SELECT * FROM common_tags WHERE isactive = 1 ORDER BY name ASC'
		);
	}

	async getById(id: number): Promise<CommonTag | null> {
		return await queryOne<CommonTag>(
			'SELECT * FROM common_tags WHERE id = ?',
			[id]
		);
	}

	async create(req: CreateTagRequest, createdBy?: number): Promise<CommonTag> {
		const result = await execute(
			`INSERT INTO common_tags 
			(name, colour, icon, created_by, updated_by, created_at, updated_at) 
			VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
			[
				req.name,
				req.colour,
				req.icon || null,
				createdBy || null,
				createdBy || null,
			]
		);

		const created = await this.getById(result.insertId);
		if (!created) throw new Error('Failed to create tag');
		return created;
	}

	async update(id: number, req: UpdateTagRequest, updatedBy?: number): Promise<CommonTag> {
		const existing = await this.getById(id);
		if (!existing) throw new Error('Tag not found');

		const fields: string[] = [];
		const values: any[] = [];

		if (req.name !== undefined) {
			fields.push('name = ?');
			values.push(req.name);
		}
		if (req.colour !== undefined) {
			fields.push('colour = ?');
			values.push(req.colour);
		}
		if (req.icon !== undefined) {
			fields.push('icon = ?');
			values.push(req.icon);
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
			`UPDATE common_tags SET ${fields.join(', ')} WHERE id = ?`,
			values
		);

		const updated = await this.getById(id);
		if (!updated) throw new Error('Failed to update tag');
		return updated;
	}

	async delete(id: number, deletedBy?: number): Promise<void> {
		const existing = await this.getById(id);
		if (!existing) throw new Error('Tag not found');

		await execute(
			`UPDATE common_tags SET isactive = 0, updated_by = ?, updated_at = NOW() WHERE id = ?`,
			[deletedBy || null, id]
		);
	}
}
