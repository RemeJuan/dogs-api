import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly cacheEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.cacheEnabled =
      this.configService.get<string>('CACHE_ENABLED', 'true') === 'true';
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    if (!this.cacheEnabled) {
      return;
    }
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data: value, expiresAt });
  }

  get<T>(key: string): T | null {
    if (!this.cacheEnabled) {
      return null;
    }

    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
