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

        console.log('Checking if group_name column exists in dl_categories...');
        const columns = await query<{ Field: string }>("SHOW COLUMNS FROM `dl_categories` LIKE 'group_name'");

        if (columns.length === 0) {
            console.log('Adding group_name column to dl_categories...');
            await execute(`
                ALTER TABLE \`dl_categories\` 
                ADD COLUMN \`group_name\` varchar(100) NOT NULL DEFAULT 'เอกสารต่างๆ' COMMENT 'กลุ่มของหมวดหมู่ (เช่น เอกสารต่างๆ, ชุดคำสั่ง)' AFTER \`name\`;
            `);
            console.log('group_name column added successfully.');
        } else {
            console.log('group_name column already exists in dl_categories.');
        }

        console.log('Migration 03 completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await closeDatabase();
    }
}

runMigration();
