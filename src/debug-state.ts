import { queryOne, initializeDatabase, closeDatabase } from './services/database.service';
import * as dotenv from 'dotenv';
import { CommonUser } from './types';

dotenv.config();

async function debugState() {
    try {
        const config = {
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'casdu_db'
        };
        initializeDatabase(config);

        const TARGET_CID = '1101000093449';

        console.log(`--- DEBUG STATE FOR CID: ${TARGET_CID} ---`);

        // 1. Check Employees Table
        const employee = await queryOne(
            'SELECT * FROM employees WHERE cid = ?',
            [TARGET_CID]
        );
        if (employee) {
            console.log('[OK] Found in EMPLOYEES table:', employee);
        } else {
            console.error('[FAIL] NOT FOUND in EMPLOYEES table! (This causes 401 Unauthorized)');
        }

        // 2. Check Common Users Table
        const user = await queryOne<CommonUser>(
            'SELECT * FROM common_users WHERE username = ?',
            [TARGET_CID]
        );
        if (user) {
            console.log('[INFO] Found in USERS table:', {
                id: user.id,
                username: user.username,
                role: user.role,
                status: user.status
            });
        } else {
            console.log('[INFO] Not found in USERS table (Will be created on login)');
        }

    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        await closeDatabase();
        process.exit(0);
    }
}

debugState();
