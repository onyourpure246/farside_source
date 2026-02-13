import { execute, initializeDatabase, closeDatabase } from './services/database.service';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function seedEmployees() {
    try {
        const config = {
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'casdu_db'
        };
        initializeDatabase(config);

        console.log('--- SEEDING EMPLOYEES FROM JSON ---');

        const seedFilePath = path.join(process.cwd(), 'src', 'seed-data.json');

        if (!fs.existsSync(seedFilePath)) {
            console.error('Error: seed-data.json not found in src folder.');
            process.exit(1);
        }

        const rawData = fs.readFileSync(seedFilePath, 'utf-8');
        const employees = JSON.parse(rawData);

        console.log(`Found ${employees.length} employees to seed.`);

        for (const emp of employees) {
            console.log(`Inserting: ${emp.firstname} ${emp.lastname} (${emp.cid})`);

            await execute(
                `INSERT INTO employees (cid, firstname, lastname, email, position, isactive) 
                 VALUES (?, ?, ?, ?, ?, 1)
                 ON DUPLICATE KEY UPDATE firstname=VALUES(firstname), lastname=VALUES(lastname), email=VALUES(email), position=VALUES(position), isactive=1`,
                [emp.cid, emp.firstname, emp.lastname, emp.email, emp.position]
            );
        }

        console.log('--- SUCCESS: Employees seeded ---');

    } catch (err) {
        console.error('Failed to seed employees:', err);
    } finally {
        await closeDatabase();
        process.exit(0);
    }
}

seedEmployees();
