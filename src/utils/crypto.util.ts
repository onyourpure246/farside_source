import crypto from 'crypto';

/**
 * Creates a SHA-256 hash of a PID (National ID)
 * This is a one-way operation used for securely storing and comparing PIDs.
 */
export function hashPID(pid: string): string {
    // If it's already a 64-character hex string, it might already be hashed
    // But safely, we just hash whatever is provided.
    // In our specific case, we expect a 13-digit string.
    return crypto.createHash('sha256').update(pid.trim()).digest('hex');
}

/**
 * Masks a PID for safe display or fallbacks (e.g., 1-XXXX-XXXXX-12-3)
 */
export function maskPID(pid: string): string {
    const cleanPid = pid.trim();
    if (!/^\d{13}$/.test(cleanPid)) {
        return cleanPid; // Return as-is if it doesn't match a 13-digit PID format
    }

    // Original: 1 234 56789 01 2 3
    // Masked:   1-XXXX-XXXXX-12-3
    const first = cleanPid.substring(0, 1);
    const last3 = cleanPid.substring(10);
    return `${first}-XXXX-XXXXX-${last3.substring(0, 2)}-${last3.substring(2)}`;
}
