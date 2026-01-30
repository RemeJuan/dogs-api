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
        breed TEXT NOT NULL,
        imageUrl TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `;

    this.databaseService.exec(createTableSQL);
    this.logger.log('Favourites table initialized');
  }

  findAll(): Favourite[] {
    const stmt = this.databaseService.prepare(
      'SELECT * FROM favourites ORDER BY createdAt DESC',
    );
    const rows = stmt.all() as Favourite[];

    return rows.map((row) => ({
      id: row.id,
      breed: row.breed,
      imageUrl: row.imageUrl,
      createdAt: new Date(row.createdAt),
    }));
  }

  create(favourite: Favourite): void {
    const stmt = this.databaseService.prepare(`
      INSERT INTO favourites (id, breed, imageUrl, createdAt)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      favourite.id,
      favourite.breed,
      favourite.imageUrl,
      favourite.createdAt.toISOString(),
    );
  }

  delete(id: string): void {
    const stmt = this.databaseService.prepare(
      'DELETE FROM favourites WHERE id = ?',
    );
    const result = stmt.run(id);

    if (result.changes === 0) {
      this.logger.warn(`Attempted to delete non-existent favourite: ${id}`);
    }
  }

  exists(id: string): boolean {
    const stmt = this.databaseService.prepare(
      'SELECT COUNT(*) as count FROM favourites WHERE id = ?',
    );
    const result = stmt.get(id) as { count: number };
    return result.count > 0;
  }

  deleteAll(): void {
    this.databaseService.exec('DELETE FROM favourites');
  }
}
