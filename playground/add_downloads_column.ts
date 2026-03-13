
import { execute } from '../src/services/database.service';
import * as dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from '../src/services/database.service';

dotenv.config();

async function migrate() {
    try {
        // Initialize DB connection
        initializeDatabase({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'casdu_db'
        });

        console.log('Adding downloads column to dl_files...');

        // Add column if not exists
        // MySQL doesn't have "IF NOT EXISTS" for ADD COLUMN in all versions easily without procedure, 
        // but we can try catch or check information_schema. 
        // Simple approach: Try add, ignore "Duplicate column" error.

        try {
            await execute(`
                ALTER TABLE dl_files 
                ADD COLUMN downloads INT DEFAULT 0 AFTER isactive
            `);
            console.log('Column added successfully.');
        } catch (error: any) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('Column "downloads" already exists. Skipping.');
            } else {
                throw error;
            }
        }

        console.log('Migration complete.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await closeDatabase();
    }
}

migrate();
