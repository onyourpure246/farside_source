import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import dotenv from 'dotenv';
import { initializeDatabase, testConnection } from './services/database.service';
import { initializeFileStorage } from './services/file-storage.service';
import { corsMiddleware } from './middleware/cors.middleware';
import commonsRouter from './routes/commons.routes';
import plannerRouter from './routes/planner.routes';
import dlRouter from './routes/download.routes';
import newsRouter from './routes/news.routes';

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
	// app.route('/api/fy2569/commons', commonsRouter); // Legacy Auth & Participants - Disabled
	// app.route('/api/fy2569/planner', plannerRouter); // Disabled for initial verification
	app.route('/api/fy2569/dl', dlRouter);
	app.route('/api/fy2569/news', newsRouter); // Announcements / Public Relations

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
