import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '@api/modules/database/services/database.service';
import { User } from '@dogs-api/shared-interfaces';

interface AuthSession {
  userId: number;
  accessToken: string;
  refreshToken: string;
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
        userId INTEGER PRIMARY KEY UNIQUE,
        accessToken TEXT NOT NULL,
        refreshToken TEXT NOT NULL,
        userData TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `;

    this.databaseService.exec(createTableSQL);

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
      (userId, accessToken, refreshToken, userData, expiresAt, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      userData.id,
      accessToken,
      refreshToken,
      JSON.stringify(userData),
      expiresAt.toISOString(),
      now.toISOString(),
    );
  }

  getSession(userId: number): User | null {
    const stmt = this.databaseService.prepare(`
      SELECT * FROM auth_sessions
      WHERE userId = ? AND expiresAt > datetime('now')
    `);

    const session = stmt.get(userId) as AuthSession | undefined;

    if (!session) {
      return null;
    }

    return JSON.parse(session.userData) as User;
  }

  deleteSession(userId: number): void {
    const stmt = this.databaseService.prepare(
      'DELETE FROM auth_sessions WHERE userId = ?',
    );
    stmt.run(userId);
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

  getSessionByRefreshToken(refreshToken: string): AuthSession | null {
    const stmt = this.databaseService.prepare(`
      SELECT * FROM auth_sessions 
      WHERE refreshToken = ? AND expiresAt > datetime('now')
    `);
    return (stmt.get(refreshToken) as AuthSession | undefined) || null;
  }

  updateSessionTokens(
    userId: number,
    newAccessToken: string,
    newRefreshToken: string,
    expiresInMins: number = this.DEFAULT_TTL_MINUTES,
  ): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInMins * 60 * 1000);

    const stmt = this.databaseService.prepare(`
      UPDATE auth_sessions 
      SET accessToken = ?, refreshToken = ?, expiresAt = ?
      WHERE userId = ?
    `);

    stmt.run(newAccessToken, newRefreshToken, expiresAt.toISOString(), userId);
  }
}
