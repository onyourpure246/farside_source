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

        console.log('1. Creating dl_categories table...');
        await execute(`
			CREATE TABLE IF NOT EXISTS \`dl_categories\` (
			\`id\` int(11) NOT NULL AUTO_INCREMENT,
			\`name\` varchar(255) NOT NULL COMMENT 'ชื่อหมวดหมู่',
			\`isactive\` tinyint(1) DEFAULT 1 COMMENT '1 = ใช้งาน, 0 = ยกเลิก',
			\`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
			\`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (\`id\`)
			);
		`);
        console.log('dl_categories table created or already exists.');

        console.log('2. Inserting initial categories...');
        // Check if empty first to avoid duplicates
        const countResult = await query<{ count: number }>('SELECT COUNT(*) as count FROM dl_categories');
        if (countResult[0].count === 0) {
            await execute(`INSERT INTO \`dl_categories\` (\`name\`) VALUES ('ทั่วไป'), ('คู่มือ'), ('ระเบียบ/ข้อบังคับ');`);
            console.log('Initial categories inserted.');
        } else {
            console.log('Categories already exist. Skipping insert.');
        }

        console.log('3. Adding category_id to dl_files...');
        // Check if column exists
        const columns = await query<{ Field: string }>("SHOW COLUMNS FROM \`dl_files\` LIKE 'category_id'");
        if (columns.length === 0) {
            await execute(`
				ALTER TABLE \`dl_files\` 
				ADD COLUMN \`category_id\` int(11) NULL DEFAULT NULL COMMENT 'รหัสหมวดหมู่ (FK -> dl_categories.id)' AFTER \`parent\`;
			`);
            console.log('category_id column added to dl_files.');
        } else {
            console.log('category_id column already exists in dl_files.');
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await closeDatabase();
    }
}

runMigration();
