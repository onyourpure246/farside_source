import { query, execute } from '../services/database.service';

export async function up() {
    try {
        console.log('Running migration: 08_rename_release_year_to_version');
        
        // Rename in dl_categories if exists
        console.log('Checking if release_year column exists in dl_categories...');
        const categoryColumns = await query<{ Field: string }>("SHOW COLUMNS FROM `dl_categories` LIKE 'release_year'");
        
        if (categoryColumns.length > 0) {
            console.log('Renaming release_year to version in dl_categories...');
            await execute(`ALTER TABLE \`dl_categories\` CHANGE COLUMN \`release_year\` \`version\` varchar(10) NULL DEFAULT NULL COMMENT 'เวอร์ชัน (เช่น 1.9, 2.0)';`);
            console.log('Column renamed in dl_categories.');
        }

        // Rename in dl_files if exists
        console.log('Checking if release_year column exists in dl_files...');
        const fileColumns = await query<{ Field: string }>("SHOW COLUMNS FROM `dl_files` LIKE 'release_year'");
        
        if (fileColumns.length > 0) {
            console.log('Renaming release_year to version in dl_files...');
            await execute(`ALTER TABLE \`dl_files\` CHANGE COLUMN \`release_year\` \`version\` varchar(10) NULL DEFAULT NULL COMMENT 'เวอร์ชัน (เช่น 1.9, 2.0)';`);
            console.log('Column renamed in dl_files.');
        }

        console.log('Migration 08 completed successfully.');
    } catch (error) {
        console.error('Migration 08 failed:', error);
        throw error;
    }
}
