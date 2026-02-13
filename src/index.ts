import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import dotenv from 'dotenv';
import { initializeDatabase, testConnection } from './services/database.service';
import { initializeFileStorage } from './services/file-storage.service';
import { corsMiddleware } from './middleware/cors.middleware';
import commonsRouter from './routes/commons.routes';
import dlRouter from './routes/download.routes';
import newsRouter from './routes/news.routes';
import employeeRouter from './routes/employee.routes';
import userRouter from './routes/user.routes';
import dashboardRouter from './routes/dashboard.routes';
import searchRouter from './routes/search.routes';

// Load environment variables
dotenv.config();

// Initialize database connection
const dbConfig = {
	host: process.env.DB_HOST || 'localhost',
	port: parseInt(process.env.DB_PORT || '3306'),
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || 'casdu_db',
};

// Wrap initialization in async function
async function initialize() {
	try {
		initializeDatabase(dbConfig);
		console.log('✓ Database connection initialized');

		// Test database connection
		await testConnection();
		console.log('✓ Database connection test successful');
	} catch (error) {
		console.error('✗ Failed to initialize database:', error);
		console.error('Database config:', {
			host: dbConfig.host,
			port: dbConfig.port,
			database: dbConfig.database,
			user: dbConfig.user
		});
		process.exit(1);
	}

	// Initialize file storage
	const fileStorageConfig = {
		uploadPath: process.env.FILE_UPLOAD_PATH || './uploads',
	};

	try {
		initializeFileStorage(fileStorageConfig);
		console.log('✓ File storage initialized');
	} catch (error) {
		console.error('✗ Failed to initialize file storage:', error);
		process.exit(1);
	}

	// Create Hono app
	const app = new Hono();

	// Apply CORS middleware to all routes
	app.use('*', corsMiddleware);

	// Global Logger
	app.use('*', async (c, next) => {
		const start = Date.now();
		await next();
		const ms = Date.now() - start;
		console.log(`[${c.req.method}] ${c.req.path} - ${c.res.status} (${ms}ms)`);
	});

	// Global Error Handler
	app.onError(async (err, c) => {
		console.error('Global Error caught:', err);

		try {
			const { LogService } = await import('./services/log.service');
			const logService = new LogService();
			// Try to get user from context if available (depends on when error occurred)
			const user = (c as any).get('user');
			const userId = user?.id || null;
			const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
			const userAgent = c.req.header('user-agent');

			await logService.logError(
				userId,
				'SYSTEM_CRASH',
				err,
				JSON.stringify(ip),
				JSON.stringify(userAgent)
			);
		} catch (logErr) {
			console.error('Failed to log global error:', logErr);
		}

		return c.json({
			success: false,
			error: 'Internal Server Error',
			message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
		}, 500);
	});

	// Root endpoint - no auth required
	app.get('/', (c) => {
		return c.json({
			message: 'CASDU Far-Side API',
			version: '1.0.0',
			status: 'running'
		});
	});

	// Health check endpoint
	app.get('/health', (c) => {
		return c.json({
			status: 'healthy',
			timestamp: new Date().toISOString()
		});
	});

	// Debug endpoint to check configuration
	app.get('/debug/config', (c) => {
		return c.json({
			debug: true,
			database: {
				host: dbConfig.host,
				port: dbConfig.port,
				database: dbConfig.database,
				user: dbConfig.user,
			},
			fileStorage: {
				uploadPath: fileStorageConfig.uploadPath,
			},
			auth: {
				authSecretConfigured: !!process.env.AUTH_SECRET,
				jwtSecretConfigured: !!process.env.JWT_SECRET,
			},
			env: process.env.NODE_ENV || 'development',
		});
	});

	// Mount route groups under /api/fy2569/
	app.route('/api/fy2569/commons', commonsRouter); // Legacy Auth & Participants - Enabled for Logging Test
	// app.route('/api/fy2569/planner', plannerRouter); // Disabled for initial verification
	app.route('/api/fy2569/dl', dlRouter);
	app.route('/api/fy2569/news', newsRouter); // Announcements / Public Relations
	app.route('/api/fy2569/employee', employeeRouter); // Employee Verification for SSO
	app.route('/api/fy2569/users', userRouter); // User Management (Admin)
	app.route('/api/fy2569/dashboard', dashboardRouter); // Admin Dashboard
	app.route('/api/fy2569/search', searchRouter); // Search Tracking & Popular Tags


	// Start server
	const port = parseInt(process.env.PORT || '3000');

	console.log(`🚀 Starting CASDU Far-Side API server...`);
	console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
	console.log(`🔧 Port: ${port}`);

	serve({
		fetch: app.fetch,
		port,
	});

	console.log(`✓ Server is running on http://localhost:${port}`);
	console.log(`✓ Health check available at http://localhost:${port}/health`);
}

// Start the application
initialize().catch((error) => {
	console.error('Failed to start server:', error);
	process.exit(1);
});
