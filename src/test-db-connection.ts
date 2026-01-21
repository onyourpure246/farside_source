import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

async function test() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'casdu_db',
    };

    console.log('Testing connection with config:', {
        ...config,
        password: config.password ? '******' : '(empty)'
    });

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Connection successful!');
        const [rows] = await connection.execute('SELECT 1 as val');
        console.log('Query result:', rows);
        await connection.end();
    } catch (error: any) {
        console.error('❌ Connection failed!');
        console.error('Error code:', error.code);
        console.error('Error no:', error.errno);
        console.error('Message:', error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Hint: Check your username/password.');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('💡 Hint: Database does not exist. Did you create it in phpMyAdmin?');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('💡 Hint: Is MySQL Server running? Check host/port.');
        }
    }
}

test();
