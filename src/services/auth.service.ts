import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CommonUser, SafeUser } from '../types';
import { query, queryOne, execute } from './database.service';
import { cadApiService } from './cad-api.service';
import { hashPID, maskPID } from '../utils/crypto.util';
/**
 * Authentication Service
 * Handles user authentication, password hashing/verification, and JWT token generation
 */
export class AuthService {
	constructor(private jwtSecret: string) { }

	/**
	 * Hash password using bcrypt
	 */
	private async hashPassword(password: string): Promise<string> {
		const saltRounds = 10;
		return await bcrypt.hash(password, saltRounds);
	}

	/**
	 * Verify password against hash
	 */
	async verifyPassword(password: string, hash: string): Promise<boolean> {
		return await bcrypt.compare(password, hash);
	}

	/**
	 * Generate JWT token
	 */
	/**
	 * Generate JWT token
	 */
	generateToken(user: SafeUser): string {
		const payload = {
			userId: user.id,
			username: user.username,
			role: user.role, // Added role
			isadmin: user.isadmin, // Kept for backward compatibility
		};

		return jwt.sign(payload, this.jwtSecret, {
			expiresIn: '2h',
		});
	}

	/**
	 * Verify JWT token
	 */
	async verifyToken(token: string): Promise<SafeUser | null> {
		try {
			const decoded = jwt.verify(token, this.jwtSecret) as {
				userId: number;
				username: string;
				role: string;
				isadmin: number;
			};

			// Fetch user from database to ensure user still exists
			const user = await this.getUserById(decoded.userId);

			// Strict check: if user is not active, treat token as invalid
			if (user && user.status !== 'active') {
				// console.warn(`Access denied for inactive user: ${user.username}`);
				return null;
			}

			return user;
		} catch (error) {
			console.error('Token verification error:', error);
			return null;
		}
	}

	/**
	 * Convert CommonUser to SafeUser (remove password)
	 * Also masks CID if username is a 13-digit string
	 */
	private toSafeUser(user: CommonUser): SafeUser {
		const { password, ...safeUser } = user;

		// Mask CID if it's 13 digits (for backward compatibility if not migrated yet)
		if (/^\d{13}$/.test(safeUser.username)) {
			safeUser.username = maskPID(safeUser.username);
		}

		return safeUser;
	}

	/**
	 * Get user by ID
	 */
	async getUserById(id: number): Promise<SafeUser | null> {
		const user = await queryOne<CommonUser>(
			'SELECT * FROM common_users WHERE id = ?',
			[id]
		);

		return user ? this.toSafeUser(user) : null;
	}

	/**
	 * Get user by username
	 */
	async getUserByUsername(username: string): Promise<CommonUser | null> {
		let user = await queryOne<CommonUser>(
			'SELECT * FROM common_users WHERE username = ?',
			[username]
		);

		// Auto-heal logic: If a 64-character hash is searched, but only a truncated 50-character hash exists in DB
		if (!user && username.length === 64) {
			const truncatedHash = username.substring(0, 50);
			user = await queryOne<CommonUser>(
				'SELECT * FROM common_users WHERE username = ?',
				[truncatedHash]
			);
			if (user) {
				console.log(`[Auto-Heal] Upgrading truncated hash for user ID ${user.id} to full 64 characters`);
				await execute('UPDATE common_users SET username = ? WHERE id = ?', [username, user.id]);
				user.username = username; // Update object in memory
			}
		}

		return user;
	}

