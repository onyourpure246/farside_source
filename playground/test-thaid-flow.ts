import { AuthService } from './services/auth.service';
import { execute, queryOne, initializeDatabase, closeDatabase } from './services/database.service';
import * as dotenv from 'dotenv';
import { Employee } from './types';

dotenv.config();

/**
 * Test Script for ThaID Auto-Register Flow
 */
async function testFlow() {
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

        const TEST_CID = '9999999999999';

        console.log('--- Step 1: Clean up previous test data ---');
        await execute("DELETE FROM common_users WHERE username = ?", [TEST_CID]);
        await execute("DELETE FROM employees WHERE cid = ?", [TEST_CID]);
        console.log('Cleaned up.');

        console.log('--- Step 2: Try Login WITHOUT Employee Data (Should Fail) ---');
        try {
            await authService.upsertThaIDUser(TEST_CID);
            console.error('FAIL: Should have thrown error');
        } catch (e: any) {
            console.log('PASS: Caught expected error:', e.message);
        }

        console.log('--- Step 3: Insert Mock Employee ---');
        await execute(
            "INSERT INTO employees (cid, firstname, lastname, email, position) VALUES (?, ?, ?, ?, ?)",
            [TEST_CID, 'Test', 'Employee', 'test@example.com', 'Developer']
        );
        console.log('Employee inserted.');

        console.log('--- Step 4: Login WITH Employee Data (New User) ---');
        const newUser = await authService.upsertThaIDUser(TEST_CID);
        console.log('User created:', newUser);

        if (newUser.role === 'user' && newUser.status === 'active' && newUser.email === 'test@example.com') {
            console.log('PASS: New user fields correct.');
        } else {
            console.error('FAIL: User fields incorrect', newUser);
        }

        console.log('--- Step 5: Update Employee Data and Login Again (Existing User) ---');
        await execute("UPDATE employees SET lastname = 'Updated' WHERE cid = ?", [TEST_CID]);

        // Manually change role to 'admin' to ensure it is NOT overwritten
        await execute("UPDATE common_users SET role = 'admin' WHERE id = ?", [newUser.id]);

        const updatedUser = await authService.upsertThaIDUser(TEST_CID);
        console.log('User updated:', updatedUser);

        if (updatedUser.lastname === 'Updated') {
            console.log('PASS: Lastname updated.');
        } else {
            console.error('FAIL: Lastname NOT updated.');
        }

        const freshUser = await authService.getUserById(newUser.id);
        if (freshUser?.role === 'admin') {
            console.log('PASS: Role preserved (is still admin).');
        } else {
            console.error('FAIL: Role was reset!', freshUser?.role);
        }

    } catch (err) {
        console.error('TEST FAILED:', err);
    } finally {
        await closeDatabase();
        process.exit(0);
    }
}

testFlow();
