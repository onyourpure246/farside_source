import { Hono } from 'hono';
import { DownloadService } from '../services/download.service';
import { ApiResponse, CreateFolderRequest, UpdateFolderRequest, CreateFileRequest, UpdateFileRequest } from '../types';
import { dualAuthMiddleware } from '../middleware/dual-auth.middleware';
import type { AuthContext } from '../middleware/dual-auth.middleware';
import { randomUUID } from 'crypto';

const dlRouter = new Hono<AuthContext>();

// Apply dual authentication middleware (accepts both AUTH_SECRET and JWT tokens)
dlRouter.use('*', dualAuthMiddleware);

// ========== FOLDER ROUTES ==========

// GET: List folder contents (files and subfolders)
dlRouter.get('/folder/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'));
		const service = new DownloadService();

		// Verify folder exists
		const folder = await service.getFolderById(id);
		if (!folder) {
			return c.json<ApiResponse<null>>(
				{ success: false, error: 'Folder not found' },
				404
			);
		}

		const contents = await service.getFolderContents(id);
		return c.json<ApiResponse<any>>(
			{ success: true, data: contents },
			200
		);
	} catch (error) {
		console.error('Error in GET /folder/:id:', error);
		let errorMessage = 'Unknown error occurred';
		if (error instanceof Error) {
			errorMessage = error.message || error.toString();
		} else {
			errorMessage = String(error);
		}
		const errorStack = error instanceof Error ? error.stack : undefined;
		return c.json<ApiResponse<null>>(
			{
				success: false,
				error: errorMessage,
				...(process.env.NODE_ENV !== 'production' && { stack: errorStack })
			},
			500
		);
	}
});

// GET: Root folder contents (parent = null)
dlRouter.get('/folder', async (c) => {
	try {
		const service = new DownloadService();
		const contents = await service.getFolderContents(null);
		return c.json<ApiResponse<any>>(
			{ success: true, data: contents },
			200
		);
	} catch (error) {
		console.error('Error in GET /folder:', error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;
		return c.json<ApiResponse<null>>(
			{
				success: false,
				error: errorMessage,
				...(process.env.NODE_ENV !== 'production' && { stack: errorStack })
			},
			500
		);
	}
});

// POST: Create folder
dlRouter.post('/folder', async (c) => {
	try {
		const data = await c.req.json<CreateFolderRequest>();
		const service = new DownloadService();

		const folder = await service.createFolder(data);
		return c.json<ApiResponse<any>>(
			{ success: true, data: folder },
			201
		);
	} catch (error) {
		console.error('Error in POST /folder:', error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;
		return c.json<ApiResponse<null>>(
			{
				success: false,
				error: errorMessage,
				...(process.env.NODE_ENV !== 'production' && { stack: errorStack })
			},
			400
		);
	}
});

// PATCH: Update folder
dlRouter.patch('/folder/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'));
		const data = await c.req.json<UpdateFolderRequest>();
		const service = new DownloadService();

		const folder = await service.updateFolder(id, data);
		return c.json<ApiResponse<any>>(
			{ success: true, data: folder },
			200
		);
	} catch (error) {
		console.error('Error in PATCH /folder/:id:', error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;
		return c.json<ApiResponse<null>>(
			{
				success: false,
				error: errorMessage,
				...(process.env.NODE_ENV !== 'production' && { stack: errorStack })
			},
			400
		);
	}
});

// DELETE: Delete folder
dlRouter.delete('/folder/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'));
		const service = new DownloadService();

		await service.deleteFolder(id);
		return c.json<ApiResponse<null>>(
			{ success: true, message: 'Folder deleted successfully' },
			200
		);
	} catch (error) {
		console.error('Error in DELETE /folder/:id:', error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;

		if (errorMessage.includes('Cannot delete folder')) {
			return c.json<ApiResponse<null>>(
				{
					success: false,
					error: errorMessage,
					...(process.env.NODE_ENV !== 'production' && { stack: errorStack })
				},
				409
			);
		}
		return c.json<ApiResponse<null>>(
			{
				success: false,
				error: errorMessage,
				...(process.env.NODE_ENV !== 'production' && { stack: errorStack })
			},
			400
		);
	}
});

// ========== FILE ROUTES ==========

