import { DLCategory, CreateCategoryRequest, UpdateCategoryRequest } from '../types';
import { query, queryOne, execute } from './database.service';

export class CategoryService {
    async getAllCategories(includeInactive: boolean = false): Promise<DLCategory[]> {
        let sql = 'SELECT * FROM dl_categories';
        if (!includeInactive) {
            sql += ' WHERE isactive = 1';
        }
        // Order by name or id
        sql += ' ORDER BY id ASC';
        return await query<DLCategory>(sql);
    }

    async getCategoryById(id: number): Promise<DLCategory | null> {
        const category = await queryOne<DLCategory>(
            'SELECT * FROM dl_categories WHERE id = ?',
            [id]
        );
        return category;
    }

    async createCategory(data: CreateCategoryRequest): Promise<DLCategory> {
        const isactive = data.isactive !== undefined ? data.isactive : 1;
        const groupName = data.group_name || 'เอกสารต่างๆ';

        const result = await execute(
            `INSERT INTO dl_categories (name, group_name, isactive, created_at, updated_at) 
			 VALUES (?, ?, ?, NOW(), NOW())`,
            [data.name, groupName, isactive]
        );

        const created = await this.getCategoryById(result.insertId);
        if (!created) throw new Error('Failed to retrieve created category');
        return created;
    }

    async updateCategory(id: number, data: UpdateCategoryRequest): Promise<DLCategory> {
        const updates: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) {
            updates.push('name = ?');
            values.push(data.name);
        }
        if (data.group_name !== undefined) {
            updates.push('group_name = ?');
            values.push(data.group_name);
        }
        if (data.isactive !== undefined) {
            updates.push('isactive = ?');
            values.push(data.isactive);
        }

        if (updates.length === 0) {
            const cat = await this.getCategoryById(id);
            if (!cat) throw new Error('Category not found');
            return cat;
        }

        updates.push('updated_at = NOW()');
        values.push(id);

        await execute(
            `UPDATE dl_categories SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const cat = await this.getCategoryById(id);
        if (!cat) throw new Error('Category not found');
        return cat;
    }

    async deleteCategory(id: number): Promise<boolean> {
        // Soft delete
        const result = await execute(
            'UPDATE dl_categories SET isactive = 0, updated_at = NOW() WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
}
