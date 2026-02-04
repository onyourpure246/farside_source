import { DLFolder, DLFile, CreateFolderRequest, UpdateFolderRequest, CreateFileRequest, UpdateFileRequest, FolderContentResponse } from '../types';
import { query, queryOne, execute } from './database.service';
import * as fileStorage from './file-storage.service';

export class DownloadService {
	// ========== FOLDERS ==========

	async getFolderById(id: number, viewMode: 'public' | 'admin' | 'all' = 'public'): Promise<DLFolder | null> {
		let sql = 'SELECT * FROM dl_folders WHERE id = ?';
		if (viewMode === 'public') {
			sql += ' AND isactive = 1';
		} else if (viewMode === 'admin') {
			sql += ' AND isactive IN (1, 2)';
		}
		// 'all' implies no filtering on isactive (active, draft, deleted/0)

		const folder = await queryOne<DLFolder>(
			sql,
			[id]
		);

		// Apply default values if mui_icon or mui_colour are null
		if (folder) {
			if (!folder.mui_icon) folder.mui_icon = 'Folder';
			if (!folder.mui_colour) folder.mui_colour = '#FFCE3C';
		}

		return folder;
	}

	async getFolderContents(folderId: number | null, viewMode: 'public' | 'admin' = 'public'): Promise<FolderContentResponse> {
		let folders: DLFolder[];
		let files: DLFile[];

		let activeClause = '';
		if (viewMode === 'public') {
			activeClause = ' AND isactive = 1';
		} else if (viewMode === 'admin') {
			activeClause = ' AND isactive IN (1, 2)';
		}

		if (folderId === null) {
			folders = await query<DLFolder>(
				`SELECT * FROM dl_folders WHERE parent IS NULL${activeClause} ORDER BY abbr ASC`
			);
			files = await query<DLFile>(
				`SELECT * FROM dl_files WHERE parent IS NULL${activeClause} ORDER BY name ASC`
			);
		} else {
			folders = await query<DLFolder>(
				`SELECT * FROM dl_folders WHERE parent = ?${activeClause} ORDER BY abbr ASC`,
				[folderId]
			);
			files = await query<DLFile>(
				`SELECT * FROM dl_files WHERE parent = ?${activeClause} ORDER BY name ASC`,
				[folderId]
			);
		}

		// Apply default values for folders
		folders = folders.map(folder => ({
			...folder,
			mui_icon: folder.mui_icon || 'Folder',
			mui_colour: folder.mui_colour || '#FFCE3C'
		}));

		// Apply default values for files
		files = files.map(file => ({
			...file,
			mui_icon: file.mui_icon || 'InsertDriveFile',
			mui_colour: file.mui_colour || '#FFCE3C'
		}));

		return {
			folders: folders || [],
			files: files || [],
		};
	}

