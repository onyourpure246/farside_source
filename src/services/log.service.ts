
import { execute } from './database.service';
import type { ResultSetHeader } from 'mysql2';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export class LogService {
    /**
     * Log a general activity (INFO level)
     */
    async logActivity(
        userId: number | null,
        action: string,
        resourceType: string,
        resourceId: string | number | null,
        details: any = null,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        await this.insertLog('INFO', userId, action, resourceType, resourceId, details, ipAddress, userAgent);
    }

    /**
     * Log an error (ERROR level)
     */
    async logError(
        userId: number | null,
        action: string,
        error: unknown,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        let details = '';
        if (error instanceof Error) {
            details = JSON.stringify({
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        } else {
            details = String(error);
        }

        await this.insertLog('ERROR', userId, action, 'SYSTEM', null, details, ipAddress, userAgent);
    }

    /**
    * Log a warning (WARN level)
    */
    async logWarning(
        userId: number | null,
        action: string,
        message: string,
        resourceType: string = 'SYSTEM',
        resourceId: string | number | null = null,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        await this.insertLog('WARN', userId, action, resourceType, resourceId, message, ipAddress, userAgent);
    }

    private async insertLog(
        level: LogLevel,
        userId: number | null,
        action: string,
        resourceType: string,
        resourceId: string | number | null,
        details: any,
        ipAddress: string | null,
        userAgent: string | null
    ): Promise<void> {
        try {
            const finalDetails = typeof details === 'object' && details !== null ? JSON.stringify(details) : details;
            const finalResourceId = resourceId !== null ? String(resourceId) : null;

            const query = `
                INSERT INTO common_activity_logs 
                (user_id, level, action, resource_type, resource_id, details, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            await execute(query, [
                userId,
                level,
                action,
                resourceType,
                finalResourceId,
                finalDetails,
                ipAddress,
                userAgent
            ]);
        } catch (err) {
            // Failsafe: If logging fails, we shouldn't crash the app, but output to console
            console.error('[LogService] FAILED TO INSERT LOG:', err);
        }
    }
}
