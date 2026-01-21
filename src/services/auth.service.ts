import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CommonUser, SafeUser } from '../types';
import { query, queryOne, execute } from './database.service';

/**
 * Authentication Service
 * Handles user authentication, password hashing/verification, and JWT token generation
 */
export class AuthService {
	constructor(private jwtSecret: string) {}

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
	generateToken(user: SafeUser): string {
		const payload = {
			userId: user.id,
			username: user.username,
			isadmin: user.isadmin,
		};

		return jwt.sign(payload, this.jwtSecret, {
			expiresIn: '24h',
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
				isadmin: number;
			};

			// Fetch user from database to ensure user still exists
			const user = await this.getUserById(decoded.userId);
			return user;
		} catch (error) {
			console.error('Token verification error:', error);
			return null;
		}
	}

	/**
	 * Convert CommonUser to SafeUser (remove password)
	 */
	private toSafeUser(user: CommonUser): SafeUser {
		const { password, ...safeUser } = user;
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
		return await queryOne<CommonUser>(
			'SELECT * FROM common_users WHERE username = ?',
			[username]
		);
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
		jobtitle?: string,
		isadmin: number = 0
	): Promise<SafeUser> {
		// Check if username already exists
		const existing = await this.getUserByUsername(username);
		if (existing) {
			throw new Error('Username already exists');
		}

		const hashedPassword = await this.hashPassword(password);

		const result = await execute(
			`INSERT INTO common_users (username, password, displayname, firstname, lastname, jobtitle, isadmin, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
			[
				username,
				hashedPassword,
				displayname || null,
				firstname || null,
				lastname || null,
				jobtitle || null,
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
	 * Login user with username and password
	 */
	async login(username: string, password: string): Promise<{ token: string; user: SafeUser } | null> {
		const user = await this.getUserByUsername(username);
		if (!user) {
			return null;
		}

		const isValid = await this.verifyPassword(password, user.password);
		if (!isValid) {
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
	async updateProfile(
		userId: number,
		updates: {
			displayname?: string;
			firstname?: string;
			lastname?: string;
			jobtitle?: string;
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
