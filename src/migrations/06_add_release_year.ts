import dotenv from 'dotenv';
import { initializeDatabase, query, execute, closeDatabase } from '../services/database.service';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'casdu_db',
};

async function runMigration() {
    try {
        console.log('Connecting to database...');
        initializeDatabase(dbConfig);
        console.log('Database connected.');

        console.log('Checking if release_year column exists in dl_categories...');
        const columns = await query<{ Field: string }>("SHOW COLUMNS FROM `dl_categories` LIKE 'release_year'");

        if (columns.length === 0) {
            console.log('Adding release_year column to dl_categories...');
            await execute(`
                ALTER TABLE \`dl_categories\` 
                ADD COLUMN \`release_year\` varchar(10) NULL DEFAULT NULL COMMENT 'ปีที่ปล่อยอัพเดท (เช่น 2568)' AFTER \`group_name\`;
            `);
            console.log('release_year column added successfully.');
        } else {
            console.log('release_year column already exists in dl_categories.');
        }

        console.log('Migration 06 completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await closeDatabase();
    }
}

runMigration();