	async createFolder(data: CreateFolderRequest): Promise<DLFolder> {
		try {
			console.log('Creating folder with data:', data);

			// Set default values if not provided
			const muiIcon = data.mui_icon || 'Folder';
			const muiColour = data.mui_colour || '#FFCE3C';

			// Ensure abbr is defined (fall back to name or default)
			const abbr = data.abbr || data.name || 'New Folder';

			const isactive = data.isactive !== undefined ? data.isactive : 1;

			const result = await execute(
				`INSERT INTO dl_folders (abbr, name, description, parent, mui_icon, mui_colour, isactive, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
				[abbr, data.name || null, data.description || null, data.parent || null, muiIcon, muiColour, isactive]
			);

			console.log('Folder inserted with ID:', result.insertId);

			// Fetch the created folder, ignoring active check to ensure we return it even if isactive=0
			const folder = await this.getFolderById(result.insertId, 'all');
			if (!folder) {
				throw new Error(`Failed to retrieve created folder with ID ${result.insertId}`);
			}
			return folder;
		} catch (error) {
			console.error('Error in createFolder:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to create folder: ${error.message}`);
			}
			throw error;
		}
	}

	async updateFolder(id: number, data: UpdateFolderRequest): Promise<DLFolder> {
		const updates: string[] = [];
		const values: any[] = [];

		if (data.abbr !== undefined) {
			updates.push('abbr = ?');
			values.push(data.abbr);
		}
		if (data.name !== undefined) {
			updates.push('name = ?');
			values.push(data.name);
		}
		if (data.description !== undefined) {
			updates.push('description = ?');
			values.push(data.description);
		}
		if (data.parent !== undefined) {
			updates.push('parent = ?');
			values.push(data.parent);
		}
		if (data.mui_icon !== undefined) {
			updates.push('mui_icon = ?');
			values.push(data.mui_icon);
		}
		if (data.mui_colour !== undefined) {
			updates.push('mui_colour = ?');
			values.push(data.mui_colour);
		}
		if (data.isactive !== undefined) {
			updates.push('isactive = ?');
			values.push(data.isactive);
		}

		if (updates.length === 0) {
			const folder = await this.getFolderById(id);
			if (!folder) throw new Error('Folder not found');
			return folder;
		}

		updates.push('updated_at = NOW()');
		values.push(id);

		await execute(
			`UPDATE dl_folders SET ${updates.join(', ')} WHERE id = ?`,
			values
		);

		const folder = await this.getFolderById(id);
		if (!folder) throw new Error('Folder not found');
		return folder;
	}

	async deleteFolder(id: number): Promise<boolean> {
		// Recursive Soft Delete
		// 1. Find all descendant folder IDs (including self)
		const foldersToDelete = [id];
		let currentLevelIds = [id];

		while (currentLevelIds.length > 0) {
			const placeholders = currentLevelIds.map(() => '?').join(',');
			const children = await query<DLFolder>(
				`SELECT id FROM dl_folders WHERE parent IN (${placeholders})`,
				currentLevelIds
			);

			if (children.length > 0) {
				const childIds = children.map(c => c.id);
				foldersToDelete.push(...childIds);
				currentLevelIds = childIds;
			} else {
				currentLevelIds = [];
			}
		}

		console.log(`Soft deleting folders: ${foldersToDelete.join(', ')}`);

		// 2. Soft delete all identified folders
		// We use multiple placeholders for the IN clause
		const folderPlaceholders = foldersToDelete.map(() => '?').join(',');

		await execute(
			`UPDATE dl_folders SET isactive = 0, updated_at = NOW() WHERE id IN (${folderPlaceholders})`,
			foldersToDelete
		);

		// 3. Soft delete all files within these folders
		await execute(
			`UPDATE dl_files SET isactive = 0, updated_at = NOW() WHERE parent IN (${folderPlaceholders})`,
			foldersToDelete
		);

		return true;
	}

	// ========== FILES ==========

	async getFileById(id: number, viewMode: 'public' | 'admin' | 'all' = 'public'): Promise<DLFile | null> {
		let sql = 'SELECT * FROM dl_files WHERE id = ?';
		if (viewMode === 'public') {
			sql += ' AND isactive = 1';
		} else if (viewMode === 'admin') {
			sql += ' AND isactive IN (1, 2)';
		}

		const file = await queryOne<DLFile>(
			sql,
			[id]
		);

		// Apply default values if mui_icon or mui_colour are null
		if (file) {
			if (!file.mui_icon) file.mui_icon = 'InsertDriveFile';
			if (!file.mui_colour) file.mui_colour = '#FFCE3C';
		}

		return file;
	}

	async createFile(data: CreateFileRequest): Promise<DLFile> {
		// Set default values if not provided
		const muiIcon = data.mui_icon || 'InsertDriveFile';
		const muiColour = data.mui_colour || '#FFCE3C';

		const isactive = data.isactive !== undefined ? data.isactive : 1;

		const result = await execute(
			`INSERT INTO dl_files (parent, name, description, filename, sysname, mui_icon, mui_colour, isactive, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
			[data.parent || null, data.name, data.description || null, data.filename, data.sysname, muiIcon, muiColour, isactive]
		);

		// Fetch the created file, ignoring active check
		const file = await this.getFileById(result.insertId, 'all');
		if (!file) throw new Error('Failed to create file');
		return file;
	}

	async updateFile(id: number, data: UpdateFileRequest): Promise<DLFile> {
		const updates: string[] = [];
		const values: any[] = [];

		if (data.parent !== undefined) {
			updates.push('parent = ?');
			values.push(data.parent);
		}
		if (data.name !== undefined) {
			updates.push('name = ?');
			values.push(data.name);
		}
		if (data.description !== undefined) {
			updates.push('description = ?');
			values.push(data.description);
		}
		if (data.filename !== undefined) {
			updates.push('filename = ?');
			values.push(data.filename);
		}
		if (data.mui_icon !== undefined) {
			updates.push('mui_icon = ?');
			values.push(data.mui_icon);
		}
		if (data.mui_colour !== undefined) {
			updates.push('mui_colour = ?');
			values.push(data.mui_colour);
		}
		if (data.isactive !== undefined) {
			updates.push('isactive = ?');
			values.push(data.isactive);
		}

		if (updates.length === 0) {
			const file = await this.getFileById(id);
			if (!file) throw new Error('File not found');
			return file;
		}

		updates.push('updated_at = NOW()');
		values.push(id);

		await execute(
			`UPDATE dl_files SET ${updates.join(', ')} WHERE id = ?`,
			values
		);

		const file = await this.getFileById(id);
		if (!file) throw new Error('File not found');
		return file;
	}

	async deleteFile(id: number): Promise<boolean> {
		// Get file info first to verify existence
		const file = await this.getFileById(id, 'admin');
		if (!file) {
			throw new Error('File not found');
		}

		// Soft delete - do NOT delete from filesystem
		const result = await execute(
			'UPDATE dl_files SET isactive = 0, updated_at = NOW() WHERE id = ?',
			[id]
		);

		return result.affectedRows > 0;
	}

	// ========== FILE STORAGE OPERATIONS ==========

	/**
	 * Upload file to filesystem
	 * @param file The file to upload (as Buffer or ArrayBuffer)
	 * @param sysname The unique system name for the file (UUID)
	 * @returns The full path where the file was saved
	 */
	async uploadFile(
		file: Buffer | ArrayBuffer,
		sysname: string
	): Promise<string> {
		return await fileStorage.saveFile(sysname, file);
	}

	/**
	 * Download file from filesystem
	 * @param sysname The unique system name for the file (UUID)
	 * @returns The file data as Buffer, or null if file doesn't exist
	 */
	async downloadFile(sysname: string): Promise<Buffer | null> {
		return await fileStorage.readFile(sysname);
	}

	/**
	 * Delete file from filesystem
	 * @param sysname The unique system name for the file (UUID)
	 * @returns true if file was deleted, false if file didn't exist
	 */
	async deleteFileFromStorage(sysname: string): Promise<boolean> {
		return await fileStorage.deleteFile(sysname);
	}

	/**
	 * Check if file exists in filesystem
	 * @param sysname The unique system name for the file (UUID)
	 * @returns true if file exists, false otherwise
	 */
	async fileExistsInStorage(sysname: string): Promise<boolean> {
		return await fileStorage.fileExists(sysname);
	}

	/**
	 * Get file stats (size, modification time, etc.)
	 * @param sysname The unique system name for the file (UUID)
	 * @returns File stats or null if file doesn't exist
	 */
	async getFileStats(sysname: string): Promise<{ size: number; mtime: Date } | null> {
		return await fileStorage.getFileStats(sysname);
	}
}
