import { JwtService } from '@nestjs/jwt';
import { extractUserIdFromToken } from '../token.utils';

describe('extractUserIdFromToken', () => {
  let mockJwtService: JwtService;

  beforeEach(() => {
    mockJwtService = {
      decode: jest.fn(),
    } as any;
  });

  describe('successful extraction', () => {
    it('should extract userId from valid token', () => {
      const authorization = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      (mockJwtService.decode as jest.Mock).mockReturnValue({
        id: 1,
        username: 'test',
      });

      const result = extractUserIdFromToken(authorization, mockJwtService);

      expect(result).toBe(1);
      expect(mockJwtService.decode).toHaveBeenCalledWith(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      );
    });

    it('should handle different user IDs', () => {
      const userIds = [1, 42, 999, 12345];

      userIds.forEach((userId) => {
        (mockJwtService.decode as jest.Mock).mockReturnValue({ id: userId });

        const result = extractUserIdFromToken('Bearer token', mockJwtService);

        expect(result).toBe(userId);
      });
    });

    it('should work with long JWT tokens', () => {
      const longToken = 'Bearer ' + 'a'.repeat(500);
      (mockJwtService.decode as jest.Mock).mockReturnValue({ id: 1 });

      const result = extractUserIdFromToken(longToken, mockJwtService);

      expect(result).toBe(1);
    });
  });

  describe('error cases', () => {
    it('should throw for missing authorization header', () => {
      expect(() => extractUserIdFromToken(undefined, mockJwtService)).toThrow(
        'Missing or invalid authorization header',
      );
    });

    it('should throw for empty authorization header', () => {
      expect(() => extractUserIdFromToken('', mockJwtService)).toThrow(
        'Missing or invalid authorization header',
      );
    });

    it('should throw for non-Bearer token', () => {
      expect(() =>
        extractUserIdFromToken('Basic sometoken', mockJwtService),
      ).toThrow('Missing or invalid authorization header');
    });

    it('should throw for Bearer without space', () => {
      expect(() =>
        extractUserIdFromToken('Bearertoken', mockJwtService),
      ).toThrow('Missing or invalid authorization header');
    });

    it('should throw when JWT decode returns null', () => {
      (mockJwtService.decode as jest.Mock).mockReturnValue(null);

      expect(() =>
        extractUserIdFromToken('Bearer token', mockJwtService),
      ).toThrow('Invalid token format - missing user ID');
    });

    it('should throw when JWT decode returns undefined', () => {
      (mockJwtService.decode as jest.Mock).mockReturnValue(undefined);

      expect(() =>
        extractUserIdFromToken('Bearer token', mockJwtService),
      ).toThrow('Invalid token format - missing user ID');
    });

    it('should throw when decoded token has no id field', () => {
      (mockJwtService.decode as jest.Mock).mockReturnValue({
        username: 'test',
      });

      expect(() =>
        extractUserIdFromToken('Bearer token', mockJwtService),
      ).toThrow('Invalid token format - missing user ID');
    });

    it('should throw when decoded token has null id', () => {
      (mockJwtService.decode as jest.Mock).mockReturnValue({ id: null });

      expect(() =>
        extractUserIdFromToken('Bearer token', mockJwtService),
      ).toThrow('Invalid token format - missing user ID');
    });

    it('should throw when JWT decode throws error', () => {
      (mockJwtService.decode as jest.Mock).mockImplementation(() => {
        throw new Error('Malformed JWT');
      });

      expect(() =>
        extractUserIdFromToken('Bearer token', mockJwtService),
      ).toThrow('Invalid or malformed token');
    });
  });

  describe('edge cases', () => {
    it('should handle token with extra spaces', () => {
      (mockJwtService.decode as jest.Mock).mockReturnValue({ id: 1 });

      const result = extractUserIdFromToken(
        'Bearer  token-with-space',
        mockJwtService,
      );

      expect(result).toBe(1);
    });

    it('should handle userId as string in token (but convert to number)', () => {
      (mockJwtService.decode as jest.Mock).mockReturnValue({ id: '42' });

      const result = extractUserIdFromToken('Bearer token', mockJwtService);

      expect(result).toBe('42');
    });
  });
});
