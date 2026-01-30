import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../services/cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('true'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      const ttl = 60;

      service.set(key, value, ttl);
      const result = service.get(key);

      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', () => {
      const result = service.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should handle different data types', () => {
      service.set('string', 'text', 60);
      service.set('number', 42, 60);
      service.set('boolean', true, 60);
      service.set('array', [1, 2, 3], 60);
      service.set('object', { nested: { value: 'deep' } }, 60);

      expect(service.get('string')).toBe('text');
      expect(service.get('number')).toBe(42);
      expect(service.get('boolean')).toBe(true);
      expect(service.get('array')).toEqual([1, 2, 3]);
      expect(service.get('object')).toEqual({ nested: { value: 'deep' } });
    });

    it('should overwrite existing key', () => {
      const key = 'test-key';
      
      service.set(key, 'first-value', 60);
      expect(service.get(key)).toBe('first-value');

      service.set(key, 'second-value', 60);
      expect(service.get(key)).toBe('second-value');
    });
  });

  describe('TTL behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return value before TTL expires', () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 60; // 60 seconds

      service.set(key, value, ttl);

      // Advance time by 30 seconds (before expiry)
      jest.advanceTimersByTime(30 * 1000);

      const result = service.get(key);
      expect(result).toBe(value);
    });

    it('should return null after TTL expires', () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 60; // 60 seconds

      service.set(key, value, ttl);

      // Advance time by 61 seconds (after expiry)
      jest.advanceTimersByTime(61 * 1000);

      const result = service.get(key);
      expect(result).toBeNull();
    });

    it('should remove expired entry from cache', () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 60;

      service.set(key, value, ttl);

      // Advance time past expiry
      jest.advanceTimersByTime(61 * 1000);

      // First get should return null and delete the entry
      service.get(key);

      // Second get should also return null (entry was deleted)
      const result = service.get(key);
      expect(result).toBeNull();
    });

    it('should handle different TTL values correctly', () => {
      service.set('short', 'value1', 10);   // 10 seconds
      service.set('medium', 'value2', 60);  // 60 seconds
      service.set('long', 'value3', 3600);  // 1 hour

      // After 15 seconds
      jest.advanceTimersByTime(15 * 1000);
      expect(service.get('short')).toBeNull();
      expect(service.get('medium')).toBe('value2');
      expect(service.get('long')).toBe('value3');

      // After 65 seconds total
      jest.advanceTimersByTime(50 * 1000);
      expect(service.get('medium')).toBeNull();
      expect(service.get('long')).toBe('value3');

      // After 3700 seconds total
      jest.advanceTimersByTime(3640 * 1000);
      expect(service.get('long')).toBeNull();
    });

    it('should handle very short TTL (1 second)', () => {
      const key = 'test-key';
      const value = 'test-value';

      service.set(key, value, 1);

      // Before expiry
      expect(service.get(key)).toBe(value);

      // After expiry
      jest.advanceTimersByTime(1001);
      expect(service.get(key)).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing key', () => {
      const key = 'test-key';
      const value = 'test-value';

      service.set(key, value, 60);
      expect(service.get(key)).toBe(value);

      service.delete(key);
      expect(service.get(key)).toBeNull();
    });

    it('should not throw error when deleting non-existent key', () => {
      expect(() => service.delete('non-existent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all cached entries', () => {
      service.set('key1', 'value1', 60);
      service.set('key2', 'value2', 60);
      service.set('key3', 'value3', 60);

      expect(service.get('key1')).toBe('value1');
      expect(service.get('key2')).toBe('value2');
      expect(service.get('key3')).toBe('value3');

      service.clear();

      expect(service.get('key1')).toBeNull();
      expect(service.get('key2')).toBeNull();
      expect(service.get('key3')).toBeNull();
    });

    it('should allow setting new values after clear', () => {
      service.set('key1', 'old-value', 60);
      service.clear();
      service.set('key1', 'new-value', 60);

      expect(service.get('key1')).toBe('new-value');
    });
  });

  describe('cache enabled/disabled', () => {
    it('should not cache when CACHE_ENABLED is false', () => {
      const mockConfigService = {
        get: jest.fn().mockReturnValue('false'),
      };

      const module = Test.createTestingModule({
        providers: [
          CacheService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      module.then((mod) => {
        const disabledService = mod.get<CacheService>(CacheService);
        
        disabledService.set('key', 'value', 60);
        const result = disabledService.get('key');
        
        expect(result).toBeNull();
      });
    });

    it('should cache when CACHE_ENABLED is true', () => {
      service.set('key', 'value', 60);
      const result = service.get('key');
      expect(result).toBe('value');
    });
  });

  describe('multiple keys', () => {
    it('should handle multiple independent cache entries', () => {
      service.set('breeds:list', { breeds: [] }, 86400);
      service.set('breed-images:labrador', { images: [] }, 60);
      service.set('favourites:list', { favourites: [] }, 31536000);

      expect(service.get('breeds:list')).toEqual({ breeds: [] });
      expect(service.get('breed-images:labrador')).toEqual({ images: [] });
      expect(service.get('favourites:list')).toEqual({ favourites: [] });
    });

    it('should not affect other keys when deleting one', () => {
      service.set('key1', 'value1', 60);
      service.set('key2', 'value2', 60);
      service.set('key3', 'value3', 60);

      service.delete('key2');

      expect(service.get('key1')).toBe('value1');
      expect(service.get('key2')).toBeNull();
      expect(service.get('key3')).toBe('value3');
    });
  });
});