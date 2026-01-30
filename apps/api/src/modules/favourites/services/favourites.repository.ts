import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from '@api/modules/database/services/database.service';
import { Favourite } from '@dogs-api/shared-interfaces';

@Injectable()
export class FavouritesRepository implements OnModuleInit {
  private readonly logger = new Logger(FavouritesRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  onModuleInit() {
    this.initializeTable();
  }

  private initializeTable(): void {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS favourites (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        breed TEXT NOT NULL,
        imageUrl TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        UNIQUE(userId, breed, imageUrl)
      )
    `;

    this.databaseService.exec(createTableSQL);

    this.databaseService.exec(`
      CREATE INDEX IF NOT EXISTS idx_favourites_userId
      ON favourites(userId)
    `);

    this.logger.log('Favourites table initialized');
  }

  findAllByUser(userId: number): Favourite[] {
    const stmt = this.databaseService.prepare(
      'SELECT * FROM favourites WHERE userId = ? ORDER BY createdAt DESC',
    );
    const rows = stmt.all(userId) as Array<Favourite & { userId: number }>;

    return rows.map((row) => ({
      id: row.id,
      breed: row.breed,
      imageUrl: row.imageUrl,
      createdAt: new Date(row.createdAt),
    }));
  }

  create(userId: number, favourite: Favourite): void {
    const stmt = this.databaseService.prepare(`
      INSERT INTO favourites (id, userId, breed, imageUrl, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      favourite.id,
      userId,
      favourite.breed,
      favourite.imageUrl,
      favourite.createdAt.toISOString(),
    );
  }

  deleteByUserAndId(userId: number, id: string): boolean {
    const stmt = this.databaseService.prepare(
      'DELETE FROM favourites WHERE userId = ? AND id = ?',
    );
    const result = stmt.run(userId, id);

    if (result.changes === 0) {
      this.logger.warn(
        `Attempted to delete non-existent favourite for user ${userId}: ${id}`,
      );
      return false;
    }
    return true;
  }

  existsByUserAndId(userId: number, id: string): boolean {
    const stmt = this.databaseService.prepare(
      'SELECT COUNT(*) as count FROM favourites WHERE userId = ? AND id = ?',
    );
    const result = stmt.get(userId, id) as { count: number };
    return result.count > 0;
  }

  existsByUserBreedAndImage(
    userId: number,
    breed: string,
    imageUrl: string,
  ): boolean {
    const stmt = this.databaseService.prepare(
      'SELECT COUNT(*) as count FROM favourites WHERE userId = ? AND breed = ? AND imageUrl = ?',
    );
    const result = stmt.get(userId, breed, imageUrl) as { count: number };
    return result.count > 0;
  }

  deleteAll(): void {
    this.databaseService.exec('DELETE FROM favourites');
  }
}