// GET: Get file raw content by UUID (sysname) - Used for News Covers etc.
dlRouter.get('/file/uuid/:sysname', async (c) => {
	try {
		const sysname = c.req.param('sysname');
		const service = new DownloadService();

		// Check if file exists in storage
		const exists = await service.fileExistsInStorage(sysname);
		if (!exists) {
			return c.json<ApiResponse<null>>(
				{ success: false, error: 'File not found in storage' },
				404
			);
		}

		// Download file from filesystem
		const fileContent = await service.downloadFile(sysname);

		if (!fileContent) {
			return c.json<ApiResponse<null>>(
				{ success: false, error: 'File content unreadable' },
				500
			);
		}

		// Determine generic content type (or assume image/jpeg for news?)
		// Ideally we should store mime type, but simple serving:
		return new Response(fileContent, {
			headers: {
				'Content-Type': 'application/octet-stream', // Browser will sniff or we can generic
				// 'Cache-Control': 'public, max-age=31536000',
			},
		});
	} catch (error) {
		console.error('Error in GET /file/uuid/:sysname:', error);
		return c.json<ApiResponse<null>>(
			{ success: false, error: 'Internal Server Error' },
			500
		);
	}
});

// GET: Get file details or download
dlRouter.get('/file/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'));
		const download = c.req.query('dl');
		const service = new DownloadService();

		const file = await service.getFileById(id);
		if (!file) {
			return c.json<ApiResponse<null>>(
				{ success: false, error: 'File not found' },
				404
			);
		}

		if (download) {
			// Download file from filesystem
			const fileContent = await service.downloadFile(file.sysname);

			if (!fileContent) {
				return c.json<ApiResponse<null>>(
					{ success: false, error: 'File not found in storage' },
					404
				);
			}

			// Return the file with appropriate headers
			return new Response(fileContent, {
				headers: {
					'Content-Type': 'application/octet-stream',
					'Content-Disposition': `attachment; filename="${file.filename}"`,
					'Content-Length': fileContent.byteLength.toString(),
				},
			});
		}

		return c.json<ApiResponse<any>>(
			{ success: true, data: file },
			200
		);
	} catch (error) {
		console.error('Error in GET /file/:id:', error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;
		return c.json<ApiResponse<null>>(
			{
				success: false,
				error: errorMessage,
				...(process.env.NODE_ENV !== 'production' && { stack: errorStack })
			},
			500
		);
	}
});

// POST: Upload file
dlRouter.post('/file', async (c) => {
	try {
		const formData = await c.req.formData();
		const service = new DownloadService();

		// Extract form fields
		const parent = formData.get('parent');
		const name = formData.get('name') as string;
		const description = formData.get('description') as string | null;
		const file = formData.get('file') as File;

		if (!name) {
			return c.json<ApiResponse<null>>(
				{ success: false, error: 'Name is required' },
				400
			);
		}

		if (!file) {
			return c.json<ApiResponse<null>>(
				{ success: false, error: 'File is required' },
				400
			);
		}

		// Generate unique system name (UUID)
		const sysname = randomUUID();

		// Get file content as ArrayBuffer
		const fileBuffer = await file.arrayBuffer();

		// Upload to filesystem
		await service.uploadFile(
			fileBuffer,
			sysname
		);

		// Create database record
		const fileData: CreateFileRequest = {
			parent: parent ? parseInt(parent as string) : null,
			name: name,
			description: description || undefined,
			filename: file.name,
			sysname: sysname,
		};

		const createdFile = await service.createFile(fileData);

		return c.json<ApiResponse<any>>(
			{ success: true, data: createdFile },
			201
		);
	} catch (error) {
		console.error('Error in POST /file:', error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;
		return c.json<ApiResponse<null>>(
			{
				success: false,
				error: errorMessage,
				...(process.env.NODE_ENV !== 'production' && { stack: errorStack })
			},
			400
		);
	}
});

// PATCH: Update file metadata (not the file itself)
dlRouter.patch('/file/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'));
		const data = await c.req.json<UpdateFileRequest>();
		const service = new DownloadService();

		const file = await service.updateFile(id, data);
		return c.json<ApiResponse<any>>(
			{ success: true, data: file },
			200
		);
	} catch (error) {
		console.error('Error in PATCH /file/:id:', error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;
		return c.json<ApiResponse<null>>(
			{
				success: false,
				error: errorMessage,
				...(process.env.NODE_ENV !== 'production' && { stack: errorStack })
			},
			400
		);
	}
});

// DELETE: Delete file
dlRouter.delete('/file/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'));
		const service = new DownloadService();

		await service.deleteFile(id);
		return c.json<ApiResponse<null>>(
			{ success: true, message: 'File deleted successfully' },
			200
		);
	} catch (error) {
		console.error('Error in DELETE /file/:id:', error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;
		return c.json<ApiResponse<null>>(
			{
				success: false,
				error: errorMessage,
				...(process.env.NODE_ENV !== 'production' && { stack: errorStack })
			},
			400
		);
	}
});

export default dlRouter;
