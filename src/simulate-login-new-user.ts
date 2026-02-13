import { execute, initializeDatabase, closeDatabase } from './services/database.service';
import { AuthService } from './services/auth.service';
import * as dotenv from 'dotenv';
import { SafeUser } from './types';

dotenv.config();

async function simulateLogin() {
    try {
        const config = {
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'casdu_db'
        };
        initializeDatabase(config);

        const jwtSecret = 'test_secret';
        const authService = new AuthService(jwtSecret);
        const TEST_CID = '1101000093449';

        console.log(`--- Simulating Login for CID: ${TEST_CID} ---`);

        // This triggers the UPSERT logic (Create user if not exists)
        const user = await authService.upsertThaIDUser(TEST_CID);

        console.log('--- LOGIN SUCCESS ---');
        console.log('User returned by AuthService:', {
            id: user.id,
            username: user.username, // Should be masked if viewed as SafeUser, but upsert returns SafeUser
            role: user.role,
            status: user.status
        });

    } catch (err: any) {
        console.error('--- LOGIN FAILED ---');
        console.error(err.message);
        if (err.message.includes('Unauthorized')) {
            console.error('Reason: Employee verification failed.');
        }
    } finally {
        await closeDatabase();
        process.exit(0);
    }
}

simulateLogin();
