
import fs from 'fs';
import path from 'path';

const logPath = path.resolve(process.cwd(), 'verify_log.txt');
try {
    const content = fs.readFileSync(logPath, 'utf8');
    console.log('--- LOG START ---');
    console.log(content);
    console.log('--- LOG END ---');
} catch (e) {
    console.error('Error reading log:', e);
}
