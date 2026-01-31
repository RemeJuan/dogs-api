import jwtDecode from 'jwt-decode';

type JwtPayload = { [key: string]: any } & { exp?: number | string };

export function getExpFromJwt(token: string | null | undefined): number | null {
  if (!token) return null;

  try {
    const payload = jwtDecode<JwtPayload>(token);

    if (typeof payload.exp === 'number') return payload.exp;
    if (typeof payload.exp === 'string') return parseInt(payload.exp, 10);

    return null;
  } catch (e) {
    return null;
  }
}

export function isExpired(
  token: string | null | undefined,
  leewaySec = 30,
): boolean {
  const exp = getExpFromJwt(token);
  if (!exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return exp <= now + leewaySec;
}
