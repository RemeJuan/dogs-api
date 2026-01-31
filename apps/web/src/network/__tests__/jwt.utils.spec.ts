import { getExpFromJwt, isExpired } from '@web/network/jwt.utils';

function makeJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString(
    'base64url',
  );
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('jwt.utils', () => {
  it('extracts numeric exp', () => {
    const now = Math.floor(Date.now() / 1000);
    const token = makeJwt({ exp: now + 60 });
    const exp = getExpFromJwt(token);

    expect(typeof exp).toBe('number');
    expect(exp).toBeGreaterThan(now);
  });

  it('extracts string exp', () => {
    const now = Math.floor(Date.now() / 1000);
    const token = makeJwt({ exp: String(now + 30) });
    const exp = getExpFromJwt(token);

    expect(typeof exp).toBe('number');
    expect(exp).toBe(now + 30);
  });

  it('returns null for invalid token', () => {
    expect(getExpFromJwt('not.a.jwt')).toBeNull();
    expect(getExpFromJwt('')).toBeNull();
    expect(getExpFromJwt(null as any)).toBeNull();
  });

  it('isExpired respects leeway', () => {
    const now = Math.floor(Date.now() / 1000);
    const token = makeJwt({ exp: now + 10 });

    expect(isExpired(token)).toBe(true);

    expect(isExpired(token, 0)).toBe(false);
  });
});