	/**
	 * Create new user
	 */
	async createUser(
		username: string,
		password: string,
		displayname?: string,
		firstname?: string,
		lastname?: string,
		email?: string,
		jobtitle?: string,
		role: string = 'user',
		status: string = 'active',
		isadmin: number = 0
	): Promise<SafeUser> {
		// Check if username already exists
		const existing = await this.getUserByUsername(username);
		if (existing) {
			throw new Error('Username already exists');
		}

		const hashedPassword = await this.hashPassword(password);

		const result = await execute(
			`INSERT INTO common_users (username, password, displayname, firstname, lastname, email, jobtitle, role, status, isadmin, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
			[
				username,
				hashedPassword,
				displayname || null,
				firstname || null,
				lastname || null,
				email || null,
				jobtitle || null,
				role,
				status,
				isadmin,
			]
		);

		const newUser = await this.getUserById(result.insertId);
		if (!newUser) {
			throw new Error('Failed to retrieve created user');
		}

		return newUser;
	}

	/**
	 * Upsert ThaID User
	 * Check Logic:
	 * 1. Check if CID exists in employees table
	 * 2. If valid employee, upsert into common_users
	 */
	async upsertThaIDUser(cid: string): Promise<SafeUser> {
		// Step 1: Check Local DB First (Availability Priority)
		const hashedCid = hashPID(cid);
		const existingUser = await this.getUserByUsername(hashedCid);

		if (existingUser) {
			// CASE A: User exists locally

			// Strict Check: User must be active
			if (existingUser.status !== 'active') {
				throw new Error('Unauthorized: Account is inactive or suspended');
			}

			// 1. Trigger Background Sync (Fire-and-Forget)
			// We do NOT await this, so user gets response immediately
			this.syncUserWithHR(cid, existingUser.id).catch(err => {
				console.error(`[Background Sync] Failed to sync user ${cid}:`, err);
			});

			// 2. Return local user immediately
			return (await this.getUserById(existingUser.id))!;
		}

		// Step 2: User not found locally -> Check CAD API (via cad-api.service)
		// We use the endpoint name and parameter confirmed from testing
		const cadEmployees = await cadApiService.executeEndpoint<any[]>('telephone_by_id', {
			card_id: cid
		});

		if (!cadEmployees || cadEmployees.length === 0) {
			throw new Error('Unauthorized: CID not found in CAD database');
		}

		const employee = cadEmployees[0];

		// CASE B: New User -> Insert
		// Mapping CAD API fields to Farside database structure
		const randomPassword = Math.random().toString(36).slice(-8);

		const displayname = `${employee.t_front || ''}${employee.t_name} ${employee.t_surname}`;
		
		const isSuperAdmin = cid === process.env.SUPER_ADMIN_PID;
		const role = isSuperAdmin ? 'admin' : 'user';
		const isadmin = isSuperAdmin ? 1 : 0;

		if (isSuperAdmin) {
			console.log(`[Auto-Register] Granting SUPER ADMIN rights to CID: ${cid}`);
		}

		return await this.createUser(
			hashedCid, // Using hashed CID for DB storage
			randomPassword,
			displayname,
			employee.t_name,
			employee.t_surname,
			`${maskPID(cid)}@cad.go.th`, // Placeholder with masked PID
			employee.t_position,
			role,
			'active',
			isadmin
		);
	}

	/**
	 * Background Sync: Fetch latest data from HR and update local user
	 * This method should be robust and handle errors internally if possible
	 */
	private async syncUserWithHR(cid: string, userId: number): Promise<void> {
		try {
			const cadEmployees = await cadApiService.executeEndpoint<any[]>('telephone_by_id', {
				card_id: cid
			});

			if (cadEmployees && cadEmployees.length > 0) {
				const employee = cadEmployees[0];

				// Found in CAD -> Update details
				await execute(
					`UPDATE common_users 
                     SET firstname = ?, lastname = ?, jobtitle = ?, updated_at = NOW() 
                     WHERE id = ?`,
					[employee.t_name, employee.t_surname, employee.t_position, userId]
				);
			} else {
				// Not found in HR -> User might have resigned?
				console.warn(`[Background Sync] User ${cid} not found in CAD API. Possible resignation.`);
			}
		} catch (error) {
			console.error(`[Background Sync] Error syncing user ${cid}:`, error);
		}
	}

	/**
	 * Login user with username and password
	 */
	async login(username: string, password: string): Promise<{ token: string; user: SafeUser } | null> {
		const lookupUsername = /^\d{13}$/.test(username.trim()) ? hashPID(username.trim()) : username;
		const user = await this.getUserByUsername(lookupUsername);
		if (!user) {
			return null;
		}

		const isValid = await this.verifyPassword(password, user.password);
		if (!isValid) {
			return null;
		}

		// Check if user is active
		if (user.status !== 'active') {
			console.warn(`Login attempt for inactive user: ${username}`);
			return null;
		}

		const safeUser = this.toSafeUser(user);
		const token = this.generateToken(safeUser);

		return {
			token,
			user: safeUser,
		};
	}

	/**
	 * Update user password
	 */
	async updatePassword(userId: number, newPassword: string): Promise<boolean> {
		const hashedPassword = await this.hashPassword(newPassword);

		const result = await execute(
			'UPDATE common_users SET password = ?, updated_at = NOW() WHERE id = ?',
			[hashedPassword, userId]
		);

		return result.affectedRows > 0;
	}

	/**
	 * Update user profile
	 */
	/**
	 * Admin Update User (Role, Status, Profile)
	 */
	async updateUser(
		userId: number,
		updates: {
			displayname?: string;
			firstname?: string;
			lastname?: string;
			jobtitle?: string;
			email?: string;
			role?: string;
			status?: string;
			isadmin?: number;
			password?: string;
		}
	): Promise<SafeUser | null> {
		const fields: string[] = [];
		const values: any[] = [];

		if (updates.displayname !== undefined) {
			fields.push('displayname = ?');
			values.push(updates.displayname);
		}
		if (updates.firstname !== undefined) {
			fields.push('firstname = ?');
			values.push(updates.firstname);
		}
		if (updates.lastname !== undefined) {
			fields.push('lastname = ?');
			values.push(updates.lastname);
		}
		if (updates.jobtitle !== undefined) {
			fields.push('jobtitle = ?');
			values.push(updates.jobtitle);
		}
		if (updates.email !== undefined) {
			fields.push('email = ?');
			values.push(updates.email);
		}
		if (updates.role !== undefined) {
			fields.push('role = ?');
			values.push(updates.role);

			// Automatically sync isadmin based on role
			fields.push('isadmin = ?');
			values.push(updates.role === 'admin' ? 1 : 0);
		} else if (updates.isadmin !== undefined) {
			// Only use manual isadmin if role is NOT being updated
			fields.push('isadmin = ?');
			values.push(updates.isadmin);
		}

		if (updates.status !== undefined) {
			fields.push('status = ?');
			values.push(updates.status);
		}
		if (updates.password !== undefined) {
			const hashedPassword = await this.hashPassword(updates.password);
			fields.push('password = ?');
			values.push(hashedPassword);
		}

		if (fields.length === 0) {
			return this.getUserById(userId);
		}

		fields.push('updated_at = NOW()');
		values.push(userId);

		await execute(
			`UPDATE common_users SET ${fields.join(', ')} WHERE id = ?`,
			values
		);

		return this.getUserById(userId);
	}

	async updateProfile(
		userId: number,
		updates: {
			displayname?: string;
			firstname?: string;
			lastname?: string;
			jobtitle?: string;
			email?: string;
		}
	): Promise<SafeUser | null> {
		// Reuse the more powerful updateUser but limit input scope in route if needed
		// or keep this for self-service profile updates
		return this.updateUser(userId, updates);
	}

	/**
	 * List all users (admin only)
	 */
	async listUsers(): Promise<SafeUser[]> {
		const users = await query<CommonUser>(
			'SELECT * FROM common_users ORDER BY username'
		);

		return users.map(user => this.toSafeUser(user));
	}

	/**
	 * Delete user (admin only)
	 */
	async deleteUser(userId: number): Promise<boolean> {
		const result = await execute(
			'DELETE FROM common_users WHERE id = ?',
			[userId]
		);

		return result.affectedRows > 0;
	}
}
