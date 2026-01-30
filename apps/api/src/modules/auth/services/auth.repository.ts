import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from '@api/modules/database/services/database.service';
import { User } from '@dogs-api/shared-interfaces';

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  userId: number;
  userData: string; // JSON string
  expiresAt: string; // ISO date string
  createdAt: string; // ISO date string
}

@Injectable()
export class AuthRepository implements OnModuleInit {
  private readonly logger = new Logger(AuthRepository.name);
  private readonly DEFAULT_TTL_MINUTES = 59;

  constructor(private readonly databaseService: DatabaseService) {}

  onModuleInit() {
    this.initializeTable();
    this.cleanupExpiredTokens();
  }

  private initializeTable(): void {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS auth_sessions (
        accessToken TEXT PRIMARY KEY,
        refreshToken TEXT NOT NULL,
        userId INTEGER NOT NULL,
        userData TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `;

    this.databaseService.exec(createTableSQL);

    // Create index for faster cleanup queries
    this.databaseService.exec(`
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiresAt 
      ON auth_sessions(expiresAt)
    `);

    this.logger.log('Auth sessions table initialized');
  }

  saveSession(
    accessToken: string,
    refreshToken: string,
    userData: User,
    expiresInMins: number = this.DEFAULT_TTL_MINUTES,
  ): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInMins * 60 * 1000);

    const stmt = this.databaseService.prepare(`
      INSERT OR REPLACE INTO auth_sessions 
      (accessToken, refreshToken, userId, userData, expiresAt, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      accessToken,
      refreshToken,
      userData.id,
      JSON.stringify(userData),
      expiresAt.toISOString(),
      now.toISOString(),
    );
  }

  getSession(accessToken: string): User | null {
    const stmt = this.databaseService.prepare(`
      SELECT * FROM auth_sessions 
      WHERE accessToken = ? AND expiresAt > datetime('now')
    `);

    const session = stmt.get(accessToken) as AuthSession | undefined;

    if (!session) {
      return null;
    }

    return JSON.parse(session.userData) as User;
  }

  deleteSession(accessToken: string): void {
    const stmt = this.databaseService.prepare(
      'DELETE FROM auth_sessions WHERE accessToken = ?',
    );
    stmt.run(accessToken);
  }

  deleteAllSessions(): void {
    this.databaseService.exec('DELETE FROM auth_sessions');
  }

  cleanupExpiredTokens(): void {
    const stmt = this.databaseService.prepare(`
      DELETE FROM auth_sessions WHERE expiresAt <= datetime('now')
    `);

    const result = stmt.run();

    if (result.changes > 0) {
      this.logger.log(`Cleaned up ${result.changes} expired token(s)`);
    }
  }

  sessionExists(accessToken: string): boolean {
    const stmt = this.databaseService.prepare(`
      SELECT COUNT(*) as count FROM auth_sessions 
      WHERE accessToken = ? AND expiresAt > datetime('now')
    `);
    const result = stmt.get(accessToken) as { count: number };
    return result.count > 0;
  }
}
