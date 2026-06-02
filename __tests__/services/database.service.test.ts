import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initializeDatabase, getDatabase, testConnection, closeDatabase, query, queryOne, execute, DatabaseConfig } from '../../src/services/database.service';
import mysql from 'mysql2/promise';

// Mock mysql2/promise
vi.mock('mysql2/promise', () => {
  const mPool = {
    query: vi.fn(),
    execute: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
  };
  return {
    default: {
      createPool: vi.fn(() => mPool),
    },
  };
});

describe('Database Service', () => {
  const mockConfig: DatabaseConfig = {
    host: 'localhost',
    port: 3306,
    user: 'test_user',
    password: 'test_password',
    database: 'test_db',
  };

  beforeEach(async () => {
    // Reset modules and mocks before each test
    vi.clearAllMocks();
    await closeDatabase();
  });

  describe('initializeDatabase', () => {
    it('should create a pool with the correct configuration', () => {
      const pool = initializeDatabase(mockConfig);
      expect(mysql.createPool).toHaveBeenCalledWith(expect.objectContaining({
        host: mockConfig.host,
        user: mockConfig.user,
        database: mockConfig.database,
      }));
      expect(pool).toBeDefined();
    });

    it('should return the existing pool if already initialized', () => {
      const pool1 = initializeDatabase(mockConfig);
      const pool2 = initializeDatabase(mockConfig);
      
      // createPool should only be called once
      expect(mysql.createPool).toHaveBeenCalledTimes(1);
      expect(pool1).toBe(pool2);
    });
  });

  describe('getDatabase', () => {
    it('should throw an error if called before initialization', () => {
      expect(() => getDatabase()).toThrow('Database not initialized');
    });

    it('should return the pool if initialized', () => {
      initializeDatabase(mockConfig);
      const pool = getDatabase();
      expect(pool).toBeDefined();
    });
  });

  describe('testConnection', () => {
    it('should return true if connection is successful', async () => {
      initializeDatabase(mockConfig);
      const pool = getDatabase() as any;
      pool.query.mockResolvedValueOnce([[], []]); // Mock successful query

      const result = await testConnection();
      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should throw error if connection fails', async () => {
      initializeDatabase(mockConfig);
      const pool = getDatabase() as any;
      const error = new Error('Connection failed');
      pool.query.mockRejectedValueOnce(error);

      await expect(testConnection()).rejects.toThrow('Connection failed');
    });
  });

  describe('query methods', () => {
    beforeEach(() => {
      initializeDatabase(mockConfig);
    });

    it('query() should execute sql and return rows', async () => {
      const pool = getDatabase() as any;
      const mockRows = [{ id: 1, name: 'test' }];
      pool.execute.mockResolvedValueOnce([mockRows, []]);

      const result = await query('SELECT * FROM test');
      expect(result).toEqual(mockRows);
      expect(pool.execute).toHaveBeenCalledWith('SELECT * FROM test', undefined);
    });

    it('queryOne() should return the first row', async () => {
      const pool = getDatabase() as any;
      const mockRows = [{ id: 1 }, { id: 2 }];
      pool.execute.mockResolvedValueOnce([mockRows, []]);

      const result = await queryOne('SELECT * FROM test LIMIT 1');
      expect(result).toEqual({ id: 1 });
    });

    it('queryOne() should return null if no rows', async () => {
      const pool = getDatabase() as any;
      pool.execute.mockResolvedValueOnce([[], []]);

      const result = await queryOne('SELECT * FROM test LIMIT 1');
      expect(result).toBeNull();
    });

    it('execute() should execute sql and return result header', async () => {
      const pool = getDatabase() as any;
      const mockResultHeader = { insertId: 1, affectedRows: 1 };
      pool.execute.mockResolvedValueOnce([mockResultHeader, []]);

      const result = await execute('INSERT INTO test (name) VALUES (?)', ['test']);
      expect(result).toEqual(mockResultHeader);
    });
  });
});
