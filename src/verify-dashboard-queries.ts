import { queryOne, query, initializeDatabase, closeDatabase } from './services/database.service';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

async function verifyDashboardStats() {
    try {
        console.log('Initializing database...');
        initializeDatabase({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'farside_db'
        });

        console.log('Running Active Users (Behavioral) Query...');
        const activeUsersBehavioral = await queryOne<{ count: number }>(`
            SELECT COUNT(DISTINCT l.user_id) as count 
            FROM common_activity_logs l
            JOIN common_users u ON l.user_id = u.id
        `);
        console.log('Active Users (Behavioral):', activeUsersBehavioral?.count);

        console.log('Running Total Users (Inventory) Query...');
        const totalUsersInventory = await queryOne<{ count: number }>(`
            SELECT COUNT(*) as count FROM common_users WHERE status = 'active'
        `);
        console.log('Total Users (Inventory):', totalUsersInventory?.count);

        console.log('--- Debug: Listing all users ---');
        const allUsers = await query('SELECT username, status FROM common_users');
        console.log(JSON.stringify(allUsers, null, 2));

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await closeDatabase();
    }
}

verifyDashboardStats();
