import { initializeDatabase, execute, closeDatabase, getDatabase } from '../services/database.service';
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
        console.log('Starting migration: 01_add_on_delete_cascade');

        // 1. Add FK to dl_folders (Self-referencing for folders)
        console.log('Adding FK constraint to dl_folders...');
        try {
            await execute(`
                ALTER TABLE dl_folders
                ADD CONSTRAINT fk_dl_folders_parent
                FOREIGN KEY (parent) REFERENCES dl_folders(id)
                ON DELETE CASCADE
            `);
            console.log('SUCCESS: Added fk_dl_folders_parent');
        } catch (err: any) {
            console.warn('WARNING: Failed to add fk_dl_folders_parent. It might already exist.', err.message);
        }

        // 2. Add FK to dl_files (Referencing folders)
        console.log('Adding FK constraint to dl_files...');
        try {
            await execute(`
                ALTER TABLE dl_files
                ADD CONSTRAINT fk_dl_files_parent
                FOREIGN KEY (parent) REFERENCES dl_folders(id)
                ON DELETE CASCADE
            `);
            console.log('SUCCESS: Added fk_dl_files_parent');
        } catch (err: any) {
            console.warn('WARNING: Failed to add fk_dl_files_parent. It might already exist.', err.message);
        }

        console.log('Migration completed successfully.');

    } catch (err) {
        console.error('Migration FAILED:', err);
    } finally {
        await closeDatabase();
    }
}

runMigration();
