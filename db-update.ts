import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'farside'
        });
        console.log('Connected to DB');
        await connection.execute('ALTER TABLE common_news ADD COLUMN is_urgent TINYINT(1) DEFAULT 0');
        console.log('Column is_urgent added successfully');
        await connection.end();
        process.exit(0);
    } catch (err: any) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists.');
            process.exit(0);
        }
        console.error('Error adding column:', err);
        process.exit(1);
    }
}

run();
