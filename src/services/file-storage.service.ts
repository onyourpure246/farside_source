import fs from 'fs/promises';
import path from 'path';

let uploadDirectory: string = '';

export interface FileStorageConfig {
	uploadPath: string;
}

export function initializeFileStorage(config: FileStorageConfig): void {
	uploadDirectory = config.uploadPath;
}

export function getUploadDirectory(): string {
	if (!uploadDirectory) {
		throw new Error('File storage not initialized. Call initializeFileStorage first.');
	}
	return uploadDirectory;
}

/**
 * Ensure the upload directory exists
 */
export async function ensureUploadDirectory(): Promise<void> {
	const dir = getUploadDirectory();
	try {
		await fs.access(dir);
	} catch {
		await fs.mkdir(dir, { recursive: true });
	}
}

/**
 * Save file to disk
 * @param filename The name to save the file as (should be UUID or unique name)
 * @param data The file data as Buffer or ArrayBuffer
 * @returns The full path where the file was saved
 */
export async function saveFile(filename: string, data: Buffer | ArrayBuffer): Promise<string> {
	await ensureUploadDirectory();
	const filePath = path.join(getUploadDirectory(), filename);
	
	const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
	await fs.writeFile(filePath, buffer);
	
	return filePath;
}

/**
 * Read file from disk
 * @param filename The name of the file to read
 * @returns The file data as Buffer, or null if file doesn't exist
 */
export async function readFile(filename: string): Promise<Buffer | null> {
	const filePath = path.join(getUploadDirectory(), filename);
	try {
		return await fs.readFile(filePath);
	} catch (error: any) {
		if (error.code === 'ENOENT') {
			return null;
		}
		throw error;
	}
}

/**
 * Delete file from disk
 * @param filename The name of the file to delete
 * @returns true if file was deleted, false if file didn't exist
 */
export async function deleteFile(filename: string): Promise<boolean> {
	const filePath = path.join(getUploadDirectory(), filename);
	try {
		await fs.unlink(filePath);
		return true;
	} catch (error: any) {
		if (error.code === 'ENOENT') {
			return false;
		}
		throw error;
	}
}

/**
 * Check if file exists
 * @param filename The name of the file to check
 * @returns true if file exists, false otherwise
 */
export async function fileExists(filename: string): Promise<boolean> {
	const filePath = path.join(getUploadDirectory(), filename);
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Get file stats (size, modification time, etc.)
 * @param filename The name of the file
 * @returns File stats or null if file doesn't exist
 */
export async function getFileStats(filename: string): Promise<{ size: number; mtime: Date } | null> {
	const filePath = path.join(getUploadDirectory(), filename);
	try {
		const stats = await fs.stat(filePath);
		return {
			size: stats.size,
			mtime: stats.mtime,
		};
	} catch (error: any) {
		if (error.code === 'ENOENT') {
			return null;
		}
		throw error;
	}
}
