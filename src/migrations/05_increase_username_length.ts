import { initializeDatabase, execute, closeDatabase } from '../services/database.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
    try {
        const config = {
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'casdu_db'
        };

        initializeDatabase(config);
        console.log('Starting migration: 05_increase_username_length.ts');

        // Increase the length of the username column to 100 characters to safely store 64-character SHA-256 hashes
        console.log('Altering common_users table to increase username column length...');
        await execute(`
            ALTER TABLE common_users 
            MODIFY COLUMN username VARCHAR(100) NOT NULL;
        `);

        console.log('Migration completed successfully. Username column length is now VARCHAR(100).');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await closeDatabase();
        process.exit(0);
    }
}

runMigration();
