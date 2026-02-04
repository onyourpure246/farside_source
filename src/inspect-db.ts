import { initializeDatabase, query, closeDatabase } from './services/database.service';
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

        console.log('Checking Foreign Keys for dl_folders (parent column)...');
        const folderFKs = await query(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'dl_folders' AND COLUMN_NAME = 'parent' AND REFERENCED_TABLE_NAME IS NOT NULL
        `, [config.database]);
        console.log('dl_folders FKs:', folderFKs);

        console.log('Checking Foreign Keys for dl_files (parent column)...');
        const fileFKs = await query(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'dl_files' AND COLUMN_NAME = 'parent' AND REFERENCED_TABLE_NAME IS NOT NULL
        `, [config.database]);
        console.log('dl_files FKs:', fileFKs);

        console.log('--- DB INSPECTION END ---');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await closeDatabase();
    }
}

run();
