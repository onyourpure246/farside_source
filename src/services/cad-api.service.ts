import crypto from 'crypto';
import { CadLoginResponse, CadExecuteResponse } from '../types';

export class CadApiService {
    private getConfigs() {
        return {
            baseUrl: process.env.CAD_API_BASE_URL,
            apiUsername: process.env.CAD_API_USERNAME,
            apiPassword: process.env.CAD_API_PASSWORD,
        };
    }

    constructor() {}

    // In-memory token cache to prevent logging in every single request
    private currentToken: string | null = null;
    private currentEncryptKey: string | null = null;
    private tokenExpiryTime: number | null = null;

    /**
     * Step 1: Login to get Access Token & Encrypt Key
     */
    private async login(): Promise<void> {
        // Check if token is still valid (give 2 minutes buffer)
        if (this.currentToken && this.tokenExpiryTime && Date.now() < this.tokenExpiryTime - 120000) {
            return; 
        }

        const config = this.getConfigs();
        if (!config.baseUrl || !config.apiUsername || !config.apiPassword) {
            throw new Error("CAD API Credentials are not fully configured in .env!");
        }

        const payload = {
            username: config.apiUsername,
            password: config.apiPassword
        };

        const res = await fetch(`${config.baseUrl}/login.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error(`CAD API Login HTTP error: ${res.status}`);
        }

        const data = (await res.json()) as CadLoginResponse;

        if (!data.accessToken || !data.encrypt_key) {
            throw new Error(`CAD API Login failed: Missing keys in response`);
        }

        this.currentToken = data.accessToken;
        this.currentEncryptKey = data.encrypt_key;
        // set expiry time (expires_in is in seconds)
        this.tokenExpiryTime = Date.now() + (data.expires_in * 1000);
    }

    /**
     * Step 2 & 3: Fetch Data and Decrypt using AES-256-CBC
     */
    async executeEndpoint<T>(endpoint: string, params: Record<string, string> = {}, limit: number = 50, page: number = 1): Promise<T | null> {
        // Ensure we are logged in
        await this.login();

        if (!this.currentToken || !this.currentEncryptKey) {
            throw new Error("Missing authentication keys");
        }

        const bodyParams = new URLSearchParams();
        bodyParams.append('endpoint', endpoint);
        bodyParams.append('limit', limit.toString());
        bodyParams.append('page', page.toString());
        
        // Append any extra query parameters required by the endpoint
        for (const [key, value] of Object.entries(params)) {
            bodyParams.append(key, value);
        }

        const config = this.getConfigs();
        if (!config.baseUrl) {
            throw new Error("CAD API Base URL is not configured in .env!");
        }

        const res = await fetch(`${config.baseUrl}/execute.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${this.currentToken}`
            },
            body: bodyParams.toString()
        });

        if (!res.ok) {
            throw new Error(`CAD API Execute HTTP error: ${res.status}`);
        }

        const responseData = (await res.json()) as CadExecuteResponse;

        if (responseData.status !== true || !responseData.data) {
            console.error('[CAD API] Execute Target Failed: ', responseData);
            return null;
        }

        const encryptedData = responseData.data;
        const decryptedJsonString = this.decryptData(encryptedData, this.currentEncryptKey);
        
        try {
            return JSON.parse(decryptedJsonString) as T;
        } catch (e) {
            console.error('[CAD API] JSON Parse failed after decryption', e);
            return null;
        }
    }

    /**
     * Decrypt AES-256-CBC Payload
     */
    private decryptData(encryptedString: string, encryptKeyBase64: string): string {
        const parts = encryptedString.split(':');
        if (parts.length !== 2) {
            throw new Error("Invalid encrypted format. Expected IV:Ciphertext");
        }

        const iv = Buffer.from(parts[0], 'base64');
        const ciphertext = Buffer.from(parts[1], 'base64');
        const key = Buffer.from(encryptKeyBase64, 'base64');

        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

        let decrypted = decipher.update(ciphertext);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
    }
}

// Export a singleton instance
export const cadApiService = new CadApiService();
