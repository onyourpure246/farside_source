import { initializeDatabase, query, execute, closeDatabase } from '../services/database.service';
import { hashPID, maskPID } from '../utils/crypto.util';
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
        console.log('Starting migration: 04_hash_existing_pids.ts');

        // Find users whose username is exactly 13 digits
        const rawUsers = await query(`
            SELECT id, username, email, displayname 
            FROM common_users 
            WHERE username REGEXP '^[0-9]{13}$'
        `);

        console.log(`Found ${rawUsers.length} users with plaintext PIDs to hash.`);

        for (const user of rawUsers) {
            const rawPid = user.username.trim();
            const hashedPid = hashPID(rawPid);
            
            // Generate safe display values
            const masked = maskPID(rawPid);
            
            // Check if email contains the raw PID
            let newEmail = user.email;
            if (newEmail && newEmail.includes(rawPid)) {
                newEmail = newEmail.replace(rawPid, masked);
            } else if (!newEmail || newEmail.includes('@cad.go.th')) {
                newEmail = `${masked}@cad.go.th`; // Ensure placeholder emails are masked
            }

            // Check if displayname contains raw PID
            let newDisplayName = user.displayname;
            if (newDisplayName && newDisplayName.includes(rawPid)) {
                newDisplayName = newDisplayName.replace(rawPid, masked);
            }

            console.log(`Hashing PID for User ID ${user.id} -> ${hashedPid.substring(0,8)}...`);
            
            await execute(
                `UPDATE common_users SET 
                    username = ?, 
                    email = ?, 
                    displayname = ? 
                WHERE id = ?`,
                [hashedPid, newEmail, newDisplayName, user.id]
            );
        }

        console.log('Migration completed successfully. All plaintext PIDs in common_users have been hashed.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await closeDatabase();
        process.exit(0);
    }
}

runMigration();
