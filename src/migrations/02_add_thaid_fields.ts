import { initializeDatabase, query, execute, closeDatabase } from '../services/database.service';
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
        console.log('Starting migration: 02_add_thaid_fields.ts');

        // 1. Check and Add Columns to common_users
        // email
        try {
            const cols = await query("SHOW COLUMNS FROM common_users LIKE 'email'");
            if (cols.length === 0) {
                console.log('Adding email column to common_users...');
                await execute("ALTER TABLE common_users ADD COLUMN email VARCHAR(255) NULL AFTER lastname");
            } else {
                console.log('Column email already exists in common_users.');
            }
        } catch (e: any) { console.error('Error checking/adding email:', e.message); }

        // role
        try {
            const cols = await query("SHOW COLUMNS FROM common_users LIKE 'role'");
            if (cols.length === 0) {
                console.log('Adding role column to common_users...');
                // Default role is 'user'
                await execute("ALTER TABLE common_users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user' AFTER isadmin");
            } else {
                console.log('Column role already exists in common_users.');
            }
        } catch (e: any) { console.error('Error checking/adding role:', e.message); }

        // status
        try {
            const cols = await query("SHOW COLUMNS FROM common_users LIKE 'status'");
            if (cols.length === 0) {
                console.log('Adding status column to common_users...');
                // Default status is 'active'
                await execute("ALTER TABLE common_users ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'active' AFTER role");
            } else {
                console.log('Column status already exists in common_users.');
            }
        } catch (e: any) { console.error('Error checking/adding status:', e.message); }

        // 2. Create employees table
        try {
            console.log('Checking/Creating employees table...');
            await execute(`
                CREATE TABLE IF NOT EXISTS employees (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    cid VARCHAR(20) NOT NULL UNIQUE,
                    firstname VARCHAR(255) NULL,
                    lastname VARCHAR(255) NULL,
                    email VARCHAR(255) NULL,
                    position VARCHAR(255) NULL,
                    isactive TINYINT(1) DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_cid (cid)
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
            `);
            console.log('Employees table ensured.');
        } catch (e: any) { console.error('Error creating employees table:', e.message); }

        // 3. Backfill role/status for existing users (if they were NULL, though we set DEFAULT)
        // Just to be safe, let's sync isadmin -> role = 'admin' if needed
        console.log('Syncing isadmin to role...');
        await execute("UPDATE common_users SET role = 'admin' WHERE isadmin = 1 AND role = 'user'"); // checking role='user' to avoid overwriting if already set manually

        console.log('Migration completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await closeDatabase();
        process.exit(0);
    }
}

runMigration();
