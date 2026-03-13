
import { query } from '../src/services/database.service';
import * as dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from '../src/services/database.service';

dotenv.config();

async function verify() {
    try {
        initializeDatabase({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'casdu_db'
        });

        const rows = await query('SHOW COLUMNS FROM dl_files LIKE "downloads"');
        if (rows.length > 0) {
            console.log('Column "downloads" exists.');
        } else {
            console.log('Column "downloads" does NOT exist.');
        }

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await closeDatabase();
    }
}

verify();
