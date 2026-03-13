import { initializeDatabase, query, closeDatabase } from '../src/services/database.service';
import * as dotenv from 'dotenv';
import path from 'path';

// Fix for custom location of .env if needed, but here we assume it's in root
dotenv.config();

async function run() {
    try {
        const config = {
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'casdu_db'
        };

        initializeDatabase(config);

        console.log('--- DB INSPECTION START ---');

        const userCols = await query('SHOW COLUMNS FROM common_users');
        console.log('common_users columns:', userCols.map((c: any) => c.Field));

        try {
            const empCols = await query('SHOW COLUMNS FROM employees');
            console.log('employees columns:', empCols.map((c: any) => c.Field));
        } catch (e) {
            console.log('employees table not found or error accessing it.');
        }

        console.log('--- DB INSPECTION END ---');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        // Ensure pool closed
        await closeDatabase();
        process.exit(0);
    }
}

run();
