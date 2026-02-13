import { execute, query, initializeDatabase, closeDatabase } from './services/database.service';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()));
    });
}

async function resetDatabase() {
    try {
        const config = {
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'casdu_db'
        };
        initializeDatabase(config);

        console.log('--- RESET DATABASE (TRUNCATE ALL TABLES) ---');
        console.log('WARNING: This will DELETE ALL DATA IN THE ENTIRE DATABASE.');
        console.log('ALL tables will be truncated and IDs reset to 1.');

        const answer = await ask('Are you absolutely sure? (yes/no): ');
        if (answer.toLowerCase() !== 'yes') {
            console.log('Operation cancelled.');
            process.exit(0);
        }

        console.log('Resetting...');

        // Disable FK checks
        await execute('SET FOREIGN_KEY_CHECKS = 0');

        // Get all tables
        // Query returns array of RowDataPacket, e.g. [ { Tables_in_casdu_db: 'common_users' }, ... ]
        const tables = await query<any[]>(`SHOW TABLES`);

        if (!tables || tables.length === 0) {
            console.log('No tables found.');
        } else {
            // Extract table name from the first value of each row object
            const tableNames = tables.map(row => Object.values(row)[0] as string);

            for (const table of tableNames) {
                // Skip migrations if preferred, but user said "Reset All"
                if (table === 'migrations' || table === 'knex_migrations') {
                    console.log(`Skipping migration table: ${table}`);
                    continue;
                }

                console.log(`Truncating ${table}...`);
                await execute(`TRUNCATE TABLE ${table}`);
            }
        }

        await execute('SET FOREIGN_KEY_CHECKS = 1');

        console.log('--- SUCCESS: Database reset complete ---');

    } catch (err) {
        console.error('Failed to reset database:', err);
    } finally {
        await closeDatabase();
        rl.close();
        process.exit(0);
    }
}

resetDatabase();
