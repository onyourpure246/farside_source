
import { queryOne, execute } from '../src/services/database.service';
import { DownloadService } from '../src/services/download.service';
import * as dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from '../src/services/database.service';

dotenv.config();

async function verifyIncrement() {
    try {
        initializeDatabase({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'casdu_db'
        });

        const service = new DownloadService();

        // 1. Create a dummy test file
        const result = await execute(`
            INSERT INTO dl_files (parent, name, description, filename, sysname, mui_icon, mui_colour, isactive, downloads, created_at, updated_at)
            VALUES (NULL, 'Test File', 'For Increment Test', 'test.txt', 'test-sysname-123', 'File', '#000000', 1, 0, NOW(), NOW())
        `);
        const fileId = result.insertId;
        console.log(`Created test file with ID: ${fileId}`);

        // 2. Check initial count
        let file = await service.getFileById(fileId, 'all');
        console.log(`Initial downloads: ${file?.downloads}`);

        if (file?.downloads !== 0) {
            console.error('Initial download count is not 0!');
        }

        // 3. Increment count
        console.log('Incrementing download count...');
        await service.incrementDownloadCount(fileId);

        // 4. Check updated count
        file = await service.getFileById(fileId, 'all');
        console.log(`Updated downloads: ${file?.downloads}`);

        if (file?.downloads === 1) {
            console.log('SUCCESS: Download count incremented correctly.');
        } else {
            console.error(`FAILURE: Download count is ${file?.downloads}, expected 1.`);
        }

        // 5. Cleanup
        await service.deleteFile(fileId);
        console.log('Test file cleaned up.');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await closeDatabase();
    }
}

verifyIncrement();
