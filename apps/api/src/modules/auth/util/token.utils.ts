import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Extract userId from a Bearer token
 * @param authorization The Authorization header value (e.g., "Bearer xyz...")
 * @param jwtService JwtService instance for decoding
 * @returns The userId extracted from the token
 * @throws UnauthorizedException if token is invalid or missing userId
 */
export function extractUserIdFromToken(
  authorization: string | undefined,
  jwtService: JwtService,
): number {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing or invalid authorization header');
  }

  const accessToken = authorization.substring(7);

  try {
    const decoded = jwtService.decode(accessToken) as Record<string, number>;

    if (!decoded || !decoded.id) {
      throw new UnauthorizedException('Invalid token format - missing user ID');
    }

    return decoded.id;
  } catch (error) {
    if (error instanceof UnauthorizedException) {
      throw error;
    }
    throw new UnauthorizedException('Invalid or malformed token');
  }
}
