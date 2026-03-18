import crypto from 'crypto';

/**
 * Script to manually decode encryption from CAD API
 * Expected format from CAD API: base64(IV):base64(Ciphertext)
 * Encryption mechanism: AES-256-CBC
 */

// --- 1. SET YOUR VARIABLES HERE ---
// The raw data from the server (e.g., from Postman)
const encryptedData = "AYuqvq8f/cP5Rkv4Qi6SRQ==:8d53becrybDVdz6WT1UFB/zdQAyKVyOIanYQ3FBLPsHRvxIHZL5EM/0hIchVvF0mVg0Qfh17SN+tzuPMeoTF5stA+6vDBTMykIDHBBF3op9usqxcxBzJKzdMSfQUt73gsDvxTa4AMM+XM9XCve2tDx6eepAmRQ3Ukwer+K7hHtLftS9JTpYgmET3oKy3budIaYCwVUH6kRWYM/1XGQC5YzQ8S5H2pNMT1DfdX25ATiDiyHRB2LgesN6VlfBlUlEpuca5CrUHRhScXsOO49/TOAcO4qPs2H/rV4/4YWg7qtND4eMT1ssNOhjnN5wGQTRmxb0FkPl3aMrSr0ezY34FBXWAnH+8YvGc2WUbL42CzO85jihhq/vXhrkm5Ct3Q9s2NeUOwys57b9MGfNygZ9TXBDQHi7pBSTowll16miWUTd4mxDX3diQuYVz2OqlIfRR4YjTsZIdVfV/yR7R0kJs+LCcZRpnBNn1FRmalxKJ4DATL77awRST4/JpSRV9QBZnnYfevfhIr6rKIkCdPJVs/014QJMoYVaGovFlWeG0aJdF5XuBEFrFiTG20PtoqR0ujW5xTTGcUJHooRAKO1i9yFQBMNSotiMy6zhz3oSRm44zMLAUb2ZQnDp1Vljlkzgf69DEjz61B6AC4S/R/AdK7LLV6dwIb6zfFDEA43/tvMhxES9MMVlXXVjy7xz/1Eg+F0Ib+dSzk95b5/C6U6SqLBZIhlxonC0rZmn6dFMDHKvoYhmx2zzXtwmU5u+C4Rifj74qtvcN+WIGNmXgwZMF/VzoXxhM7oan9Gsb/1A1qS6JcpslpTbN0fAFHRSyGxnJI1DOQ7t0X+5RM8XmbwVOHUmLq7CaQ6jw9/WLs1BmpQv/qxSKKMGafRqxv/0QLn/2xHr0K+bK+CsAj4qnkxCbw3ZEQaWZcnhU6LDTcqTaq6EYzDZI3UPMDmEE9KMfA82xUpJFpeKDlKBxz7aX8vwESkqii8pdb1OHhZwfeHAVj2MUUKttgh9sMfpWPC9oZm4KOzhlOqxIPBtC8p7GVDq+kYzCzYHYKNJ19Puq68DVz4RwPDCUIDAPc9pzVQD4idhGksKxHixE+bDh/jMgZg66uPAuhPtRwtwq7JGUD7DYRBC4yO+h2SFFCaVtGQIdPcuToCXmK4XWoCcz5mbiDZQv5IW+Bm2fdeftJQnBtOVkq07zCF7Z0Yu+/OT6UEghSLDHGT603VxTrHDDCvn9w732JYhpyg0pCKU7u31tCX3zZ7ExtntHNrKaOGugxuxq2F2sfAnkwSZ8UmkZCfk2sD+8PZ6GXWaLP4yiJgEQezP9QBJFVsb2+/m2651cFigWBYsy";

// The encrypt_key returned during the login step
const encryptKeyBase64 = "Qg3dIlhWeTQmX7VaebuO5eX3yealz7hxSqmtNBvkZy4=";

function decodeCadData() {
    console.log("Starting decode process...\n");

    // 1. Separate IV and Ciphertext by colon
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
        console.error("❌ Invalid format! Expected IV:Ciphertext separated by a colon.");
        return;
    }

    const ivBase64 = parts[0];
    const ciphertextBase64 = parts[1];

    // 2. Base64 decode to binary buffers
    const iv = Buffer.from(ivBase64, 'base64');
    const ciphertext = Buffer.from(ciphertextBase64, 'base64');
    const key = Buffer.from(encryptKeyBase64, 'base64');

    console.log(`[Info] IV Length: ${iv.length} bytes`);
    console.log(`[Info] Key Length: ${key.length} bytes (Expected 32 for AES-256)`);

    try {
        // 3. Decrypt using openssl_decrypt equivalent (AES-256-CBC, raw data)
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

        let decrypted = decipher.update(ciphertext);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        const decryptedString = decrypted.toString('utf8');
        console.log("\n✅ Decryption Successful!");
        console.log("----------------------------------------");

        // 4. Try parsing as JSON
        try {
            const jsonObj = JSON.parse(decryptedString);
            console.log("\nResult as JSON Object:");
            console.dir(jsonObj, { depth: null, colors: true });
        } catch (jsonErr) {
            console.warn("\n⚠️ Decrypted data is not valid JSON. Showing raw string:");
            console.log(decryptedString);
        }

    } catch (err: any) {
        console.error("\n❌ Decryption Failed!");
        console.error("Error message:", err.message);
        console.error("Make sure your encrypt_key and encryptedData are exactly correct.");
    }
}

// Run the function
decodeCadData();
