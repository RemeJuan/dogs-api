import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User,
} from '@dogs-api/shared-interfaces';
import * as authClient from '@web/network/auth.client';
import { getExpFromJwt, isExpired } from '@web/network/jwt.utils';
import { tokenStorage } from '@web/network/token.storage';

type AuthContextValue = {
  user: User | null;
  login: (body: LoginRequest) => Promise<LoginResponse>;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
  isAuthenticated: boolean;
  isRefreshing: boolean;
  error: Error | null;
  isLoginModalOpen: boolean;
  toggleLoginModal: (value?: boolean) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children?: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  function scheduleRefresh(accessToken: string | null) {
    if (!accessToken) return;

    const exp = getExpFromJwt(accessToken);
    if (!exp) return;

    const now = Math.floor(Date.now() / 1000);
    const leeway = 30; // seconds
    const ms = Math.max(0, (exp - now - leeway) * 1000);

    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = window.setTimeout(() => {
      void doRefresh();
    }, ms) as unknown as number;
  }

  async function doRefresh(): Promise<string | null> {
    const existing = refreshPromiseRef.current;

    if (existing) return existing;

    const prom = (async () => {
      setIsRefreshing(true);

      try {
        const refreshToken = tokenStorage.getRefreshToken();

        if (!refreshToken) {
          const e = new Error('no refresh token');
          setError(e);
          logout();

          return null;
        }
        const body: RefreshTokenRequest = { refreshToken };
        const res: RefreshTokenResponse = await authClient.refresh(body);

        tokenStorage.setTokens(res.accessToken, res.refreshToken);

        scheduleRefresh(res.accessToken);
        setError(null);

        return res.accessToken;
      } catch (e: any) {
        setError(e instanceof Error ? e : new Error(String(e)));

        logout();

        return null;
      } finally {
        setIsRefreshing(false);
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = prom;
    return prom;
  }

  function logout() {
    tokenStorage.clear();

    setUser(null);
    setError(null);
    setIsLoginModalOpen(false);

    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }

  async function login(body: LoginRequest): Promise<LoginResponse> {
    const res = await authClient.login(body);

    tokenStorage.setTokens(res.accessToken, res.refreshToken);
    tokenStorage.setUser(res);

    setUser(tokenStorage.getUser());
    setError(null);
    setIsLoginModalOpen(false);
    scheduleRefresh(res.accessToken);

    return res;
  }

  async function getAccessToken(): Promise<string | null> {
    const accessToken = tokenStorage.getAccessToken();

    if (!accessToken) return null;

    if (!isExpired(accessToken)) return accessToken;

    return await doRefresh();
  }

  useEffect(() => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    const storedUser = tokenStorage.getUser();

    if (!accessToken && !refreshToken) return;

    if (accessToken && !isExpired(accessToken)) {
      if (storedUser) setUser(storedUser);
      scheduleRefresh(accessToken);
    } else if (refreshToken) {
      void doRefresh();
    }

    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const toggleLoginModal = (value?: boolean) =>
    setIsLoginModalOpen((prev) => (typeof value === 'boolean' ? value : !prev));

  const value: AuthContextValue = {
    user,
    login,
    logout,
    getAccessToken,
    isAuthenticated: Boolean(user),
    isRefreshing,
    error,
    isLoginModalOpen,
    toggleLoginModal,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
