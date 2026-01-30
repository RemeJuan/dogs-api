import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../services/database.service';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('DatabaseService', () => {
  let service: DatabaseService;
  const testDbPath = join(process.cwd(), 'data', 'test.db');

  const mockConfigService = {
    get: jest.fn().mockReturnValue(testDbPath),
  };

  beforeEach(async () => {
    // Clean up test database if it exists
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
    
    // Clean up test database
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialization', () => {
    it('should create database file on init', () => {
      expect(existsSync(testDbPath)).toBe(true);
    });

    it('should create data directory if it does not exist', () => {
      const dataDir = join(process.cwd(), 'data');
      expect(existsSync(dataDir)).toBe(true);
    });
  });

  describe('exec', () => {
    it('should execute SQL statements', () => {
      const sql = `
        CREATE TABLE IF NOT EXISTS test_table (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL
        )
      `;

      expect(() => service.exec(sql)).not.toThrow();
      
      // Verify table was created
      const stmt = service.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='test_table'");
      const result = stmt.get();
      expect(result).toBeDefined();
    });

    it('should handle multiple statements', () => {
      const sql = `
        CREATE TABLE users (id INTEGER PRIMARY KEY);
        CREATE TABLE posts (id INTEGER PRIMARY KEY);
      `;

      expect(() => service.exec(sql)).not.toThrow();
    });
  });

  describe('prepare', () => {
    beforeEach(() => {
      service.exec(`
        CREATE TABLE test_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          value TEXT NOT NULL
        )
      `);
    });

    it('should prepare and execute INSERT statement', () => {
      const stmt = service.prepare('INSERT INTO test_data (value) VALUES (?)');
      const result = stmt.run('test-value');
      
      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBeDefined();
    });

    it('should prepare and execute SELECT statement', () => {
      // Insert test data
      service.prepare('INSERT INTO test_data (value) VALUES (?)').run('test-1');
      service.prepare('INSERT INTO test_data (value) VALUES (?)').run('test-2');
      
      // Query data
      const stmt = service.prepare('SELECT * FROM test_data WHERE value = ?');
      const result = stmt.get('test-1');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('value', 'test-1');
    });

    it('should prepare and execute SELECT all', () => {
      // Insert multiple rows
      service.prepare('INSERT INTO test_data (value) VALUES (?)').run('value-1');
      service.prepare('INSERT INTO test_data (value) VALUES (?)').run('value-2');
      service.prepare('INSERT INTO test_data (value) VALUES (?)').run('value-3');
      
      const stmt = service.prepare('SELECT * FROM test_data');
      const results = stmt.all();
      
      expect(results).toHaveLength(3);
    });

    it('should prepare and execute UPDATE statement', () => {
      // Insert and update
      const insert = service.prepare('INSERT INTO test_data (value) VALUES (?)');
      insert.run('original');
      
      const update = service.prepare('UPDATE test_data SET value = ? WHERE value = ?');
      const result = update.run('updated', 'original');
      
      expect(result.changes).toBe(1);
    });

    it('should prepare and execute DELETE statement', () => {
      // Insert and delete
      service.prepare('INSERT INTO test_data (value) VALUES (?)').run('to-delete');
      
      const deleteStmt = service.prepare('DELETE FROM test_data WHERE value = ?');
      const result = deleteStmt.run('to-delete');
      
      expect(result.changes).toBe(1);
    });
  });

  describe('transaction', () => {
    beforeEach(() => {
      service.exec(`
        CREATE TABLE accounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          balance INTEGER NOT NULL
        )
      `);
    });

    it('should execute transaction successfully', () => {
      const result = service.transaction(() => {
        service.prepare('INSERT INTO accounts (balance) VALUES (?)').run(100);
        service.prepare('INSERT INTO accounts (balance) VALUES (?)').run(200);
        return 'success';
      });

      expect(result).toBe('success');
      
      const accounts = service.prepare('SELECT * FROM accounts').all();
      expect(accounts).toHaveLength(2);
    });

    it('should rollback on error', () => {
      try {
        service.transaction(() => {
          service.prepare('INSERT INTO accounts (balance) VALUES (?)').run(100);
          throw new Error('Intentional error');
        });
      } catch (error) {
        // Expected error
      }

      const accounts = service.prepare('SELECT * FROM accounts').all();
      expect(accounts).toHaveLength(0); // Transaction rolled back
    });

    it('should handle complex transaction', () => {
      service.transaction(() => {
        const insert = service.prepare('INSERT INTO accounts (balance) VALUES (?)');
        insert.run(1000);
        insert.run(2000);
        
        service.prepare('UPDATE accounts SET balance = balance - 100 WHERE balance = 1000').run();
        service.prepare('UPDATE accounts SET balance = balance + 100 WHERE balance = 2000').run();
      });

      const accounts = service.prepare('SELECT balance FROM accounts ORDER BY balance').all() as any[];
      expect(accounts[0].balance).toBe(900);
      expect(accounts[1].balance).toBe(2100);
    });
  });

  describe('lifecycle', () => {
    it('should close database connection on destroy', () => {
      service.onModuleDestroy();
      
      // After destroy, operations should fail
      expect(() => service.prepare('SELECT 1')).toThrow();
    });
  });
});