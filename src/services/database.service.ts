import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export interface DatabaseConfig {
	host: string;
	port: number;
	user: string;
	password: string;
	database: string;
	waitForConnections?: boolean;
	connectionLimit?: number;
	queueLimit?: number;
}

export function initializeDatabase(config: DatabaseConfig): mysql.Pool {
	if (pool) {
		return pool;
	}

	console.log('Initializing database connection with config:', {
		host: config.host,
		port: config.port,
		user: config.user,
		database: config.database,
		connectionLimit: config.connectionLimit ?? 10
	});

	pool = mysql.createPool({
		host: config.host,
		port: config.port,
		user: config.user,
		password: config.password,
		database: config.database,
		waitForConnections: config.waitForConnections ?? true,
		connectionLimit: config.connectionLimit ?? 10,
		queueLimit: config.queueLimit ?? 0,
		connectTimeout: 10000,
		enableKeepAlive: true,
		keepAliveInitialDelay: 0,
		// Debug logging for connection events (optional)
		debug: false
	});

	pool.on('connection', (connection) => {
		console.log(`MySQL connection established (Thread ID: ${connection.threadId})`);
	});

	pool.on('enqueue', () => {
		// console.log('Waiting for available connection slot...');
	});

	return pool;
}

export function getDatabase(): mysql.Pool {
	if (!pool) {
		throw new Error('Database not initialized. Call initializeDatabase first.');
	}
	return pool;
}

/**
 * Test database connection
 * @returns true if connection is successful, throws error otherwise
 */
export async function testConnection(): Promise<boolean> {
	try {
		const db = getDatabase();
		await db.query('SELECT 1');
		return true;
	} catch (error) {
		console.error('Database connection test failed:', error);
		throw error;
	}
}

export async function closeDatabase(): Promise<void> {
	if (pool) {
		await pool.end();
		pool = null;
	}
}

// Helper function to execute queries
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
	try {
		const db = getDatabase();
		const [rows] = await db.execute(sql, params);
		return rows as T[];
	} catch (error: any) {
		console.error('Database query error:', {
			sql,
			params,
			error: error?.message || String(error),
			code: error?.code,
			errno: error?.errno,
			sqlState: error?.sqlState,
			sqlMessage: error?.sqlMessage,
			stack: error?.stack
		});
		throw error;
	}
}

// Helper function to execute a single query and return first result
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
	const results = await query<T>(sql, params);
	return results.length > 0 ? results[0] : null;
}

// Helper function for INSERT/UPDATE/DELETE operations
export async function execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
	try {
		const db = getDatabase();
		const [result] = await db.execute(sql, params);
		return result as mysql.ResultSetHeader;
	} catch (error: any) {
		console.error('Database execute error:', {
			sql,
			params,
			error: error?.message || String(error),
			code: error?.code,
			errno: error?.errno,
			sqlState: error?.sqlState,
			sqlMessage: error?.sqlMessage,
			stack: error?.stack
		});
		throw error;
	}
}
