
import dotenv from 'dotenv';
import path from 'path';
import { Blob } from 'buffer';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}/api/fy2569`;
const AUTH_SECRET = process.env.AUTH_SECRET;

async function testNewsSystem() {
    console.log(`🚀 Testing News/Announcements System on ${BASE_URL}\n`);

    let createdId: number | null = null;
    let coverImageUuid: string | null = null;

    // 1. Create News (as Admin - hardcoded in backend)
    console.log('1️⃣  Testing POST /news (Create News)...');
    try {
        const formData = new FormData();
        formData.append('title', 'Test News Announcement');
        formData.append('content', '<p>This is a test announcement created via script.</p>');
        formData.append('category', 'Test Category');
        formData.append('status', 'published');

        // Dummy cover image
        const fileContent = 'COVER_IMAGE_DATA_' + new Date().toISOString();
        const blob = new Blob([fileContent], { type: 'image/jpeg' });
        formData.append('cover_image', blob, 'cover.jpg');

        const res = await fetch(`${BASE_URL}/news`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_SECRET}`
            },
            body: formData
        });

        if (res.ok) {
            const json = await res.json() as any;
            console.log('✅ Created News ID:', json.data.id);
            console.log('✅ Cover Image UUID:', json.data.cover_image);
            createdId = json.data.id;
            coverImageUuid = json.data.cover_image;
        } else {
            console.error('❌ Failed:', res.status, res.statusText);
            console.error(await res.text());
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }

    console.log('\n--------------------------------\n');

    if (!createdId) {
        console.log('⚠️ Skipping remaining tests because creation failed.');
        return;
    }

    // 2. Get News Detail
    console.log(`2️⃣  Testing GET /news/${createdId} (Get Detail)...`);
    try {
        const res = await fetch(`${BASE_URL}/news/${createdId}`, {
            headers: { 'Authorization': `Bearer ${AUTH_SECRET}` }
        });

        if (res.ok) {
            const json = await res.json() as any;
            console.log('✅ Found News:', json.data.title);
            console.log('✅ Category:', json.data.category);
            console.log('✅ Created By:', json.data.created_by);
            if (json.data.cover_image === coverImageUuid) {
                console.log('✅ Cover Image verified.');
            }
        } else {
            console.error('❌ Failed:', res.status, res.statusText);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }

    console.log('\n--------------------------------\n');

    // 3. Update News
    console.log(`3️⃣  Testing PATCH /news/${createdId} (Update)...`);
    try {
        const formData = new FormData();
        formData.append('title', 'Updated News Title');
        formData.append('category', 'Updated Category');

        const res = await fetch(`${BASE_URL}/news/${createdId}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${AUTH_SECRET}` },
            body: formData
        });

        if (res.ok) {
            const json = await res.json() as any;
            console.log('✅ Updated Title:', json.data.title);
            console.log('✅ Updated Category:', json.data.category);
            console.log('✅ Updated By:', json.data.updated_by);
        } else {
            console.error('❌ Failed:', res.status, res.statusText);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }

    console.log('\n--------------------------------\n');

    // 4. List News
    console.log('4️⃣  Testing GET /news (List All)...');
    try {
        const res = await fetch(`${BASE_URL}/news`, {
            headers: { 'Authorization': `Bearer ${AUTH_SECRET}` }
        });

        if (res.ok) {
            const json = await res.json() as any;
            console.log(`✅ Found ${json.data.length} news items.`);
        } else {
            console.error('❌ Failed:', res.status, res.statusText);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }

    console.log('\n--------------------------------\n');

    // 5. Delete News
    console.log(`5️⃣  Testing DELETE /news/${createdId} (Delete)...`);
    try {
        const res = await fetch(`${BASE_URL}/news/${createdId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${AUTH_SECRET}` }
        });

        if (res.ok) {
            console.log('✅ Deleted successfully.');
        } else {
            console.error('❌ Failed:', res.status, res.statusText);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testNewsSystem();
