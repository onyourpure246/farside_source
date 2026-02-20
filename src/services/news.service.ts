import { NewsItem, CreateNewsRequest, UpdateNewsRequest } from '../types';
import { query, queryOne, execute } from './database.service';
import * as fileStorage from './file-storage.service';

export class NewsService {

    async getAllNews(limit: number = 20, offset: number = 0, status: string = 'published'): Promise<NewsItem[]> {
        // If status is 'all', disregard status filter (for admin)
        let sql = 'SELECT * FROM common_news WHERE isactive = 1';
        const params: any[] = [];

        if (status !== 'all') {
            sql += ' AND status = ?';
            params.push(status);
        }

        sql += ' ORDER BY publish_date DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return await query<NewsItem>(sql, params);
    }

    async getNewsById(id: number): Promise<NewsItem | null> {
        return await queryOne<NewsItem>(
            'SELECT * FROM common_news WHERE id = ? AND isactive = 1',
            [id]
        );
    }

    async createNews(data: CreateNewsRequest, createdBy: string = 'Admin'): Promise<NewsItem> {
        const result = await execute(
            `INSERT INTO common_news (title, content, category, cover_image, status, publish_date, isactive, created_by, created_at, updated_by, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, 1, ?, NOW(), ?, NOW())`,
            [
                data.title,
                data.content || null,
                data.category || null,
                data.cover_image || null,
                data.status || 'published',
                data.publish_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
                createdBy,
                createdBy
            ]
        );

        const news = await this.getNewsById(result.insertId);
        if (!news) throw new Error('Failed to create news item');
        return news;
    }

    async updateNews(id: number, data: UpdateNewsRequest, updatedBy: string = 'admin'): Promise<NewsItem> {
        const updates: string[] = [];
        const values: any[] = [];

        if (data.title !== undefined) {
            updates.push('title = ?');
            values.push(data.title);
        }
        if (data.content !== undefined) {
            updates.push('content = ?');
            values.push(data.content);
        }
        if (data.category !== undefined) {
            updates.push('category = ?');
            values.push(data.category);
        }
        if (data.cover_image !== undefined) {
            updates.push('cover_image = ?');
            values.push(data.cover_image);
        }
        if (data.status !== undefined) {
            updates.push('status = ?');
            values.push(data.status);
        }
        if (data.publish_date !== undefined) {
            updates.push('publish_date = ?');
            values.push(data.publish_date);
        }
        if (data.isactive !== undefined) {
            updates.push('isactive = ?');
            values.push(data.isactive);
        }

        if (updates.length === 0) {
            const news = await this.getNewsById(id);
            if (!news) throw new Error('News item not found');
            return news;
        }

        updates.push('updated_at = NOW()');
        updates.push('updated_by = ?');
        values.push(updatedBy);
        values.push(id);

        await execute(
            `UPDATE common_news SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const news = await this.getNewsById(id);
        if (!news) throw new Error('News item not found');
        return news;
    }

    async deleteNews(id: number): Promise<boolean> {
        // Soft delete
        const result = await execute(
            'UPDATE common_news SET isactive = 0 WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    async incrementViewCount(id: number): Promise<void> {
        await execute(
            'UPDATE common_news SET view_count = view_count + 1 WHERE id = ?',
            [id]
        );
    }

    /**
     * Upload cover image to filesystem
     * Uses the same storage mechanism as download service
     */
    async uploadCoverImage(file: Buffer | ArrayBuffer, sysname: string): Promise<string> {
        return await fileStorage.saveFile(sysname, file);
    }

    async deleteCoverImage(filename: string): Promise<boolean> {
        return await fileStorage.deleteFile(filename);
    }
}
