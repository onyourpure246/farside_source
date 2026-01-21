import { DLFolder, DLFile, CreateFolderRequest, UpdateFolderRequest, CreateFileRequest, UpdateFileRequest, FolderContentResponse } from '../types';
import { query, queryOne, execute } from './database.service';
import * as fileStorage from './file-storage.service';

export class DownloadService {
	// ========== FOLDERS ==========

	async getFolderById(id: number): Promise<DLFolder | null> {
		const folder = await queryOne<DLFolder>(
			'SELECT * FROM dl_folders WHERE id = ? AND isactive = 1',
			[id]
		);

		// Apply default values if mui_icon or mui_colour are null
		if (folder) {
			if (!folder.mui_icon) folder.mui_icon = 'Folder';
			if (!folder.mui_colour) folder.mui_colour = 'black';
		}

		return folder;
	}

	async getFolderContents(folderId: number | null): Promise<FolderContentResponse> {
		let folders: DLFolder[];
		let files: DLFile[];

		if (folderId === null) {
			folders = await query<DLFolder>(
				'SELECT * FROM dl_folders WHERE parent IS NULL AND isactive = 1 ORDER BY abbr ASC'
			);
			files = await query<DLFile>(
				'SELECT * FROM dl_files WHERE parent IS NULL AND isactive = 1 ORDER BY name ASC'
			);
		} else {
			folders = await query<DLFolder>(
				'SELECT * FROM dl_folders WHERE parent = ? AND isactive = 1 ORDER BY abbr ASC',
				[folderId]
			);
			files = await query<DLFile>(
				'SELECT * FROM dl_files WHERE parent = ? AND isactive = 1 ORDER BY name ASC',
				[folderId]
			);
		}

		// Apply default values for folders
		folders = folders.map(folder => ({
			...folder,
			mui_icon: folder.mui_icon || 'Folder',
			mui_colour: folder.mui_colour || 'black'
		}));

		// Apply default values for files
		files = files.map(file => ({
			...file,
			mui_icon: file.mui_icon || 'InsertDriveFile',
			mui_colour: file.mui_colour || 'black'
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
			const muiColour = data.mui_colour || 'black';

			const result = await execute(
				`INSERT INTO dl_folders (abbr, name, description, parent, mui_icon, mui_colour, isactive, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
				[data.abbr, data.name || null, data.description || null, data.parent || null, muiIcon, muiColour]
			);

			console.log('Folder inserted with ID:', result.insertId);

			const folder = await this.getFolderById(result.insertId);
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
		// Check if folder has children or files (active ones)
		const hasChildren = await queryOne(
			'SELECT 1 FROM dl_folders WHERE parent = ? AND isactive = 1 LIMIT 1',
			[id]
		);

		const hasFiles = await queryOne(
			'SELECT 1 FROM dl_files WHERE parent = ? AND isactive = 1 LIMIT 1',
			[id]
		);

		if (hasChildren || hasFiles) {
			throw new Error('Cannot delete folder with active children or files');
		}

		// Soft delete
		const result = await execute(
			'UPDATE dl_folders SET isactive = 0, updated_at = NOW() WHERE id = ?',
			[id]
		);

		return result.affectedRows > 0;
	}

	// ========== FILES ==========

	async getFileById(id: number): Promise<DLFile | null> {
		const file = await queryOne<DLFile>(
			'SELECT * FROM dl_files WHERE id = ? AND isactive = 1',
			[id]
		);

		// Apply default values if mui_icon or mui_colour are null
		if (file) {
			if (!file.mui_icon) file.mui_icon = 'InsertDriveFile';
			if (!file.mui_colour) file.mui_colour = 'black';
		}

		return file;
	}

	async createFile(data: CreateFileRequest): Promise<DLFile> {
		// Set default values if not provided
		const muiIcon = data.mui_icon || 'InsertDriveFile';
		const muiColour = data.mui_colour || 'black';

		const result = await execute(
			`INSERT INTO dl_files (parent, name, description, filename, sysname, mui_icon, mui_colour, isactive, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
			[data.parent || null, data.name, data.description || null, data.filename, data.sysname, muiIcon, muiColour]
		);

		const file = await this.getFileById(result.insertId);
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
		const file = await this.getFileById(id);
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
