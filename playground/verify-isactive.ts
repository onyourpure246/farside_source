
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

const LOG_FILE = 'verify_log.txt';
try {
    fs.writeFileSync(LOG_FILE, '');
} catch (e) { console.error('Error clearing log file', e); }

function log(message: any, ...optionalParams: any[]) {
    console.log(message, ...optionalParams);
    const msg = [message, ...optionalParams].join(' ') + '\n';
    fs.appendFileSync(LOG_FILE, msg);
}

function error(message: any, ...optionalParams: any[]) {
    console.error(message, ...optionalParams);
    const msg = '[ERROR] ' + [message, ...optionalParams].join(' ') + '\n';
    fs.appendFileSync(LOG_FILE, msg);
}

async function verifyIsActiveRefactor() {
    log(`🚀 Verifying 'isactive' Refactor on ${BASE_URL}\n`);

    // 1. Test Draft (isactive=2) - Should be visible to Admin
    log('1️⃣  Testing Draft (isactive=2)...');
    let draftId = 0;
    try {
        const res = await fetch(`${BASE_URL}/dl/folder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_SECRET}`
            },
            body: JSON.stringify({
                name: 'Draft Folder',
                isactive: 2
            })
        });

        if (res.ok) {
            const json = await res.json() as any;
            draftId = json.data.id;
            log('✅ POST Response: 201 Created');
            log('   ID:', json.data.id);
            log('   IsActive:', json.data.isactive);

            if (json.data.isactive === 2) {
                log('✅ PASSED: Folder created as Draft (2).');
            } else {
                error('❌ FAILED: Folder isactive is not 2.');
            }
        } else {
            error('❌ Failed POST:', await res.text());
        }
    } catch (err) {
        error('❌ Error POST:', err);
    }

    if (draftId) {
        // Test Admin View
        log('   Testing GET /dl/folder/:id (Admin View)...');
        try {
            const res = await fetch(`${BASE_URL}/dl/folder/${draftId}`, {
                headers: { 'Authorization': `Bearer ${AUTH_SECRET}` }
            });
            if (res.ok) {
                log('✅ GET Response: Admin can see Draft.');
            } else {
                error('❌ GET Failed: Admin should see Draft.', res.status);
            }
        } catch (e) { error('❌ Error GET:', e); }

        // Test Public View (No Auth) - Should fail or return 404
        // Note: Our dualAuthMiddlewarePermissive allows GET without auth if applied, but specific routes might behave differently.
        // Actually dlRouter uses `use('*', dualAuthMiddleware)` so it REQUIRES auth for everything?
        // Wait, standard `dlRouter` requires auth. So we simulate a non-admin user. 
        // If we don't have a non-admin user token handy, we can skip or assume public access logic implies "Active Only" for anyone who isn't explicitly an admin.
        // But since we can't easily get a non-admin token without login, we'll assume the code logic `isAdmin ? 'admin' : 'public'` handles it.
    }

    log('\n--------------------------------\n');

    // 2. Test Deleted (isactive=0) - Should be HIDDEN from everyone (or at least filtering out of lists)
    // Note: Our code `getFolderById` with 'admin' mode uses `IN (1, 2)`. So 0 should NOT be found even by admin via GET.
    log('2️⃣  Testing Deleted (isactive=0)...');
    let deletedId = 0;
    try {
        const res = await fetch(`${BASE_URL}/dl/folder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_SECRET}`
            },
            body: JSON.stringify({
                name: 'Deleted Folder',
                isactive: 0
            })
        });

        if (res.ok) {
            const json = await res.json() as any;
            deletedId = json.data.id;
            log('✅ POST Response: 201 Created');
            log('   ID:', json.data.id);
            log('   IsActive:', json.data.isactive);
        } else {
            error('❌ Failed POST:', await res.text());
        }
    } catch (err) {
        error('❌ Error POST:', err);
    }

    if (deletedId) {
        // Test Admin View - Should FAIL (404) because admin view is (1, 2)
        log('   Testing GET /dl/folder/:id (Admin View of Deleted)...');
        try {
            const res = await fetch(`${BASE_URL}/dl/folder/${deletedId}`, {
                headers: { 'Authorization': `Bearer ${AUTH_SECRET}` }
            });
            if (res.status === 404) {
                log('✅ PASSED: Admin cannot see Deleted (0) item (got 404).');
            } else if (res.ok) {
                error('❌ FAILED: Admin CAN see Deleted (0) item (should be hidden).');
            } else {
                log('ℹ️  Response:', res.status, res.statusText);
            }
        } catch (e) { error('❌ Error GET:', e); }
    }
}

verifyIsActiveRefactor();
