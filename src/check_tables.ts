import { initializeDatabase, query, closeDatabase } from './services/database.service';
import * as dotenv from 'dotenv';

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

        console.log('--- CHECKING TABLES ---');

        try {
            const usersCols = await query('DESCRIBE common_users');
            console.log('common_users columns:', usersCols.map((c: any) => c.Field));
        } catch (e: any) {
            console.log('common_users table error:', e.message);
        }

        try {
            const empCols = await query('DESCRIBE employees');
            console.log('employees columns:', empCols.map((c: any) => c.Field));
        } catch (e: any) {
            console.log('employees table error:', e.message);
            // Try to find any table that looks like employees
            const tables = await query('SHOW TABLES');
            console.log('All tables:', tables);
        }

        console.log('--- END CHECKS ---');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await closeDatabase();
    }
}

run();
