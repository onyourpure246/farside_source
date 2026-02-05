import { Hono } from 'hono';
import { DownloadService } from '../services/download.service';
import { ApiResponse, CreateFolderRequest, UpdateFolderRequest, CreateFileRequest, UpdateFileRequest } from '../types';
import { dualAuthMiddleware } from '../middleware/dual-auth.middleware';
import type { AuthContext } from '../middleware/dual-auth.middleware';
import { randomUUID } from 'crypto';
import { LogService } from '../services/log.service';


const dlRouter = new Hono<AuthContext>();

// Apply dual authentication middleware (accepts both AUTH_SECRET and JWT tokens)
dlRouter.use('*', dualAuthMiddleware);

// ========== FOLDER ROUTES ==========

// GET: List folder contents (files and subfolders)
dlRouter.get('/folder/:id', async (c) => {
	try {
		const id = parseInt(c.req.param('id'));
		const service = new DownloadService();


		// Check for admin privileges (if user exists, verified by middleware)
		const user = c.get('user');
		const authType = c.get('authType');
		const isAdmin = (user?.isadmin === 1) || (authType === 'bearer');

		// Verify folder exists (admins can see inactive)
		const folder = await service.getFolderById(id, isAdmin ? 'admin' : 'public');
		if (!folder) {
			return c.json<ApiResponse<null>>(
				{ success: false, error: 'Folder not found' },
				404
			);
		}

		// Admins can see inactive content
		const contents = await service.getFolderContents(id, isAdmin ? 'admin' : 'public');
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

		// Check for admin privileges
		const user = c.get('user');
		const authType = c.get('authType');
		const isAdmin = (user?.isadmin === 1) || (authType === 'bearer');

		const contents = await service.getFolderContents(null, isAdmin ? 'admin' : 'public');
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

		// Log Create Folder
		try {
			const logService = new LogService();
			const user = c.get('user');
			const userId = user?.id ?? null;
			const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
			const agent = c.req.header('user-agent');
			await logService.logActivity(
				userId as number | null,
				'CREATE_FOLDER',
				'FOLDER',
				folder.id,
				{ name: folder.name, parent: folder.parent },
				ip,
				agent
			);
		} catch (e) {
			console.error('Failed to log create folder', e);
		}

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

		// Log Update Folder
		try {
			const logService = new LogService();
			const user = c.get('user');
			const userId = user?.id ?? null;
			const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
			const agent = c.req.header('user-agent');
			await logService.logActivity(
				userId as number | null,
				'UPDATE_FOLDER',
				'FOLDER',
				id,
				{ updates: data },
				ip,
				agent
			);
		} catch (e) {
			console.error('Failed to log update folder', e);
		}

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

		// Log Delete Folder
		try {
			const logService = new LogService();
			const user = c.get('user');
			const userId = user?.id ?? null;
			const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
			const agent = c.req.header('user-agent');
			await logService.logWarning(
				userId as number | null,
				'DELETE_FOLDER',
				`Folder ${id} deleted`,
				'FOLDER',
				id,
				ip,
				agent
			);
		} catch (e) {
			console.error('Failed to log delete folder', e);
		}

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

		// Log Download (UUID)
		try {
			const logService = new LogService();
			const user = c.get('user');
			const userId = user?.id ?? null;
			const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
			const agent = c.req.header('user-agent');
			await logService.logActivity(
				userId as number | null,
				'DOWNLOAD_UUID',
				'FILE',
				sysname,
				{ sysname },
				ip,
				agent
			);
		} catch (e) {
			console.error('Failed to log UUID download', e);
		}

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



		// Check for admin privileges
		const user = c.get('user');
		const authType = c.get('authType');
		const isAdmin = (user?.isadmin === 1) || (authType === 'bearer');

		const file = await service.getFileById(id, isAdmin ? 'admin' : 'public');
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

			// Log Download Activity
			try {
				const logService = new LogService();
				// user is already retrieved above
				const userId = user?.id || null;
				const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
				const agent = c.req.header('user-agent');

				await logService.logActivity(
					userId as number | null,
					'DOWNLOAD',
					'FILE',
					file.id,
					{ filename: file.filename, sysname: file.sysname },
					ip,
					agent
				);
			} catch (err) {
				console.error('Failed to log download:', err);
				// Continue serving file even if logging fails
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
		const isactiveVal = formData.get('isactive');

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
			isactive: isactiveVal !== null ? parseInt(isactiveVal as string) : undefined
		};

		const createdFile = await service.createFile(fileData);

		// Log Upload File
		try {
			const logService = new LogService();
			const user = c.get('user');
			const userId = user?.id ?? null;
			const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
			const agent = c.req.header('user-agent');
			await logService.logActivity(
				userId as number | null,
				'UPLOAD_FILE',
				'FILE',
				createdFile.id,
				{ filename: createdFile.filename, sysname: createdFile.sysname, parent: createdFile.parent },
				ip,
				agent
			);
		} catch (e) {
			console.error('Failed to log upload file', e);
		}

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

		// Log Update File
		try {
			const logService = new LogService();
			const user = c.get('user');
			const userId = user?.id ?? null;
			const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
			const agent = c.req.header('user-agent');
			await logService.logActivity(
				userId as number | null,
				'UPDATE_FILE',
				'FILE',
				id,
				{ updates: data },
				ip,
				agent
			);
		} catch (e) {
			console.error('Failed to log update file', e);
		}

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

		// Log Delete File
		try {
			const logService = new LogService();
			const user = c.get('user');
			const userId = user?.id ?? null;
			const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
			const agent = c.req.header('user-agent');
			await logService.logWarning(
				userId as number | null,
				'DELETE_FILE',
				`File ${id} deleted`,
				'FILE',
				id,
				ip,
				agent
			);
		} catch (e) {
			console.error('Failed to log delete file', e);
		}

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
