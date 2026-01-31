import type { LoginResponse, User } from '@dogs-api/shared-interfaces';

const ACCESS_KEY = 'dogs:accessToken';
const REFRESH_KEY = 'dogs:refreshToken';
const USER_KEY = 'dogs:user';

function safeGet(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {
    console.error(e.toString());
  }
}

function safeRemove(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch (e) {
    console.error(e);
  }
}

export const tokenStorage = {
  getAccessToken(): string | null {
    return safeGet(ACCESS_KEY);
  },
  getRefreshToken(): string | null {
    return safeGet(REFRESH_KEY);
  },
  setTokens(access: string, refresh: string) {
    safeSet(ACCESS_KEY, access);
    safeSet(REFRESH_KEY, refresh);
  },
  clearTokens() {
    safeRemove(ACCESS_KEY);
    safeRemove(REFRESH_KEY);
  },
  getUser(): User | null {
    try {
      const s = safeGet(USER_KEY);
      if (!s) return null;
      return JSON.parse(s) as User;
    } catch (e) {
      return null;
    }
  },
  setUser(userOrLogin: LoginResponse | User) {
    try {
      const { accessToken, refreshToken, ...user } = userOrLogin as any;
      safeSet(USER_KEY, JSON.stringify(user as User));
    } catch (e) {
      console.error(e);
    }
  },
  clear() {
    safeRemove(USER_KEY);
    this.clearTokens();
  },
};
