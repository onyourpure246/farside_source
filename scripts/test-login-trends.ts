
import { query, closeDatabase } from '../src/services/database.service';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testLoginTrends() {
    try {
        console.log('Testing Login Trends Query...');

        const sql = `
            WITH RECURSIVE dates (date) AS (
                SELECT DATE(NOW() - INTERVAL 29 DAY)
                UNION ALL
                SELECT date + INTERVAL 1 DAY FROM dates WHERE date < DATE(NOW())
            )
            SELECT 
                DATE_FORMAT(dates.date, '%Y-%m-%d') as date, 
                COUNT(logs.id) as count 
            FROM dates 
            LEFT JOIN common_activity_logs logs 
                ON DATE(logs.created_at) = dates.date 
                AND logs.action = 'VERIFY_EMPLOYEE'
            GROUP BY dates.date 
            ORDER BY dates.date ASC
        `;

        const results = await query(sql);

        console.log(`Query returned ${results.length} rows.`);

        if (results.length > 0) {
            console.log('First row:', results[0]);
            console.log('Last row:', results[results.length - 1]);
        }

        if (results.length === 30) {
            console.log('SUCCESS: Query returned exactly 30 days.');
        } else {
            console.error(`FAILURE: Query returned ${results.length} days instead of 30.`);
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await closeDatabase();
    }
}

testLoginTrends();
