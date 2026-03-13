
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Blob } from 'buffer';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}/api/fy2569`;
const AUTH_SECRET = process.env.AUTH_SECRET;

async function testDownloadSystem() {
    console.log(`🚀 Testing Download System on ${BASE_URL}\n`);

    // 1. Test Fetching Root Folders
    console.log('1️⃣  Testing GET /dl/folder (Root Folders)...');
    try {
        const res = await fetch(`${BASE_URL}/dl/folder`, {
            headers: {
                'Authorization': `Bearer ${AUTH_SECRET}`
            }
        });

        if (res.ok) {
            const json = await res.json() as any;
            console.log('✅ Success! Found folders:', json.data?.folders?.length || 0);
            console.log('✅ Found files:', json.data?.files?.length || 0);
            if (json.data?.folders?.length > 0) {
                console.log('   Sample Folder:', json.data.folders[0].name);
            }
        } else {
            console.error('❌ Failed:', res.status, res.statusText);
            console.error(await res.text());
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }

    console.log('\n--------------------------------\n');

    // 2. Test File Upload
    console.log('2️⃣  Testing POST /dl/file (Upload)...');
    try {
        const formData = new FormData();
        formData.append('name', 'Test File via Script');
        formData.append('description', 'Uploaded automatically by test script');

        // Create a dummy file content
        const fileContent = 'This is a test file content ' + new Date().toISOString();
        const blob = new Blob([fileContent], { type: 'text/plain' });
        formData.append('file', blob, 'test-upload.txt');

        // Check if we have a parent folder (use root/null if not specific)
        // We won't set parent for this test to put it in root

        const res = await fetch(`${BASE_URL}/dl/file`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_SECRET}`
            },
            body: formData
        });

        if (res.ok) {
            const json = await res.json() as any;
            console.log('✅ Upload Success!');
            console.log('   File ID:', json.data.id);
            console.log('   Sysname (UUID):', json.data.sysname);

            // Verify file exists on disk
            const uploadPath = process.env.FILE_UPLOAD_PATH || './uploads';
            const filePath = path.join(uploadPath, json.data.sysname);

            // We can't check FS from client side script usually, but here we are running locally so we can check
            // via another way? Actually this script runs via `tsx` locally, so `fs` module works.
            if (fs.existsSync(filePath)) {
                console.log('✅ File verified on Disk at:', filePath);
            } else {
                console.error('❌ File NOT found on Disk at:', filePath);
            }

        } else {
            console.error('❌ Upload Failed:', res.status, res.statusText);
            console.error(await res.text());
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testDownloadSystem();
